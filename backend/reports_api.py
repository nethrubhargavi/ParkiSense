from fastapi import File, UploadFile
import tempfile
import os
import shutil
import re
import logging
from typing import List

logger = logging.getLogger("reports_api")

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".txt"}



# ──────────────────────────────────────────────────────────
# Report-type specific keyword / reference configurations
# ──────────────────────────────────────────────────────────

BLOOD_KEYWORDS = [
    "hemoglobin", "hgb", "wbc", "rbc", "platelet", "hematocrit",
    "glucose", "hba1c", "creatinine", "bun", "cholesterol",
    "ldl", "hdl", "triglyceride", "ast", "alt", "bilirubin",
    "albumin", "tsh", "esr", "crp", "ferritin", "vitamin",
    "sodium", "potassium", "calcium", "uric acid",
    "elevated", "low", "high", "abnormal", "reduced",
    "anemia", "diabetes", "thyroid", "lipid",
]

MRI_KEYWORDS = [
    "lesion", "mass", "atrophy", "signal", "ventricle",
    "white matter", "grey matter", "cortex", "basal ganglia",
    "substantia nigra", "cerebellum", "brainstem",
    "infarct", "hemorrhage", "calcification", "edema",
    "enhancement", "t1", "t2", "flair", "diffusion",
    "impression", "finding", "conclusion", "diagnosis",
    "abnormal", "abnormality", "fracture",
]

PPG_KEYWORDS = [
    "heart rate", "hr", "spo2", "oxygen saturation",
    "perfusion", "pulse", "waveform", "amplitude",
    "systolic", "diastolic", "blood pressure",
    "ppg", "photoplethysmography", "bpm",
    "variability", "hrv", "arrhythmia", "irregular",
    "elevated", "low", "abnormal", "reduced",
]

GENERAL_KEYWORDS = [
    "abnormal", "abnormality", "elevated", "reduced", "low", "high",
    "lesion", "mass", "fracture", "infarct", "hemorrhage", "calcification",
    "impression", "finding", "conclusion", "diagnosis",
]

KEYWORD_MAP = {
    "blood": BLOOD_KEYWORDS,
    "mri": MRI_KEYWORDS,
    "ppg": PPG_KEYWORDS,
    "general": GENERAL_KEYWORDS,
}


async def analyze_reports(files: List[UploadFile] = File(...), report_type: str = "general"):
    """
    Accept multiple uploaded files, extract text from PDFs and images,
    combine into a single text block and return a type-aware analysis.

    report_type: blood | mri | ppg | general
    """
    tmp_dir = tempfile.mkdtemp(prefix="reports_")
    extracted_texts = []

    try:
        for upload in files:
            filename = upload.filename or "upload"
            _, ext = os.path.splitext(filename.lower())

            # Validate file extension
            if ext not in ALLOWED_EXTENSIONS:
                logger.warning("Skipping file with disallowed extension: %s", filename)
                extracted_texts.append(f"[Skipped: file type '{ext}' not allowed for {filename}]")
                continue

            tmp_path = os.path.join(tmp_dir, filename)
            content = await upload.read()
            with open(tmp_path, "wb") as f:
                f.write(content)

            if ext in [".pdf"]:
                try:
                    from PyPDF2 import PdfReader
                    reader = PdfReader(tmp_path)
                    text_parts = []
                    for p in reader.pages:
                        page_text = p.extract_text() or ""
                        text_parts.append(page_text)
                    extracted_texts.append("\n".join(text_parts))
                except Exception as e:
                    extracted_texts.append(f"[PDF parse error for {filename}: {str(e)}]")
            elif ext in [".png", ".jpg", ".jpeg"]:
                try:
                    from PIL import Image
                    import pytesseract
                    img = Image.open(tmp_path)
                    text = pytesseract.image_to_string(img)
                    extracted_texts.append(text)
                except Exception as e:
                    extracted_texts.append(f"[OCR error for {filename}: {str(e)}]")
            else:
                try:
                    with open(tmp_path, "r", encoding="utf-8") as tf:
                        extracted_texts.append(tf.read())
                except Exception:
                    extracted_texts.append(f"[Unsupported file format: {filename}]")

        combined_text = "\n\n".join(extracted_texts).strip()
        analysis = type_aware_analysis(combined_text, report_type)

        return {
            "status": "success",
            "reportType": report_type,
            "extractedText": combined_text,
            "analysis": analysis,
        }

    finally:
        try:
            shutil.rmtree(tmp_dir)
        except Exception:
            pass


