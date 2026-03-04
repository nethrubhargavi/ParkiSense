# Parkinson's Disease Physical Examination Module

**Phase 1: Production-Ready Clinical Assessment System**

This application provides decision-support tools for physical examination of Parkinson's Disease indicators. It is **not a diagnostic tool** and requires clinical judgment for interpretation.

## 🎯 Features Implemented (Phase 1)

### Physical Examination Module
1. **Hand Tremor Assessment** - Real-time camera analysis of hand tremors
2. **Voice Tremor Assessment** - Audio analysis for vocal characteristics (jitter, shimmer, F0)
3. **Facial Masking & Blink Rate** - Face mesh tracking for reduced facial expression and blink frequency

---

## 📋 Prerequisites

- **Python 3.8+** (recommended: 3.9 or 3.10)
- **Node.js 16+** and npm
- **Webcam** and **Microphone** access
- **Modern browser** (Chrome, Firefox, Edge)

---

## 🚀 Installation & Setup

### Step 1: Clone/Download Project

If you received this as files, ensure the directory structure is:
```
parkinsons-app/
├── backend/
└── frontend/
```

### Step 2: Backend Setup

Open your terminal (or VS Code integrated terminal) and navigate to the backend directory:

```bash
cd parkinsons-app/backend
```

**Create a Python virtual environment:**

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

**Install dependencies:**

```bash
pip install -r requirements.txt
```

**Note:** Installation may take 3-5 minutes as it includes MediaPipe, OpenCV, and librosa.

### Step 3: Frontend Setup

Open a **new terminal** (keep backend terminal open) and navigate to frontend:

```bash
cd parkinsons-app/frontend
```

**Install Node dependencies:**

```bash
npm install
```

This will install React, Vite, Recharts, and other dependencies (~1-2 minutes).

---

## ▶️ Running the Application

### Start Backend Server

In the **backend terminal** (with virtual environment activated):

```bash
uvicorn main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

The API is now running at `http://localhost:8000`

**Test it:** Open browser to `http://localhost:8000` - you should see:
```json
{
  "status": "online",
  "app": "Parkinson's Physical Examination API"
}
```

### Start Frontend Development Server

In the **frontend terminal**:

```bash
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

The app will automatically open in your browser at `http://localhost:5173`

---

## 🎮 Using the Application

### Physical Exam Page

You'll see three assessment cards displayed side-by-side:

#### 🔵 Hand Tremor Assessment

1. Click **"Start Camera"**
2. Allow camera access when prompted
3. Position your hands in the camera view
4. Click **"Run Tremor Test"**
5. View results including console output

**What it does:** Calls the existing `hand_tremor.py` script via the API

#### 🟢 Voice Tremor Assessment

1. Click **"Start Recording"**
2. Allow microphone access when prompted
3. Sustain "aaaah" sound for 5 seconds (timer will count down)
4. Recording stops automatically
5. Click **"Analyze Voice"**
6. View jitter, shimmer, F0 metrics

**What it does:** Calls the existing `voice_analysis.py` script via the API

#### 🟡 Facial Masking & Blink Rate

1. Click **"Start Camera"** (uses front camera)
2. Allow camera access
3. Click **"Start Recording"** - look at camera and blink naturally
4. Records for 10 seconds automatically
5. Click **"Run Face Analysis"**
6. View blink rate (blinks/min), total blinks, confidence

**Clinical Reference:**
- Normal: 15-20 blinks/min
- Parkinson's: Often <10 blinks/min

**What it does:** Uses MediaPipe Face Mesh to detect eye closure (blink detection)

---

## 🏗️ Architecture Overview

### Backend (FastAPI)

**main.py** - Central API router
- CORS enabled for local development
- Aggregates all examination endpoints

**hand_tremor_api.py** - Hand tremor endpoint (EXISTING - NOT MODIFIED)
- POST `/run-tremor-test`
- Calls `hand_tremor.py` subprocess

**voice_api.py** - Voice analysis endpoints (EXISTING - NOT MODIFIED)
- POST `/train-model` - Train ML model
- POST `/run-voice-test` - Analyze voice recording

**face_api.py** - Facial analysis endpoint (NEW)
- POST `/run-face-test`
- Uses MediaPipe Face Mesh
- Calculates Eye Aspect Ratio (EAR) for blink detection
- Processes uploaded video file

### Frontend (React + Vite)

**Component Structure:**
```
App.jsx
└── PhysicalExam.jsx
    ├── HandTremor.jsx
    ├── VoiceTest.jsx
    └── FaceAssessment.jsx
```

**Key Features:**
- HTML5 Camera API (getUserMedia)
- HTML5 Audio API (MediaRecorder)
- Fetch API for backend communication
- Real-time status updates
- Clean medical UI with professional styling

---

## 🔧 Troubleshooting

### Backend Issues

**"Module not found" errors:**
```bash
# Ensure virtual environment is activated
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# Reinstall requirements
pip install -r requirements.txt
```

**"Address already in use":**
```bash
# Change port
uvicorn main:app --reload --port 8001

# Update API_BASE in frontend components to http://localhost:8001
```

