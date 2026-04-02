#!/usr/bin/env python3
"""
Voice Tremor Analysis Script (Demo)
Analyzes audio file for voice tremor characteristics.
Accepts audio file path as command-line argument.
"""

import json
import random
import sys
import os

def analyze_voice(audio_path):
    """
    Analyze voice tremor from audio file.
    Returns error if file doesn't exist or is empty.
    """
    # Validate audio file exists
    if not os.path.exists(audio_path):
        return {
            "status": "error",
            "message": "Audio file not found"
        }
    
    # Check if file has content
    file_size = os.path.getsize(audio_path)
    if file_size == 0:
        return {
            "status": "error",
            "message": "Audio file is empty - no sound recorded"
        }
    
    # File size should be at least a few KB for valid audio
    if file_size < 1000:
        return {
            "status": "error",
            "message": "Insufficient audio data"
        }
    
    # Demo analysis - in production, parse actual audio with librosa
    jitter = round(random.uniform(0.5, 5.0), 2)
    shimmer = round(random.uniform(1.0, 8.0), 2)
    f0_mean = round(random.uniform(100, 250), 2)
    confidence = round(random.uniform(0.7, 0.99), 2)
    
    results = {
        "status": "success",
        "jitter": jitter,
        "shimmer": shimmer,
        "f0_mean": f0_mean,
        "confidence": confidence,
        "unit_jitter": "%",
        "unit_shimmer": "%",
        "unit_f0": "Hz",
        "clinical_interpretation": "Normal voice quality" if jitter < 2 else "Possible dysphonia detected"
    }
    
    return results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        result = {
            "status": "error",
            "message": "No audio file provided"
        }
    else:
        audio_path = sys.argv[1]
        result = analyze_voice(audio_path)
    
    print(json.dumps(result))
