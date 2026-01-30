"""
DeepFace Emotion Detection Microservice
Runs on Python 3.9 with TensorFlow 2.10.1

Usage:
  python deepface_server.py

Endpoint:
  POST /analyze_emotion
  Body: {"image": "base64_encoded_image"}
  Returns: {"emotion": "happy", "emotions": {...}, "status": "success"}
"""

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow logging

from flask import Flask, request, jsonify
import cv2
import numpy as np
import base64
from deepface import DeepFace

app = Flask(__name__)

# Disable TensorFlow GPU
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "DeepFace Emotion Detection"})

@app.route('/analyze_emotion', methods=['POST'])
def analyze_emotion():
    """
    Analyze emotion from base64-encoded image
    
    Request JSON:
        {
            "image": "base64_encoded_jpg_or_png"
        }
    
    Response JSON:
        {
            "emotion": "happy",
            "emotions": {
                "angry": 0.01,
                "disgust": 0.0,
                "fear": 0.02,
                "happy": 0.95,
                "sad": 0.0,
                "surprise": 0.01,
                "neutral": 0.01
            },
            "status": "success"
        }
    """
    try:
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({"error": "No image provided", "status": "error"}), 400
        
        # Decode base64 image
        image_data = base64.b64decode(data['image'])
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({"error": "Invalid image data", "status": "error"}), 400
        
        # Convert BGR to RGB (DeepFace expects RGB)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Analyze emotion using DeepFace
        result = DeepFace.analyze(
            img_rgb,
            actions=['emotion'],
            enforce_detection=False,
            detector_backend='opencv'
        )
        
        # Extract emotion data
        if isinstance(result, list):
            result = result[0]
        
        dominant_emotion = result['dominant_emotion']
        emotions = result['emotion']
        
        return jsonify({
            "emotion": dominant_emotion,
            "emotions": emotions,
            "status": "success"
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("DeepFace Emotion Detection Service")
    print("Python 3.9 | TensorFlow 2.10.1 | DeepFace 0.0.79")
    print("=" * 60)
    print("Starting server on http://localhost:8001")
    print("Endpoints:")
    print("  GET  /health - Health check")
    print("  POST /analyze_emotion - Analyze emotion from base64 image")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=8001, debug=False)
