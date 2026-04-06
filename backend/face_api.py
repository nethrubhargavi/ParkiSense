from fastapi import FastAPI, File, UploadFile
import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
import numpy as np
import tempfile
import os
import logging
import urllib.request
from pathlib import Path

app = FastAPI(title="Face Assessment API")
logger = logging.getLogger("face_api")

# Model URL for face landmarker
FACE_LANDMARKER_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
)

def get_face_landmarker_model():
    """Download and cache the face landmarker model."""
    model_path = Path(tempfile.gettempdir()) / "face_landmarker.task"
    if not model_path.exists():
        logger.info("Downloading face landmarker model...")
        urllib.request.urlretrieve(FACE_LANDMARKER_MODEL_URL, model_path)
        logger.info("Face landmarker model downloaded.")
    return str(model_path)


# Eye landmarks (same indices work with the Tasks API face landmarker)
LEFT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
RIGHT_EYE_INDICES = [33, 160, 158, 133, 153, 144]

# Safety cap: max frames to process (30 fps × 30 s = 900)
MAX_FRAMES = 900


def calculate_eye_aspect_ratio(landmarks, eye_indices):
    """
    Calculate Eye Aspect Ratio (EAR) to detect blinks.
    EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
    Lower EAR indicates closed eye (blink).
    """
    points = np.array([[landmarks[i].x, landmarks[i].y] for i in eye_indices])
    v1 = np.linalg.norm(points[1] - points[5])
    v2 = np.linalg.norm(points[2] - points[4])
    h = np.linalg.norm(points[0] - points[3])
    return (v1 + v2) / (2.0 * h)


@app.post("/run-face-test")
async def run_face_test(video: UploadFile = File(...)):
    """
    Analyze facial features for blink rate assessment.
    Expects a short video file (webm/mp4) from the frontend.
    """
    tmp_path = None
    try:
        model_path = get_face_landmarker_model()
    except Exception as e:
        return {"status": "error", "message": f"Failed to load face landmarker model: {e}"}

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp_file:
            content = await video.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            return {"status": "error", "message": "Could not open video file"}

        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps == 0:
            fps = 30

        frame_count = 0
        blink_count = 0
        EAR_THRESHOLD = 0.21
        CONSEC_FRAMES = 2
        counter = 0
        ear_values = []

        base_options = mp_python.BaseOptions(model_asset_path=model_path)
        options = mp_vision.FaceLandmarkerOptions(
            base_options=base_options,
            num_faces=1,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
            min_tracking_confidence=0.5,
            running_mode=mp_vision.RunningMode.VIDEO,
        )

        with mp_vision.FaceLandmarker.create_from_options(options) as landmarker:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                frame_count += 1
                if frame_count > MAX_FRAMES:
                    logger.info("Frame cap reached (%d), stopping processing", MAX_FRAMES)
                    break

                timestamp_ms = int((frame_count / fps) * 1000)
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

                result = landmarker.detect_for_video(mp_image, timestamp_ms)

                if result.face_landmarks:
                    face_landmarks = result.face_landmarks[0]

                    left_ear = calculate_eye_aspect_ratio(face_landmarks, LEFT_EYE_INDICES)
                    right_ear = calculate_eye_aspect_ratio(face_landmarks, RIGHT_EYE_INDICES)
                    ear = (left_ear + right_ear) / 2.0
                    ear_values.append(ear)

                    if ear < EAR_THRESHOLD:
                        counter += 1
                    else:
                        if counter >= CONSEC_FRAMES:
                            blink_count += 1
                        counter = 0

        cap.release()

        duration_seconds = frame_count / fps
        duration_minutes = duration_seconds / 60.0
        blink_rate = blink_count / duration_minutes if duration_minutes > 0 else 0
        confidence = min(0.95, frame_count / 150.0)
        avg_ear = np.mean(ear_values) if ear_values else 0.0

        return {
            "status": "success",
            "blink_rate": round(blink_rate, 2),
            "blink_count": blink_count,
            "confidence": round(confidence, 2),
            "duration_seconds": round(duration_seconds, 2),
            "avg_eye_aspect_ratio": round(avg_ear, 3),
            "frames_processed": frame_count,
            "interpretation": interpret_blink_rate(blink_rate),
        }

    except Exception as e:
        logger.exception("Unexpected error in face analysis")
        return {"status": "error", "message": "An unexpected error occurred during face analysis."}
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


def interpret_blink_rate(rate):
    if rate < 10:
        return "Low blink rate - may warrant further assessment"
    elif rate <= 20:
        return "Normal blink rate"
    else:
        return "High blink rate"