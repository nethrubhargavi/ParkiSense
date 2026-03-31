<<<<<<< HEAD
from fastapi import FastAPI, File, UploadFile
import subprocess
import sys
import json
import tempfile
import os
import logging

app = FastAPI(title="Hand Tremor Screening API")
logger = logging.getLogger("hand_tremor_api")

SUBPROCESS_TIMEOUT_SECS = 60


@app.post("/run-tremor-test")
async def run_tremor_test(video: UploadFile = File(...)):
    """
    Analyze hand tremor from uploaded video file.
    Uses MediaPipe Hand detection to analyze hand movement and tremor.
    """
    tmp_path = None
    try:
        # Save uploaded video to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp_file:
            content = await video.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        # Call hand tremor analysis script with video path
        process = subprocess.Popen(
            [sys.executable, "hand_tremor.py", tmp_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        try:
            stdout, stderr = process.communicate(timeout=SUBPROCESS_TIMEOUT_SECS)
        except subprocess.TimeoutExpired:
            process.kill()
            process.communicate()
            logger.warning("Hand tremor analysis timed out after %ds", SUBPROCESS_TIMEOUT_SECS)
            return {
                "status": "error",
                "message": "Analysis timed out. Please try a shorter video.",
            }

        if process.returncode != 0:
            logger.error("hand_tremor.py failed: %s", stderr)
            return {
                "status": "error",
                "message": "Tremor analysis failed. Please try again.",
            }

        # Try to parse JSON output from script
        try:
            result = json.loads(stdout)
            return result
        except json.JSONDecodeError:
            return {"status": "success", "console_output": stdout}

    except Exception as e:
        logger.exception("Unexpected error in hand tremor analysis")
        return {"status": "error", "message": "An unexpected error occurred during analysis."}
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
=======
from fastapi import FastAPI, File, UploadFile
import subprocess
import sys
import json
import tempfile
import os
import logging

app = FastAPI(title="Hand Tremor Screening API")
logger = logging.getLogger("hand_tremor_api")

SUBPROCESS_TIMEOUT_SECS = 60


@app.post("/run-tremor-test")
async def run_tremor_test(video: UploadFile = File(...)):
    """
    Analyze hand tremor from uploaded video file.
    Uses MediaPipe Hand detection to analyze hand movement and tremor.
    """
    tmp_path = None
    try:
        # Save uploaded video to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp_file:
            content = await video.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        # Call hand tremor analysis script with video path
        process = subprocess.Popen(
            [sys.executable, "hand_tremor.py", tmp_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        try:
            stdout, stderr = process.communicate(timeout=SUBPROCESS_TIMEOUT_SECS)
        except subprocess.TimeoutExpired:
            process.kill()
            process.communicate()
            logger.warning("Hand tremor analysis timed out after %ds", SUBPROCESS_TIMEOUT_SECS)
            return {
                "status": "error",
                "message": "Analysis timed out. Please try a shorter video.",
            }

        if process.returncode != 0:
            logger.error("hand_tremor.py failed: %s", stderr)
            return {
                "status": "error",
                "message": "Tremor analysis failed. Please try again.",
            }

        # Try to parse JSON output from script
        try:
            result = json.loads(stdout)
            return result
        except json.JSONDecodeError:
            return {"status": "success", "console_output": stdout}

    except Exception as e:
        logger.exception("Unexpected error in hand tremor analysis")
        return {"status": "error", "message": "An unexpected error occurred during analysis."}
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
>>>>>>> ae6ffb8bbf49244eb2599dd1f532a652bf633124
