"""
Emotion Detection Microservice
Python 3.9 + TensorFlow 2.10.1 + DeepFace
Port: 8001
"""

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import cv2
import numpy as np
import base64
import uvicorn
from deepface import DeepFace

app = FastAPI(title="Emotion Detection Service")

class ImageRequest(BaseModel):
    image: str  # base64 encoded image

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "emotion-detection", "port": 8001}

@app.post("/analyze_emotion")
def analyze_emotion(request: ImageRequest):
    try:
        # Decode base64 image
        img_data = request.image
        if ',' in img_data:
            img_data = img_data.split(',')[1]
        
        img_bytes = base64.b64decode(img_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"dominant_emotion": "unknown", "status": "invalid_image"}
        
        # Analyze with DeepFace
        result = DeepFace.analyze(
            img_path=img,
            actions=['emotion'],
            enforce_detection=False,
            detector_backend='opencv',
            silent=True
        )
        
        # Handle both list and dict responses
        if isinstance(result, list):
            result = result[0]
        
        dominant_emotion = result.get('dominant_emotion', 'unknown')
        emotion_scores = result.get('emotion', {})
        
        return {
            "dominant_emotion": dominant_emotion.lower(),
            "emotion_scores": emotion_scores,
            "status": "success"
        }
        
    except Exception as e:
        # Return unknown instead of error - graceful degradation
        return {
            "dominant_emotion": "unknown",
            "status": "error",
            "error": str(e)
        }

if __name__ == "__main__":
    print("=" * 60)
    print("Emotion Detection Microservice")
    print("Python 3.9 | TensorFlow 2.10.1 | DeepFace")
    print("=" * 60)
    print("Starting on http://localhost:8001")
    print("=" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="error")
