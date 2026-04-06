"""
Hand Tremor Analysis Script
Analyzes hand movement from video to detect tremor.
Uses MediaPipe Hand Landmarker (Tasks API) compatible with mediapipe 0.10.30+
"""

import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
import numpy as np
import json
import sys
import urllib.request
import os
import tempfile
from pathlib import Path

# Model URL for hand landmarker
HAND_LANDMARKER_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
)

def get_hand_landmarker_model():
    """Download and cache the hand landmarker model."""
    model_path = Path(tempfile.gettempdir()) / "hand_landmarker.task"
    if not model_path.exists():
        urllib.request.urlretrieve(HAND_LANDMARKER_MODEL_URL, model_path)
    return str(model_path)


def analyze_hand_tremor_from_video(video_path):
    """
    Analyze hand tremor from a video file.
    Returns tremor metrics based on MediaPipe hand detection.
    """
    try:
        model_path = get_hand_landmarker_model()
    except Exception as e:
        return {"status": "error", "message": f"Failed to load hand landmarker model: {e}"}

    # Configure the hand landmarker
    base_options = mp_python.BaseOptions(model_asset_path=model_path)
    options = mp_vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=2,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5,
        running_mode=mp_vision.RunningMode.VIDEO,
    )

    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"status": "error", "message": "Could not open video file"}

        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps == 0:
            fps = 30

        frame_count = 0
        hand_positions = []
        valid_hands = 0

        with mp_vision.HandLandmarker.create_from_options(options) as landmarker:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                frame_count += 1
                timestamp_ms = int((frame_count / fps) * 1000)

                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

                result = landmarker.detect_for_video(mp_image, timestamp_ms)

                if result.hand_landmarks:
                    for hand_landmarks in result.hand_landmarks:
                        valid_hands += 1
                        # Palm center: average of wrist + MCP joints (0,5,9,13,17)
                        palm_x = np.mean([hand_landmarks[i].x for i in [0, 5, 9, 13, 17]])
                        palm_y = np.mean([hand_landmarks[i].y for i in [0, 5, 9, 13, 17]])
                        hand_positions.append({
                            'frame': frame_count,
                            'x': palm_x,
                            'y': palm_y
                        })

        cap.release()

        # Analyze tremor from hand positions
        tremor_strength = 0.0
        tremor_frequency = 0.0
        confidence = 0.0

        if len(hand_positions) > 10:
            movements = []
            for i in range(1, len(hand_positions)):
                dx = hand_positions[i]['x'] - hand_positions[i-1]['x']
                dy = hand_positions[i]['y'] - hand_positions[i-1]['y']
                movements.append(np.sqrt(dx*dx + dy*dy))

            tremor_strength = np.std(movements)

            high_variance_frames = sum(
                1 for m in movements if m > np.mean(movements) + np.std(movements)
            )
            duration_seconds = len(hand_positions) / fps
            if duration_seconds > 0:
                tremor_frequency = high_variance_frames / duration_seconds

            confidence = min(0.95, len(hand_positions) / (frame_count * 0.5))

        if tremor_strength < 0.02:
            interpretation = "No significant tremor detected - Normal"
        elif tremor_strength < 0.05:
            interpretation = "Mild tremor detected"
        else:
            interpretation = "Significant tremor detected - may warrant further assessment"

        enough_data = len(hand_positions) > 10
        return {
            "status": "success",
            "tremor_strength": round(tremor_strength * 100, 2),
            "tremor_frequency": round(tremor_frequency, 2),
            "confidence": round(confidence, 2),
            "hands_detected": min(valid_hands, 2),
            "frames_analyzed": len(hand_positions),
            "interpretation": interpretation if enough_data else "Not enough hand data - please try again",
            "clinical_interpretation": interpretation if enough_data else "Insufficient data for analysis",
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        result = {"status": "error", "message": "Video file path required as argument"}
    else:
        result = analyze_hand_tremor_from_video(sys.argv[1])
    print(json.dumps(result))