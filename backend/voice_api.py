from fastapi import FastAPI, File, UploadFile
import subprocess
import sys
import json
import tempfile
import os
import logging

app = FastAPI(title="Parkinson Screening API")
logger = logging.getLogger("voice_api")

TRAIN_SCRIPT = "train_model.py"
VOICE_SCRIPT = "voice_analysis.py"
SUBPROCESS_TIMEOUT_SECS = 60


@app.post("/train-model")
def train_model():
    proc = subprocess.Popen(
        [sys.executable, TRAIN_SCRIPT],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    try:
        out, err = proc.communicate(timeout=SUBPROCESS_TIMEOUT_SECS)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.communicate()
        logger.warning("Model training timed out after %ds", SUBPROCESS_TIMEOUT_SECS)
        return {"status": "error", "message": "Training timed out. Please try again."}

    if proc.returncode != 0:
        logger.error("train_model.py failed: %s", err)
        return {"status": "error", "message": "Model training failed. Please try again."}

    try:
        result = json.loads(out)
        return result
    except json.JSONDecodeError:
        return {"status": "success", "console_output": out}


@app.post("/run-voice-test")
async def run_voice_test(audio: UploadFile = File(...)):
    """
    Analyze voice tremor from uploaded audio file.
    Validates that audio file is not empty before analysis.
    """
    tmp_path = None
    try:
        content = await audio.read()

        if len(content) == 0:
            return {"status": "error", "message": "No audio data received"}

        # Save uploaded audio to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp_file:
            tmp_file.write(content)
            tmp_path = tmp_file.name

        # Call voice analysis script with audio path
        process = subprocess.Popen(
            [sys.executable, VOICE_SCRIPT, tmp_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        try:
            stdout, stderr = process.communicate(timeout=SUBPROCESS_TIMEOUT_SECS)
        except subprocess.TimeoutExpired:
            process.kill()
            process.communicate()
            logger.warning("Voice analysis timed out after %ds", SUBPROCESS_TIMEOUT_SECS)
            return {
                "status": "error",
                "message": "Voice analysis timed out. Please try a shorter recording.",
            }

        if process.returncode != 0:
            logger.error("voice_analysis.py failed: %s", stderr)
            return {
                "status": "error",
                "message": "Voice analysis failed. Please try again.",
            }

        try:
            result = json.loads(stdout)
            return result
        except json.JSONDecodeError:
            return {"status": "success", "console_output": stdout}

    except Exception as e:
        logger.exception("Unexpected error in voice analysis")
        return {"status": "error", "message": "An unexpected error occurred during analysis."}
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
