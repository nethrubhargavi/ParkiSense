import os
import json
import logging
import secrets
from datetime import datetime
from typing import List

from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from sqlalchemy import create_engine, text

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# ==================== CONFIG ====================

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_STRING_LENGTH = 500
ALLOWED_REPORT_TYPES = {"blood", "mri", "ppg", "general"}

logger = logging.getLogger("parkinsons_api")
logging.basicConfig(level=logging.INFO)

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

# ==================== DATABASE ====================

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def get_db():
    with engine.connect() as conn:
        yield conn

# ==================== APP SETUP ====================

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Parkinson's Disease Physical Examination API",
    description="Decision-support API for PD physical assessment (not diagnostic)",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://parki-sense.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Internal server error"},
    )

# ==================== HELPERS ====================

def _sanitise(value: str, max_len: int = MAX_STRING_LENGTH):
    if not isinstance(value, str):
        return ""
    return value.strip()[:max_len]

def validate_token(authorization: str = Header(default=None), db=Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization token")
    token = authorization.replace("Bearer ", "")
    result = db.execute(text("SELECT username FROM active_tokens WHERE token = :token"), {"token": token})
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return row["username"]

async def validate_upload_size(file: UploadFile, max_bytes: int = MAX_UPLOAD_BYTES):
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail="File too large")
    await file.seek(0)
    return content

def validate_file_extension(filename: str, allowed: set):
    _, ext = os.path.splitext((filename or "").lower())
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"File type '{ext}' not allowed")

# ==================== HEALTH CHECK ====================

@app.get("/")
def root():
    return {"status": "online"}

# ==================== AUTHENTICATION ====================

@app.post("/login")
@limiter.limit("10/minute")
def login(request: Request, credentials: dict, db=Depends(get_db)):
    username = _sanitise(credentials.get("username", ""))
    password = credentials.get("password", "")
    if username not in USERS_DB or USERS_DB[username]["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = secrets.token_hex(32)
    db.execute(text("""
        INSERT INTO active_tokens (token, username, created_at)
        VALUES (:token, :username, :created_at)
    """), {
        "token": token,
        "username": username,
        "created_at": datetime.now(),
    })
    db.commit()
    return {
        "status": "success",
        "token": token,
        "doctorName": USERS_DB[username]["name"],
        "doctorId": USERS_DB[username]["id"],
    }

@app.post("/register")
@limiter.limit("5/minute")
def register(request: Request, data: dict, db=Depends(get_db)):
    username = _sanitise(data.get("username", ""))
    password = data.get("password", "")
    full_name = _sanitise(data.get("fullName", ""))

    if not username or not password or not full_name:
        raise HTTPException(status_code=400, detail="username, password, and fullName are required")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if username in USERS_DB:
        raise HTTPException(status_code=409, detail="Username already exists")

    doctor_id = f"doc-{secrets.token_hex(4)}"
    USERS_DB[username] = {
        "password": password,
        "name": full_name,
        "id": doctor_id,
    }

    token = secrets.token_hex(32)
    db.execute(text("""
        INSERT INTO active_tokens (token, username, created_at)
        VALUES (:token, :username, :created_at)
    """), {
        "token": token,
        "username": username,
        "created_at": datetime.now(),
    })
    db.commit()

    return {
        "status": "success",
        "token": token,
        "doctorName": full_name,
        "doctorId": doctor_id,
    }

# ==================== PATIENT MANAGEMENT ====================

@app.get("/patients")
def get_patients(user: str = Depends(validate_token), db=Depends(get_db)):
    doctor_id = USERS_DB.get(user, {}).get("id")
    result = db.execute(text("SELECT * FROM patients WHERE doctor_id = :doctor_id"), {"doctor_id": doctor_id})
    rows = result.mappings().all()
    patients = []
    for row in rows:
        patients.append({
            "id": row["id"],
            "firstName": row["first_name"],
            "lastName": row["last_name"],
            "dateOfBirth": row["date_of_birth"],
            "mrnNumber": row["mrn_number"],
            "email": row["email"],
            "notes": row["notes"],
            "doctorId": row["doctor_id"],
            "createdAt": row["created_at"],
            "assessments": row["assessments"] or [],
        })
    return {"status": "success", "patients": patients}

@app.post("/patients")
def create_patient(patient_data: dict, _user: str = Depends(validate_token), db=Depends(get_db)):
    patient_id = f"patient_{datetime.now().timestamp()}"
    first_name = _sanitise(patient_data.get("firstName", ""))
    last_name = _sanitise(patient_data.get("lastName", ""))
    date_of_birth = _sanitise(patient_data.get("dateOfBirth", ""))
    mrn_number = _sanitise(patient_data.get("mrnNumber", ""))
    email = _sanitise(patient_data.get("email", ""))
    notes = _sanitise(patient_data.get("notes", ""), 2000)
    doctor_id = _sanitise(patient_data.get("doctorId", ""))
    created_at = datetime.now().isoformat()

    db.execute(text("""
        INSERT INTO patients (id, first_name, last_name, date_of_birth, mrn_number, email, notes, doctor_id, created_at, assessments)
        VALUES (:id, :first_name, :last_name, :date_of_birth, :mrn_number, :email, :notes, :doctor_id, :created_at, :assessments)
    """), {
        "id": patient_id,
        "first_name": first_name,
        "last_name": last_name,
        "date_of_birth": date_of_birth,
        "mrn_number": mrn_number,
        "email": email,
        "notes": notes,
        "doctor_id": doctor_id,
        "created_at": created_at,
        "assessments": json.dumps([]),
    })
    db.commit()
    return {"status": "success", "patient": {
        "id": patient_id,
        "firstName": first_name,
        "lastName": last_name,
        "dateOfBirth": date_of_birth,
        "mrnNumber": mrn_number,
        "email": email,
        "notes": notes,
        "doctorId": doctor_id,
        "createdAt": created_at,
        "assessments": [],
    }}

@app.delete("/patients/{patient_id}")
def delete_patient(patient_id: str, _user: str = Depends(validate_token), db=Depends(get_db)):
    result = db.execute(text("DELETE FROM patients WHERE id = :id"), {"id": patient_id})
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"status": "success"}

