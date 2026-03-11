from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime

# In-memory storage (replace with database in production)
PATIENTS_DB = {}

USERS_DB = {
    "admin": {"password": "admin123", "name": "Dr. Admin", "id": "doc-001"},
    "doctor": {"password": "password", "name": "Dr. Doctor", "id": "doc-002"}
}

# Create FastAPI application
app = FastAPI(
    title="Parkinson's Disease Physical Examination API",
    description="Decision-support API for PD physical assessment (not diagnostic)",
    version="1.0.0"
)

# CORS configuration
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
        "http://127.0.0.1:5177"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== HEALTH CHECK ====================

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "Parkinson's Physical Examination API",
        "endpoints": {
            "hand_tremor": "/run-tremor-test",
            "voice_analysis": "/run-voice-test",
            "face_assessment": "/run-face-test",
            "train_voice_model": "/train-model",
            "login": "/login",
            "patients": "/patients"
        }
    }

# ==================== AUTHENTICATION ====================

@app.post("/login")
def login(credentials: dict):

    username = credentials.get("username", "")
    password = credentials.get("password", "")

    if username and password:

        token = f"token_{username}_{datetime.now().timestamp()}"

        if username in USERS_DB and USERS_DB[username]["password"] == password:
            return {
                "status": "success",
                "token": token,
                "doctorName": USERS_DB[username]["name"],
                "doctorId": USERS_DB[username]["id"]
            }

        return {
            "status": "success",
            "token": token,
            "doctorName": f"Dr. {username.title()}",
            "doctorId": f"doc-{username.lower()}"
        }

    return {"status": "error", "message": "Invalid credentials"}

# ==================== PATIENT MANAGEMENT ====================

@app.get("/patients")
def get_patients(authorization: str = None):

    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthorized")

    patients_list = list(PATIENTS_DB.values())

    return {
        "status": "success",
        "patients": patients_list,
        "count": len(patients_list)
    }


@app.post("/patients")
def create_patient(patient_data: dict):

    patient_id = f"patient_{len(PATIENTS_DB)+1}_{datetime.now().timestamp()}"

    patient = {
        "id": patient_id,
        "firstName": patient_data.get("firstName", ""),
        "lastName": patient_data.get("lastName", ""),
        "dateOfBirth": patient_data.get("dateOfBirth", ""),
        "mrnNumber": patient_data.get("mrnNumber", f"MRN{len(PATIENTS_DB)+1}"),
        "email": patient_data.get("email", ""),
        "notes": patient_data.get("notes", ""),
        "doctorId": patient_data.get("doctorId", ""),
        "createdAt": patient_data.get("createdAt", datetime.now().isoformat()),
        "assessments": []
    }

    PATIENTS_DB[patient_id] = patient

    return {
        "status": "success",
        "message": "Patient created successfully",
        "patient": patient
    }


@app.get("/patients/{patient_id}")
def get_patient(patient_id: str):

    if patient_id not in PATIENTS_DB:
        return {"status": "error", "message": "Patient not found"}

    return {"status": "success", "patient": PATIENTS_DB[patient_id]}


@app.delete("/patients/{patient_id}")
def delete_patient(patient_id: str):

    if patient_id not in PATIENTS_DB:
        return {"status": "error", "message": "Patient not found"}

    del PATIENTS_DB[patient_id]

    return {"status": "success", "message": "Patient deleted successfully"}


@app.put("/patients/{patient_id}")
def update_patient(patient_id: str, patient_data: dict):

    if patient_id not in PATIENTS_DB:
        return {"status": "error", "message": "Patient not found"}

    PATIENTS_DB[patient_id].update(patient_data)

    return {
        "status": "success",
        "message": "Patient updated successfully",
        "patient": PATIENTS_DB[patient_id]
    }

# ==================== SYMPTOMS ====================

@app.post("/symptoms")
def save_symptoms(symptoms_data: dict):

    patient_id = symptoms_data.get("patientId")

    if patient_id and patient_id in PATIENTS_DB:

        symptom_record = {
            "type": "symptoms",
            "onsetDate": symptoms_data.get("onsetDate"),
            "symptoms": symptoms_data.get("symptoms", []),
            "progressionSpeed": symptoms_data.get("progressionSpeed"),
            "notes": symptoms_data.get("notes"),
            "recordedAt": symptoms_data.get("recordedAt")
        }

        PATIENTS_DB[patient_id]["assessments"].append(symptom_record)

        return {
            "status": "success",
            "message": "Symptoms recorded successfully",
            "record": symptom_record
        }

    return {"status": "error", "message": "Patient not found"}


@app.get("/symptoms/{patient_id}")
def get_patient_symptoms(patient_id: str):

    if patient_id not in PATIENTS_DB:
        return {"status": "error", "message": "Patient not found"}

    patient = PATIENTS_DB[patient_id]

    symptoms_records = [
        a for a in patient.get("assessments", [])
        if a.get("type") == "symptoms"
    ]

    return {
        "status": "success",
        "symptoms": symptoms_records,
        "count": len(symptoms_records)
    }

# ==================== FAMILY HISTORY ====================

@app.post("/family-history")
def save_family_history(data: dict):

    patient_id = data.get("patientId")

    if patient_id and patient_id in PATIENTS_DB:

        record = {
            "type": "family_history",
            "hasFamilyHistory": data.get("hasFamilyHistory"),
            "familyMembers": data.get("familyMembers", []),
            "notes": data.get("notes"),
            "recordedAt": data.get("recordedAt")
        }

        PATIENTS_DB[patient_id]["assessments"].append(record)

        return {
            "status": "success",
            "message": "Family history recorded successfully",
            "record": record
        }

    return {"status": "error", "message": "Patient not found"}


@app.get("/family-history/{patient_id}")
def get_family_history(patient_id: str):

    if patient_id not in PATIENTS_DB:
        return {"status": "error", "message": "Patient not found"}

    patient = PATIENTS_DB[patient_id]

    records = [
        a for a in patient.get("assessments", [])
        if a.get("type") == "family_history"
    ]

    return {
        "status": "success",
        "familyHistory": records,
        "count": len(records)
    }

# ==================== AI TEST ENDPOINTS ====================

@app.post("/run-tremor-test")
async def tremor_test_endpoint(video: UploadFile = File(...)):

    from hand_tremor_api import run_tremor_test

    return await run_tremor_test(video)


@app.post("/train-model")
def train_model_endpoint():

    from voice_api import train_model

    return train_model()


@app.post("/run-voice-test")
async def voice_test_endpoint(audio: UploadFile = File(...)):

    from voice_api import run_voice_test

    return await run_voice_test(audio)


@app.post("/run-face-test")
async def face_test_endpoint(video: UploadFile = File(...)):

    from face_api import run_face_test

    return await run_face_test(video)


# ==================== SERVER ====================

if __name__ == "__main__":

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000
    )
