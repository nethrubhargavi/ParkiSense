# VS Code Quick Start Guide

## For Developers New to React

This guide walks you through setting up and running the Parkinson's assessment app in Visual Studio Code.

---

## Step-by-Step Setup in VS Code

### 1. Open Project in VS Code

1. Launch Visual Studio Code
2. Click **File → Open Folder**
3. Navigate to and select the `parkinsons-app` folder
4. Click **Select Folder**

You should now see the project structure in the Explorer sidebar.

---

### 2. Install Python Extension

1. Click the **Extensions** icon in the left sidebar (or press `Ctrl+Shift+X`)
2. Search for "Python"
3. Install the **Python** extension by Microsoft
4. Restart VS Code if prompted

---

### 3. Set Up Backend

#### Open Integrated Terminal

1. Click **Terminal → New Terminal** (or press `` Ctrl+` ``)
2. You'll see a terminal at the bottom of VS Code

#### Navigate to Backend

```bash
cd backend
```

#### Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` appear at the start of your terminal prompt.

#### Install Python Packages

```bash
pip install -r requirements.txt
```

⏱️ This will take 3-5 minutes. You'll see packages being downloaded and installed.

**Expected output:**
```
Collecting fastapi==0.109.0
Downloading fastapi-0.109.0...
...
Successfully installed fastapi-0.109.0 uvicorn-0.27.0 ...
```

---

### 4. Set Up Frontend

#### Open Second Terminal

1. Click the **+** icon in the terminal panel to open a new terminal
2. OR click the split terminal icon to split the view

#### Navigate to Frontend

```bash
cd frontend
```

#### Install Node Packages

```bash
npm install
```

⏱️ This will take 1-2 minutes.

**Expected output:**
```
added 250 packages, and audited 251 packages in 45s
...
found 0 vulnerabilities
```

---

### 5. Run the Application

Now you should have **two terminals open in VS Code**:
- Terminal 1: backend (with venv activated)
- Terminal 2: frontend

#### Terminal 1 (Backend) - Start API Server

Make sure you're in the `backend` folder and venv is activated:

```bash
uvicorn main:app --reload
```

**Success output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

✅ Backend is now running at `http://localhost:8000`

#### Terminal 2 (Frontend) - Start Dev Server

Make sure you're in the `frontend` folder:

```bash
npm run dev
```

**Success output:**
```
  VITE v5.0.8  ready in 523 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

✅ Frontend is now running at `http://localhost:5173`

The app should automatically open in your browser!

---

### 6. Test the Application

#### In Your Browser (http://localhost:5173)

You should see:
- Header: "🏥 Parkinson's Disease Assessment"
- Three cards: Hand Tremor, Voice Test, Face Assessment

#### Test Hand Tremor:
1. Click "Start Camera"
2. Allow camera access
3. Click "Run Tremor Test"
4. Wait for results

#### Test Voice:
1. Click "Start Recording"
2. Allow microphone access
3. Say "aaaah" for 5 seconds
4. Click "Analyze Voice"
5. Wait for results

#### Test Face Assessment:
1. Click "Start Camera"
2. Click "Start Recording"
3. Look at camera and blink naturally for 10 seconds
4. Click "Run Face Analysis"
5. View blink rate results

---

## Common VS Code Tasks

### Stop Servers

**Stop Backend:**
- Go to Terminal 1 (backend)
- Press `Ctrl+C`

**Stop Frontend:**
- Go to Terminal 2 (frontend)
- Press `Ctrl+C`

### Restart Servers

**Backend:**
```bash
# In backend terminal with venv activated
uvicorn main:app --reload
```

**Frontend:**
```bash
# In frontend terminal
npm run dev
```

### View Files

- Click on any file in the Explorer sidebar to open it
- Use `Ctrl+P` to quickly open files by name

### Search Across Project

- Press `Ctrl+Shift+F` to search all files
- Useful for finding where functions or components are used

### Format Code

1. Install **Prettier** extension
2. Right-click in a file → **Format Document**
3. OR press `Shift+Alt+F`

---

## Troubleshooting in VS Code

### "Command not found: python"

**Windows:**
- Try `py -m venv venv` instead of `python -m venv venv`

**Mac/Linux:**
- Use `python3` instead of `python`

### Terminal Shows Wrong Directory

Check your current directory:
```bash
pwd  # Mac/Linux
cd   # Windows
```

Navigate to correct folder:
```bash
cd backend   # or
cd frontend
```

### Virtual Environment Not Activating

**Windows:**
```bash
# If you see an error about execution policy:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Then try activating again:
venv\Scripts\activate
```

**Mac/Linux:**
```bash
# Make sure you include 'source':
source venv/bin/activate
```

### Port Already in Use

**Backend (8000):**
```bash
# Use different port:
uvicorn main:app --reload --port 8001

# Then update frontend components:
# Change API_BASE from 'http://localhost:8000' to 'http://localhost:8001'
```

**Frontend (5173):**
```bash
# Vite will automatically try 5174, 5175, etc.
# Just use the port shown in the terminal output
```

### Camera/Microphone Not Working

1. Check browser permissions (usually a camera icon in address bar)
2. Close other apps using camera/mic
3. Try Chrome browser (most compatible)
4. Use `http://localhost:5173` not `127.0.0.1:5173`

---

## Development Workflow

### Making Changes

**Backend Changes:**
1. Edit Python files in `backend/` folder
2. Save file (`Ctrl+S`)
3. Uvicorn will **auto-reload** (you'll see "Reloading..." in terminal)
4. Test changes in browser

**Frontend Changes:**
1. Edit React files in `frontend/src/` folder
2. Save file (`Ctrl+S`)
3. Vite will **hot-reload** (browser updates automatically)
4. Changes appear immediately in browser

### Recommended Extensions

Install these for better experience:

1. **Python** (Microsoft) - Python support
2. **ESLint** - JavaScript linting
3. **ES7+ React/Redux snippets** - React code snippets
4. **Prettier** - Code formatter
5. **Auto Rename Tag** - HTML/JSX tag renaming
6. **Path Intellisense** - File path autocomplete

---

## Understanding the Code Structure

### Backend Files (Python)

```
backend/
├── main.py              ← Main API router (START HERE)
├── hand_tremor_api.py   ← Hand tremor endpoint
├── voice_api.py         ← Voice analysis endpoint
├── face_api.py          ← Face detection (NEW)
└── requirements.txt     ← Python packages list
```

**Key Concepts:**
- `@app.post("/endpoint")` - Creates API endpoint
- `async def` - Asynchronous function
- `await` - Wait for async operation
- FastAPI automatically handles JSON responses

### Frontend Files (React/JavaScript)

```
frontend/src/
├── main.jsx                 ← React entry point
├── App.jsx                  ← Main app component
├── pages/
│   └── PhysicalExam.jsx     ← Main page
├── components/
│   ├── HandTremor.jsx       ← Hand component
│   ├── VoiceTest.jsx        ← Voice component
│   └── FaceAssessment.jsx   ← Face component
└── styles/
    └── app.css              ← Styling
```

**Key React Concepts:**
- `useState()` - Manages component state
- `useRef()` - References DOM elements (like video)
- `useEffect()` - Runs code on component mount/unmount
- `fetch()` - Calls backend API
- `async/await` - Handles promises

### Data Flow

```
User clicks "Run Test"
    ↓
React component calls fetch()
    ↓
HTTP POST to backend API (http://localhost:8000/...)
    ↓
FastAPI processes request
    ↓
Python script runs analysis
    ↓
Results returned as JSON
    ↓
React component displays results
```

---

## Next Steps

### Customize the App

1. **Change Styling** - Edit `frontend/src/styles/app.css`
2. **Modify Components** - Edit files in `frontend/src/components/`
3. **Add Features** - Create new components or API endpoints

### Learn More

**React:**
- Official React Tutorial: https://react.dev/learn
- Vite Documentation: https://vitejs.dev/

**FastAPI:**
- FastAPI Tutorial: https://fastapi.tiangolo.com/tutorial/

**MediaPipe:**
- MediaPipe Docs: https://google.github.io/mediapipe/

---

## Quick Reference Commands

```bash
# Backend Setup (one time)
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt

# Backend Run (every time)
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
uvicorn main:app --reload

# Frontend Setup (one time)
cd frontend
npm install

# Frontend Run (every time)
cd frontend
npm run dev

# Stop servers
Ctrl+C (in each terminal)
```

---

## Getting Help

**VS Code Help:**
- Press `F1` to open command palette
- Type your question (e.g., "open terminal")

**Python/React Errors:**
- Read error messages in terminal carefully
- Google the error message
- Check the README.md troubleshooting section

**Still Stuck?**
- Make sure both backend AND frontend are running
- Check browser console (F12) for frontend errors
- Check terminal for backend errors
- Try restarting both servers

---

**Happy Coding! 🚀**
