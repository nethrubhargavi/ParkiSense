from fastapi import FastAPI, File, UploadFile
import subprocess
import sys
import json
import tempfile
import os

app = FastAPI(title="Hand Tremor Screening API")

@app.post("/run-tremor-test")
async def run_tremor_test(video: UploadFile = File(...)):
    """
    Analyze hand tremor from uploaded video file.
    Uses MediaPipe Hand detection to analyze hand movement and tremor.
    """
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
