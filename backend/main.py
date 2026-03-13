import os
import re
import logging
import secrets
from datetime import datetime
from typing import List

from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Import existing API modules
from hand_tremor_api import app as hand_tremor_app
from voice_api import app as voice_app
from face_api import run_face_test

# ──────────────────────────────────────────────────────────
# Configuration constants
# ──────────────────────────────────────────────────────────
MAX_UPLOAD_BYTES = 10 * 1024 * 1024          # 10 MB per file
MAX_STRING_LENGTH = 500                       # Max chars for text inputs
ALLOWED_REPORT_TYPES = {"blood", "mri", "ppg", "general"}
PATIENT_WRITABLE_FIELDS = {
    "firstName", "lastName", "dateOfBirth",
    "mrnNumber", "email", "notes", "doctorId",
}

# ──────────────────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────────────────
logger = logging.getLogger("parkinsons_api")
logging.basicConfig(level=logging.INFO)

# ──────────────────────────────────────────────────────────
# Demo credentials — read from env vars, fall back to defaults
# ──────────────────────────────────────────────────────────
USERS_DB = {
    os.getenv("DEMO_USER_1", "admin"): {
        "password": os.getenv("DEMO_PASS_1", "admin123"),
        "name": "Dr. Admin",
        "id": "doc-001",
    },
    os.getenv("DEMO_USER_2", "doctor"): {
        "password": os.getenv("DEMO_PASS_2", "password"),
        "name": "Dr. Doctor",
        "id": "doc-002",
    },
}

# In-memory storage (replace with database in production)
PATIENTS_DB = {}

# Active tokens store  (token → username)
ACTIVE_TOKENS = {}

# ──────────────────────────────────────────────────────────
# Rate limiter
# ──────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ──────────────────────────────────────────────────────────
# FastAPI application
# ──────────────────────────────────────────────────────────
app = FastAPI(
    title="Parkinson's Disease Physical Examination API",
    description="Decision-support API for PD physical assessment (not diagnostic)",
    version="1.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — scoped to local dev origins, explicit methods
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:5177",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────
# Global exception handler — never leak tracebacks
# ──────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Internal server error"},
    )


# ──────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────

def _sanitise(value: str, max_len: int = MAX_STRING_LENGTH) -> str:
    """Strip and truncate a string input."""
    if not isinstance(value, str):
        return ""
    return value.strip()[:max_len]


def validate_token(authorization: str = Header(default=None)):
    """Dependency: verify that the request carries a valid token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization token")
    token = authorization.replace("Bearer ", "")
    if token not in ACTIVE_TOKENS:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return ACTIVE_TOKENS[token]


async def validate_upload_size(file: UploadFile, max_bytes: int = MAX_UPLOAD_BYTES):
    """Read an UploadFile, reject if it exceeds max_bytes."""
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(content)} bytes). Max allowed: {max_bytes} bytes",
        )
    await file.seek(0)  # rewind so downstream can read again
    return content


def validate_file_extension(filename: str, allowed: set) -> str:
    """Return lower-cased extension if it's in the allowed set, else raise 400."""
    _, ext = os.path.splitext((filename or "").lower())
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed. Allowed: {sorted(allowed)}",
        )
    return ext


# ──────────────────────────────────────────────────────────
# Health check
# ──────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status": "online",
        "app": "Parkinson's Physical Examination API",
        "endpoints": {
            "hand_tremor": "/run-tremor-test",
            "voice_analysis": "/run-voice-test",
            "face_assessment": "/run-face-test",
            "reports": "/reports/analyze",
            "train_voice_model": "/train-model",
            "login": "/login",
            "patients": "/patients",
        },
    }


# ==================== AUTHENTICATION ====================