# ──────────────────────────────────────────────────────────
#  Analysis helpers
# ──────────────────────────────────────────────────────────

def type_aware_analysis(text: str, report_type: str = "general") -> dict:
    """
    Produce a structured analysis tailored to the report type.
    """
    if not text or not text.strip():
        return {
            "summary": "No extractable text found in the uploaded files.",
            "keyFindings": [],
            "abnormalIndicators": [],
            "healthInsights": ["No insights available — the file may be empty or unreadable."],
        }

    sentences = re.split(r'(?<=[.!?])\s+', text)
    # Also split on newlines for reports that don't use periods
    if len(sentences) <= 2:
        sentences = [s.strip() for s in text.split("\n") if s.strip()]

    keywords = KEYWORD_MAP.get(report_type, GENERAL_KEYWORDS)

    # ── Summary ─────────────────────────────────────────
    summary_sentences = [s.strip() for s in sentences if len(s.strip()) > 15][:4]
    summary = " ".join(summary_sentences) if summary_sentences else (sentences[0] if sentences else "")

    # ── Key Findings ────────────────────────────────────
    key_findings = []
    for s in sentences:
        lower_s = s.lower()
        for kw in keywords:
            if kw in lower_s:
                key_findings.append(s.strip())
                break

    # ── Abnormal Indicators ─────────────────────────────
    abnormal_indicators = []
    numeric_pattern = re.compile(
        r"\b(?:\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+\.\d+)\s*"
        r"(?:mg/dL|mmHg|g/dL|cm|mm|%|x10\^?\d*/[uU][lL]|"
        r"fL|pg|mEq/L|U/L|mIU/L|mm/hr|mg/L|ng/mL|pg/mL|"
        r"bpm|ms|mV|mW)?\b",
        re.IGNORECASE,
    )
    alert_words = ["abnormal", "elevated", "high", "low", "reduced", "decreased", "increased"]
    for s in sentences:
        if any(kw in s.lower() for kw in alert_words):
            matches = numeric_pattern.findall(s)
            if matches:
                abnormal_indicators.append({"sentence": s.strip(), "values": matches})

    if not abnormal_indicators:
        for s in sentences:
            matches = numeric_pattern.findall(s)
            if matches and len(matches) <= 5:
                abnormal_indicators.append({"sentence": s.strip(), "values": matches})

    # ── Health Insights (non-diagnostic) ────────────────
    insights = _build_insights(report_type, key_findings, abnormal_indicators)

    return {
        "summary": summary,
        "keyFindings": key_findings[:12],
        "abnormalIndicators": abnormal_indicators[:12],
        "healthInsights": insights,
    }


def _build_insights(report_type: str, key_findings: list, abnormal_indicators: list) -> list:
    """Return a list of non-diagnostic insight strings tailored to report_type."""
    insights = []

    if report_type == "blood":
        insights.append(
            "Blood test values should be compared against the laboratory's own reference ranges, "
            "which may vary by age, sex, and methodology."
        )
        if abnormal_indicators:
            insights.append("Some numeric values were detected near alert keywords — review these with your physician.")
    elif report_type == "mri":
        insights.append(
            "MRI findings should always be interpreted in clinical context by a qualified radiologist."
        )
        if key_findings:
            insights.append("Imaging-related terms were identified — correlate with clinical presentation.")
    elif report_type == "ppg":
        insights.append(
            "PPG-derived metrics (heart rate, SpO2) are screening tools; confirm with clinical-grade devices."
        )
    else:
        insights.append(
            "This report was analysed with general-purpose keywords. For more specific insights, "
            "upload under the appropriate category (Blood, MRI, or PPG)."
        )

    insights.append(
        "This summary is informational and not a medical diagnosis. "
        "Consult a clinician for interpretation."
    )
    if not key_findings and not abnormal_indicators:
        insights.append(
            "No obvious findings detected by this basic analysis. "
            "Consider manual review or a specialised AI model for deeper analysis."
        )

    return insights