# ==================== FAMILY HISTORY ====================

@app.post("/family-history")
def save_family_history(data: dict, _user: str = Depends(validate_token), db=Depends(get_db)):
    patient_id = data.get("patientId")
    if not patient_id:
        raise HTTPException(status_code=400, detail="patientId is required")
    db.execute(text("""
        INSERT INTO family_history (patient_id, has_family_history, family_members, notes, recorded_at)
        VALUES (:patient_id, :has_family_history, :family_members, :notes, :recorded_at)
        ON CONFLICT (patient_id) DO UPDATE SET
            has_family_history = EXCLUDED.has_family_history,
            family_members = EXCLUDED.family_members,
            notes = EXCLUDED.notes,
            recorded_at = EXCLUDED.recorded_at
    """), {
        "patient_id": patient_id,
        "has_family_history": data.get("hasFamilyHistory"),
        "family_members": json.dumps(data.get("familyMembers", [])),
        "notes": _sanitise(data.get("notes", ""), 2000),
        "recorded_at": data.get("recordedAt"),
    })
    db.commit()
    return {"status": "success", "data": data}

@app.get("/family-history/{patient_id}")
def get_family_history(patient_id: str, _user: str = Depends(validate_token), db=Depends(get_db)):
    result = db.execute(text("SELECT * FROM family_history WHERE patient_id = :id"), {"id": patient_id})
    row = result.mappings().first()
    if not row:
        return {"status": "success", "data": None}
    return {"status": "success", "data": {
        "patientId": row["patient_id"],
        "hasFamilyHistory": row["has_family_history"],
        "familyMembers": row["family_members"] or [],
        "notes": row["notes"],
        "recordedAt": row["recorded_at"],
    }}

# ==================== SYMPTOMS ====================

@app.post("/symptoms")
def save_symptoms(data: dict, _user: str = Depends(validate_token), db=Depends(get_db)):
    patient_id = data.get("patientId")
    if not patient_id:
        raise HTTPException(status_code=400, detail="patientId is required")
    db.execute(text("""
        INSERT INTO symptoms (patient_id, data)
        VALUES (:patient_id, :data)
        ON CONFLICT (patient_id) DO UPDATE SET data = EXCLUDED.data
    """), {
        "patient_id": patient_id,
        "data": json.dumps(data),
    })
    db.commit()
    return {"status": "success", "data": data}

@app.get("/symptoms/{patient_id}")
def get_symptoms(patient_id: str, _user: str = Depends(validate_token), db=Depends(get_db)):
    result = db.execute(text("SELECT data FROM symptoms WHERE patient_id = :id"), {"id": patient_id})
    row = result.mappings().first()
    if not row:
        return {"status": "success", "data": None}
    return {"status": "success", "data": row["data"]}

# ==================== HAND TREMOR ====================

ALLOWED_VIDEO_EXTS = {".webm", ".mp4", ".avi", ".mov"}
ALLOWED_AUDIO_EXTS = {".webm", ".wav", ".mp3", ".ogg", ".m4a"}
ALLOWED_REPORT_EXTS = {".pdf", ".png", ".jpg", ".jpeg"}

@app.post("/run-tremor-test")
async def tremor_test_endpoint(video: UploadFile = File(...)):
    validate_file_extension(video.filename, ALLOWED_VIDEO_EXTS)
    await validate_upload_size(video)
    from hand_tremor_api import run_tremor_test
    return await run_tremor_test(video)

# ==================== VOICE ====================

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

# ==================== ENTRY POINT ====================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
    )