**Camera/MediaPipe errors:**
- Ensure webcam is connected and not used by other apps
- Check system camera permissions

### Frontend Issues

**"CORS policy" error in browser console:**
- Ensure backend is running on port 8000
- Check CORS middleware in `main.py` includes your frontend URL

**Camera/Microphone not working:**
- Must use HTTPS or localhost (HTTP works for localhost only)
- Check browser permissions (camera/microphone)
- Try different browser (Chrome recommended)

**"Network error" when running tests:**
- Confirm backend is running (`http://localhost:8000`)
- Check browser console for detailed error messages

---

## 📁 Project Structure

```
parkinsons-app/
├── backend/
│   ├── main.py                 # Main FastAPI app with all endpoints
│   ├── hand_tremor_api.py      # Existing hand tremor API
│   ├── voice_api.py            # Existing voice analysis API
│   ├── face_api.py             # NEW: Face mesh blink detection
│   ├── requirements.txt        # Python dependencies
│   ├── hand_tremor.py          # Your existing script (not provided)
│   ├── voice_analysis.py       # Your existing script (not provided)
│   └── train_model.py          # Your existing script (not provided)
│
└── frontend/
    ├── index.html              # HTML entry point
    ├── package.json            # Node dependencies
    ├── vite.config.js          # Vite configuration
    └── src/
        ├── main.jsx            # React entry point
        ├── App.jsx             # Main app component
        ├── pages/
        │   └── PhysicalExam.jsx    # Physical exam page
        ├── components/
        │   ├── HandTremor.jsx      # Hand tremor component
        │   ├── VoiceTest.jsx       # Voice test component
        │   └── FaceAssessment.jsx  # Face analysis component
        └── styles/
            └── app.css             # Global styles
```

---

## 🔐 Security & Privacy Notes

- All processing happens **locally** (no cloud upload)
- No data is stored persistently
- Camera/audio streams are temporary
- No authentication required (development mode)

**For production deployment:**
- Add user authentication
- Implement data encryption
- Add audit logging
- Secure API endpoints
- Use HTTPS

---

## 🚧 Future Phases (Not Implemented Yet)

The following modules are **scaffolded but not functional**:
- Patient History Questionnaire
- MRI/EEG/Blood Data Ingestion
- Combined PD Risk Score Calculation
- Admin Panel & User Management
- EMR Integration
- Export to PDF Reports

---

## 📊 API Endpoints

### GET `/`
Health check
```json
{
  "status": "online",
  "app": "Parkinson's Physical Examination API"
}
```

### POST `/run-tremor-test`
Execute hand tremor analysis
**Response:**
```json
{
  "status": "success",
  "console_output": "..."
}
```

### POST `/run-voice-test`
Execute voice tremor analysis
**Response:**
```json
{
  "status": "success",
  "console_output": "..."
}
```

### POST `/run-face-test`
Execute face analysis (expects multipart/form-data video upload)
**Response:**
```json
{
  "status": "success",
  "blink_rate": 12.5,
  "blink_count": 5,
  "confidence": 0.87,
  "duration_seconds": 10.2,
  "interpretation": "Normal blink rate"
}
```

---

## 💡 Tips for Development (VS Code)

### Recommended Extensions
- **Python** (Microsoft)
- **Pylance** (Microsoft)
- **ES7+ React/Redux/React-Native snippets**
- **ESLint**
- **Prettier - Code formatter**

### Multi-Terminal Workflow
1. Terminal 1: Backend server
2. Terminal 2: Frontend dev server
3. Terminal 3: Available for commands

### Quick Commands
```bash
# Backend
cd backend
venv\Scripts\activate  # or source venv/bin/activate
uvicorn main:app --reload

# Frontend
cd frontend
npm run dev

# Build for production
npm run build
```

---

## ⚕️ Clinical Notes

### Model Confidence Interpretation
- **>0.8**: High confidence - good signal quality
- **0.5-0.8**: Moderate confidence - acceptable
- **<0.5**: Low confidence - consider retesting

### Blink Rate Reference
- **Normal**: 15-20 blinks/minute
- **Low (<10)**: May indicate Parkinson's or fatigue
- **High (>25)**: Stress, dry eyes, or other conditions

### Important Disclaimers
⚠️ This system is for **decision support only**
⚠️ Not a replacement for clinical examination
⚠️ Results should be interpreted by qualified healthcare professionals
⚠️ Consider multiple factors in diagnosis (history, imaging, labs, etc.)

---

## 📞 Support

For issues or questions:
1. Check this README thoroughly
2. Review browser console for frontend errors
3. Check backend terminal for server errors
4. Ensure all prerequisites are installed correctly

---

## 📄 License & Attribution

- MediaPipe: Apache 2.0 License (Google)
- React: MIT License
- FastAPI: MIT License

**Medical Disclaimer:** This software is provided for research and educational purposes. It is not FDA-approved or intended for clinical diagnosis.

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Phase 1 Complete - Physical Examination Module
