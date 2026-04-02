#!/usr/bin/env python3
"""
Hand Tremor Analysis Script
Analyzes hand movement from video to detect tremor.
Uses MediaPipe Hand detection to track hand landmarks and analyze tremor characteristics.
"""

import cv2
import mediapipe as mp
import numpy as np
import json
import sys
from pathlib import Path

def analyze_hand_tremor_from_video(video_path):
    """
    Analyze hand tremor from a video file.
    Returns tremor metrics based on MediaPipe hand detection.
    """
    
    # Initialize MediaPipe Hands
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    try:
        # Open video file
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            return {
                "status": "error",
                "message": "Could not open video file"
            }
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps == 0:
            fps = 30  # Default fallback
        
        frame_count = 0
        hand_positions = []  # List of (frame_num, x, y) tuples
        valid_hands = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process with MediaPipe
            results = hands.process(rgb_frame)
            
            if results.multi_hand_landmarks:
                # Get hand landmarks
                for hand_landmarks in results.multi_hand_landmarks:
                    valid_hands += 1
                    
                    # Get wrist position (landmark 0)
                    wrist = hand_landmarks.landmark[0]
                    
                    # Get palm center (average of multiple landmarks)
                    palm_x = np.mean([hand_landmarks.landmark[i].x for i in [0, 5, 9, 13, 17]])
                    palm_y = np.mean([hand_landmarks.landmark[i].y for i in [0, 5, 9, 13, 17]])
                    
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
        
        if len(hand_positions) > 10:  # Need at least 10 frames
            # Calculate frame-to-frame movement
            movements = []
            for i in range(1, len(hand_positions)):
                dx = hand_positions[i]['x'] - hand_positions[i-1]['x']
                dy = hand_positions[i]['y'] - hand_positions[i-1]['y']
                
                # Calculate distance (normalized by frame size)
                movement = np.sqrt(dx*dx + dy*dy)
                movements.append(movement)
            
            # Tremor strength = standard deviation of movements (higher = more tremor)
            tremor_strength = np.std(movements)
            
            # Tremor frequency analysis (simplified)
            # Count high-variance frames (potential oscillations)
            high_variance_frames = sum(1 for m in movements if m > np.mean(movements) + np.std(movements))
            duration_seconds = len(hand_positions) / fps
            
            # Estimate frequency from high-variance frames
            if duration_seconds > 0:
                tremor_frequency = (high_variance_frames / duration_seconds)
            
            # Confidence based on detected hands
            confidence = min(0.95, (len(hand_positions) / (frame_count * 0.5)))
        
        # Clinical interpretation
        if tremor_strength < 0.02:
            interpretation = "No significant tremor detected - Normal"
        elif tremor_strength < 0.05:
            interpretation = "Mild tremor detected"
        else:
            interpretation = "Significant tremor detected - may warrant further assessment"
        
        return {
            "status": "success",
            "tremor_strength": round(tremor_strength * 100, 2),  # Scale to 0-100
            "tremor_frequency": round(tremor_frequency, 2),
            "confidence": round(confidence, 2),
            "hands_detected": min(valid_hands, 2),  # Max 2 hands
            "frames_analyzed": len(hand_positions),
            "interpretation": interpretation if len(hand_positions) > 10 else "Not enough hand data - please try again",
            "clinical_interpretation": interpretation if len(hand_positions) > 10 else "Insufficient data for analysis"
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        result = {
            "status": "error",
            "message": "Video file path required as argument"
        }
    else:
        video_path = sys.argv[1]
        result = analyze_hand_tremor_from_video(video_path)
    
    # Output as JSON
    print(json.dumps(result))