@app.post("/login")
@limiter.limit("10/minute")
def login(request: Request, credentials: dict):
    """
    Authenticate a doctor and return a token.
    Rate-limited to 10 attempts / minute.
    """
    username = _sanitise(credentials.get("username", ""))
    password = credentials.get("password", "")

    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")

    # Validate credentials against known users
    if username not in USERS_DB or USERS_DB[username]["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Issue a cryptographically random token
    token = secrets.token_hex(32)
    ACTIVE_TOKENS[token] = username
    return {
        "status": "success",
        "token": token,
        "doctorName": USERS_DB[username]["name"],
        "doctorId": USERS_DB[username]["id"],
    }


# ==================== PATIENT MANAGEMENT ====================

@app.get("/patients")
def get_patients(_user: str = Depends(validate_token)):
    patients_list = list(PATIENTS_DB.values())
    return {"status": "success", "patients": patients_list, "count": len(patients_list)}


@app.post("/patients")
def create_patient(patient_data: dict, _user: str = Depends(validate_token)):
    patient_id = f"patient_{len(PATIENTS_DB) + 1}_{datetime.now().timestamp()}"
    patient = {
        "id": patient_id,
        "firstName": _sanitise(patient_data.get("firstName", "")),
        "lastName": _sanitise(patient_data.get("lastName", "")),
        "dateOfBirth": _sanitise(patient_data.get("dateOfBirth", "")),
        "mrnNumber": _sanitise(patient_data.get("mrnNumber", f"MRN{len(PATIENTS_DB) + 1}")),
        "email": _sanitise(patient_data.get("email", "")),
        "notes": _sanitise(patient_data.get("notes", ""), max_len=2000),
        "doctorId": _sanitise(patient_data.get("doctorId", "")),
        "createdAt": patient_data.get("createdAt", datetime.now().isoformat()),
        "assessments": [],
    }
    PATIENTS_DB[patient_id] = patient
    return {"status": "success", "message": "Patient created successfully", "patient": patient}


@app.get("/patients/{patient_id}")
def get_patient(patient_id: str, _user: str = Depends(validate_token)):
    if patient_id not in PATIENTS_DB:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"status": "success", "patient": PATIENTS_DB[patient_id]}


@app.delete("/patients/{patient_id}")
def delete_patient(patient_id: str, _user: str = Depends(validate_token)):
    if patient_id not in PATIENTS_DB:
        raise HTTPException(status_code=404, detail="Patient not found")
    del PATIENTS_DB[patient_id]
    return {"status": "success", "message": "Patient deleted successfully"}


@app.put("/patients/{patient_id}")
def update_patient(patient_id: str, patient_data: dict, _user: str = Depends(validate_token)):
    if patient_id not in PATIENTS_DB:
        raise HTTPException(status_code=404, detail="Patient not found")
    # Only allow whitelisted fields to be updated
    for key in patient_data:
        if key in PATIENT_WRITABLE_FIELDS:
            PATIENTS_DB[patient_id][key] = _sanitise(str(patient_data[key]))
    return {
        "status": "success",
        "message": "Patient updated successfully",
        "patient": PATIENTS_DB[patient_id],
    }


# ==================== SYMPTOMS ====================

@app.post("/symptoms")
def save_symptoms(symptoms_data: dict, _user: str = Depends(validate_token)):
    patient_id = symptoms_data.get("patientId")
    if not patient_id or patient_id not in PATIENTS_DB:
        raise HTTPException(status_code=404, detail="Patient not found")

    if "assessments" not in PATIENTS_DB[patient_id]:
        PATIENTS_DB[patient_id]["assessments"] = []

    symptom_record = {
        "type": "symptoms",
        "onsetDate": _sanitise(symptoms_data.get("onsetDate", "")),
        "symptoms": symptoms_data.get("symptoms", [])[:50],  # cap list length
        "progressionSpeed": _sanitise(symptoms_data.get("progressionSpeed", "")),
        "notes": _sanitise(symptoms_data.get("notes", ""), max_len=2000),
        "recordedAt": symptoms_data.get("recordedAt"),
    }
    PATIENTS_DB[patient_id]["assessments"].append(symptom_record)
    return {"status": "success", "message": "Symptoms recorded successfully", "record": symptom_record}


