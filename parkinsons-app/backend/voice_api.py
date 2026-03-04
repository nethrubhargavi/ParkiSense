from fastapi import FastAPI, File, UploadFile
import subprocess, sys
import json
import tempfile
import os

app = FastAPI(title="Parkinson Screening API")

TRAIN_SCRIPT = "train_model.py"
VOICE_SCRIPT = "voice_analysis.py"

@app.post("/train-model")
def train_model():
    proc = subprocess.Popen(
        [sys.executable, TRAIN_SCRIPT],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    out, err = proc.communicate()

    if proc.returncode != 0:
        return {"status":"error", "stderr": err}

    # Try to parse JSON output from script
    try:
        result = json.loads(out)
        return result
    except json.JSONDecodeError:
        return {"status":"success", "console_output": out}


@app.post("/run-voice-test")
async def run_voice_test(audio: UploadFile = File(...)):
    """
    Analyze voice tremor from uploaded audio file.
    Validates that audio file is not empty before analysis.
    """
    try:
        # Check if audio file has content
        content = await audio.read()
        
        if len(content) == 0:
            return {
                "status": "error",
                "message": "No audio data received"
            }
        
        # Save uploaded audio to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp_file:
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        # Call voice analysis script with audio path
        process = subprocess.Popen(
            [sys.executable, VOICE_SCRIPT, tmp_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        stdout, stderr = process.communicate()
        
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

        if process.returncode != 0:
            return {
                "status": "error",
                "message": "Script failed",
                "stderr": stderr
            }

        # Try to parse JSON output from script
        try:
            result = json.loads(stdout)
            return result
        except json.JSONDecodeError:
            # Fallback to raw console output if not JSON
            return {
                "status": "success",
                "console_output": stdout
            }

    except Exception as e:
        # Clean up temp file if it exists
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        
        return {
            "status": "error",
            "message": str(e)
        }
