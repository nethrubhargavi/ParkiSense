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

# ──────────────────────────────────────────────────────────
# Configuration constants
# ──────────────────────────────────────────────────────────
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_STRING_LENGTH = 500
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
# Demo credentials
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

PATIENTS_DB = {}
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

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
<<<<<<< HEAD
        "https://parki-sense.vercel.app",       # ← your production URL
        "https://parkisense.vercel.app",         # ← add any alternate spelling
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",  # ← covers ALL Vercel preview URLs
=======
        "https://parki-sense.vercel.app",
    ],
>>>>>>> ae6ffb8bbf49244eb2599dd1f532a652bf633124
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────────────────
# Global exception handler
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

def _sanitise(value: str, max_len: int = MAX_STRING_LENGTH):
    if not isinstance(value, str):
        return ""
    return value.strip()[:max_len]


def validate_token(authorization: str = Header(default=None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization token")

    token = authorization.replace("Bearer ", "")

    if token not in ACTIVE_TOKENS:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return ACTIVE_TOKENS[token]


async def validate_upload_size(file: UploadFile, max_bytes: int = MAX_UPLOAD_BYTES):
    content = await file.read()

    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail="File too large",
        )

    await file.seek(0)
    return content


def validate_file_extension(filename: str, allowed: set):
    _, ext = os.path.splitext((filename or "").lower())

    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed",
        )

# ──────────────────────────────────────────────────────────
# Health check
# ──────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "online"}

# ==================== AUTHENTICATION ====================

@app.post("/login")
@limiter.limit("10/minute")
def login(request: Request, credentials: dict):

    username = _sanitise(credentials.get("username", ""))
    password = credentials.get("password", "")

    if username not in USERS_DB or USERS_DB[username]["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

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
    return {"status": "success", "patients": patients_list}


@app.post("/patients")
def create_patient(patient_data: dict, _user: str = Depends(validate_token)):

    patient_id = f"patient_{len(PATIENTS_DB) + 1}_{datetime.now().timestamp()}"

    patient = {
        "id": patient_id,
        "firstName": _sanitise(patient_data.get("firstName", "")),
        "lastName": _sanitise(patient_data.get("lastName", "")),
        "dateOfBirth": _sanitise(patient_data.get("dateOfBirth", "")),
        "mrnNumber": _sanitise(patient_data.get("mrnNumber", "")),
        "email": _sanitise(patient_data.get("email", "")),
        "notes": _sanitise(patient_data.get("notes", ""), 2000),
        "doctorId": _sanitise(patient_data.get("doctorId", "")),
        "createdAt": datetime.now().isoformat(),
        "assessments": [],
    }

    PATIENTS_DB[patient_id] = patient

    return {"status": "success", "patient": patient}

# ==================== HAND TREMOR ====================

ALLOWED_VIDEO_EXTS = {".webm", ".mp4", ".avi", ".mov"}

@app.post("/run-tremor-test")
async def tremor_test_endpoint(video: UploadFile = File(...)):

    validate_file_extension(video.filename, ALLOWED_VIDEO_EXTS)
    await validate_upload_size(video)

    from hand_tremor_api import run_tremor_test

    return await run_tremor_test(video)

# ==================== VOICE ====================

ALLOWED_AUDIO_EXTS = {".webm", ".wav", ".mp3", ".ogg", ".m4a"}

@app.post("/run-voice-test")
async def voice_test_endpoint(audio: UploadFile = File(...)):

    validate_file_extension(audio.filename, ALLOWED_AUDIO_EXTS)
    await validate_upload_size(audio)

    from voice_api import run_voice_test

    return await run_voice_test(audio)

# ==================== FACE ====================

@app.post("/run-face-test")
async def face_test_endpoint(video: UploadFile = File(...)):

    validate_file_extension(video.filename, ALLOWED_VIDEO_EXTS)
    await validate_upload_size(video)

    from face_api import run_face_test

    return await run_face_test(video)

# ==================== REPORTS ====================

ALLOWED_REPORT_EXTS = {".pdf", ".png", ".jpg", ".jpeg"}

@app.post("/reports/analyze")
async def reports_analyze_endpoint(
    files: List[UploadFile] = File(...),
    report_type: str = "general",
):

    if report_type not in ALLOWED_REPORT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid report_type")

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
        port=int(os.environ.get("PORT", 8000)),
    )