@app.get("/symptoms/{patient_id}")
def get_patient_symptoms(patient_id: str, _user: str = Depends(validate_token)):
    if patient_id not in PATIENTS_DB:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient = PATIENTS_DB[patient_id]
    records = [a for a in patient.get("assessments", []) if a.get("type") == "symptoms"]
    return {"status": "success", "symptoms": records, "count": len(records)}


# ==================== FAMILY HISTORY ====================

@app.post("/family-history")
def save_family_history(family_history_data: dict, _user: str = Depends(validate_token)):
    patient_id = family_history_data.get("patientId")
    if not patient_id or patient_id not in PATIENTS_DB:
        raise HTTPException(status_code=404, detail="Patient not found")

    if "assessments" not in PATIENTS_DB[patient_id]:
        PATIENTS_DB[patient_id]["assessments"] = []

    record = {
        "type": "family_history",
        "hasFamilyHistory": family_history_data.get("hasFamilyHistory"),
        "familyMembers": family_history_data.get("familyMembers", [])[:20],
        "notes": _sanitise(family_history_data.get("notes", ""), max_len=2000),
        "recordedAt": family_history_data.get("recordedAt"),
    }
    PATIENTS_DB[patient_id]["assessments"].append(record)
    return {"status": "success", "message": "Family history recorded successfully", "record": record}


@app.get("/family-history/{patient_id}")
def get_patient_family_history(patient_id: str, _user: str = Depends(validate_token)):
    if patient_id not in PATIENTS_DB:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient = PATIENTS_DB[patient_id]
    records = [a for a in patient.get("assessments", []) if a.get("type") == "family_history"]
    return {"status": "success", "familyHistory": records, "count": len(records)}


# ==================== HAND TREMOR ====================

ALLOWED_VIDEO_EXTS = {".webm", ".mp4", ".avi", ".mov"}

@app.post("/run-tremor-test")
@limiter.limit("20/minute")
async def tremor_test_endpoint(request: Request, video: UploadFile = File(...)):
    validate_file_extension(video.filename, ALLOWED_VIDEO_EXTS)
    await validate_upload_size(video)
    from hand_tremor_api import run_tremor_test
    return await run_tremor_test(video)


# ==================== VOICE ====================

ALLOWED_AUDIO_EXTS = {".webm", ".wav", ".mp3", ".ogg", ".m4a"}

@app.post("/train-model")
@limiter.limit("5/minute")
def train_model_endpoint(request: Request):
    from voice_api import train_model
    return train_model()


@app.post("/run-voice-test")
@limiter.limit("20/minute")
async def voice_test_endpoint(request: Request, audio: UploadFile = File(...)):
    validate_file_extension(audio.filename, ALLOWED_AUDIO_EXTS)
    await validate_upload_size(audio)
    from voice_api import run_voice_test
    return await run_voice_test(audio)


# ==================== FACE ====================

@app.post("/run-face-test")
@limiter.limit("20/minute")
async def face_test_endpoint(request: Request, video: UploadFile = File(...)):
    validate_file_extension(video.filename, ALLOWED_VIDEO_EXTS)
    await validate_upload_size(video)
    return await run_face_test(video)


# ==================== REPORTS ====================

ALLOWED_REPORT_EXTS = {".pdf", ".png", ".jpg", ".jpeg"}

@app.post("/reports/analyze")
@limiter.limit("15/minute")
async def reports_analyze_endpoint(
    request: Request,
    files: List[UploadFile] = File(...),
    report_type: str = "general",
):
    # Validate report type
    if report_type not in ALLOWED_REPORT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid report_type '{report_type}'. Allowed: {sorted(ALLOWED_REPORT_TYPES)}",
        )
    # Validate each file
    for f in files:
        validate_file_extension(f.filename, ALLOWED_REPORT_EXTS)
        await validate_upload_size(f)

    from reports_api import analyze_reports
    return await analyze_reports(files, report_type)


# ──────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
