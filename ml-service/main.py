from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import numpy as np
from services.eye_contact_analyzer import EyeContactAnalyzer
from services.gesture_analyzer import GestureAnalyzer
from services.smile_analyzer import SmileAnalyzer
from services.repetitive_analyzer import RepetitiveAnalyzer
from services.imitation_analyzer import ImitationAnalyzer
from services.autism_predictor import AutismPredictor

app = FastAPI(
    title="Autism Screening ML Service",
    description="Real-time behavioral analysis through interactive games",
    version="3.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize analyzers
eye_contact_analyzer = EyeContactAnalyzer()
gesture_analyzer = GestureAnalyzer()
smile_analyzer = SmileAnalyzer()
repetitive_analyzer = RepetitiveAnalyzer()
imitation_analyzer = ImitationAnalyzer()
autism_predictor = AutismPredictor()

# Request Models
class FrameData(BaseModel):
    frames: List[str]  # Base64 encoded images
    duration: float    # Duration in seconds

class PredictionInput(BaseModel):
    eyeContact: Dict[str, float]
    smile: Dict[str, float]
    gesture: Dict[str, float]
    repetitive: Dict[str, float]
    imitation: Dict[str, float]
    questionnaire: Dict[str, float]

# Session storage for live analysis
session_data = {}

class LiveFrameBatch(BaseModel):
    sessionId: str
    frames: List[str]  # Base64 encoded frames

@app.get("/")
def read_root():
    return {
        "service": "Autism Screening ML Service - Interactive Live Analysis",
        "version": "3.0.0",
        "status": "running",
        "endpoints": [
            "/analyze/eye-contact",
            "/analyze/smile",
            "/analyze/gesture",
            "/analyze/repetitive",
            "/analyze/imitation",
            "/predict/autism"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/analyze/eye-contact")
async def analyze_eye_contact(data: FrameData):
    """
    Analyze eye contact from live frames during 'Look at the Character' game.
    Uses MediaPipe FaceMesh to detect eye gaze and alignment.
    """
    try:
        result = eye_contact_analyzer.analyze(data.frames, data.duration)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eye contact analysis error: {str(e)}")

@app.post("/analyze/gesture")
async def analyze_gesture(data: FrameData):
    """
    Analyze gestures from live frames during 'Wave at the Character' game.
    Uses MediaPipe Hands to detect waving and pointing.
    """
    try:
        result = gesture_analyzer.analyze(data.frames, data.duration)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gesture analysis error: {str(e)}")

@app.post("/analyze/smile")
async def analyze_smile(data: FrameData):
    """
    Analyze smiling from live frames during 'Make the Character Happy' game.
    Uses mouth landmark geometry to detect smiles.
    """
    try:
        result = smile_analyzer.analyze(data.frames, data.duration)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Smile analysis error: {str(e)}")

@app.post("/analyze/repetitive")
async def analyze_repetitive(data: FrameData):
    """
    Analyze repetitive behaviors from live frames during free-play interaction.
    Uses MediaPipe Pose to detect oscillatory movements.
    """
    try:
        result = repetitive_analyzer.analyze(data.frames, data.duration)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Repetitive behavior analysis error: {str(e)}")

@app.post("/analyze/imitation")
async def analyze_imitation(data: FrameData):
    """
    Analyze imitation ability from live frames during 'Copy the Friend' game.
    Uses MediaPipe Pose to detect if child imitates demonstrated actions.
    """
    try:
        result = imitation_analyzer.analyze(data.frames, data.duration)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Imitation analysis error: {str(e)}")

@app.post("/predict/autism")
async def predict_autism(data: PredictionInput):
    """
    Generate final autism likelihood prediction from all interaction features.
    Combines behavioral metrics with questionnaire responses.
    """
    try:
        result = autism_predictor.predict(
            eye_contact_data=data.eyeContact,
            smile_data=data.smile,
            gesture_data=data.gesture,
            repetitive_data=data.repetitive,
            imitation_data=data.imitation,
            questionnaire_data=data.questionnaire
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

# ===== NEW LIVE FRAME PROCESSING ENDPOINTS =====

@app.post("/analyze/eye-contact-batch")
async def analyze_eye_contact_batch(data: LiveFrameBatch):
    """
    Process live frame batch for eye contact during Rory interaction.
    Stores incremental results per session.
    """
    try:
        session_id = data.sessionId
        
        # Initialize session if not exists
        if session_id not in session_data:
            session_data[session_id] = {
                'eye_contact': {'frames': [], 'results': []},
                'gesture': {'frames': [], 'detections': []},
                'smile': {'frames': [], 'detections': []},
                'repetitive': {'frames': [], 'results': []}
            }
        
        # Analyze batch
        batch_result = eye_contact_analyzer.analyze(data.frames, duration=len(data.frames) * 0.2)
        session_data[session_id]['eye_contact']['results'].append(batch_result)
        
        return {"status": "processed", "sessionId": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze/eye-contact-result/{session_id}")
async def get_eye_contact_result(session_id: str):
    """
    Get aggregated eye contact results for a session.
    """
    try:
        if session_id not in session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        results = session_data[session_id]['eye_contact']['results']
        if not results:
            return {
                "metric": "eye_contact",
                "value": 0.0,
                "interpretation": "Insufficient data",
                "confidence": 0.0
            }
        
        # Aggregate results
        avg_value = np.mean([r.get('eyeContactRatio', 0) for r in results])
        avg_confidence = np.mean([r.get('confidence', 0) for r in results])
        
        interpretation = "Very Low"
        if avg_value > 0.7: interpretation = "Good"
        elif avg_value > 0.5: interpretation = "Moderate"
        elif avg_value > 0.3: interpretation = "Low"
        
        return {
            "metric": "eye_contact",
            "value": float(avg_value),
            "interpretation": interpretation,
            "confidence": float(avg_confidence)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/gesture-batch")
async def analyze_gesture_batch(data: LiveFrameBatch):
    """
    Process live frame batch for gesture detection.
    """
    try:
        session_id = data.sessionId
        
        if session_id not in session_data:
            session_data[session_id] = {
                'eye_contact': {'frames': [], 'results': []},
                'gesture': {'frames': [], 'detections': []},
                'smile': {'frames': [], 'detections': []},
                'repetitive': {'frames': [], 'results': []}
            }
        
        # Analyze batch
        batch_result = gesture_analyzer.analyze(data.frames, duration=len(data.frames) * 0.2)
        gesture_detected = batch_result.get('gestureFrequency', 0) > 0
        
        session_data[session_id]['gesture']['detections'].append(batch_result)
        
        return {
            "status": "processed",
            "sessionId": session_id,
            "gestureDetected": gesture_detected
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze/gesture-result/{session_id}")
async def get_gesture_result(session_id: str):
    """
    Get aggregated gesture results.
    """
    try:
        if session_id not in session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        detections = session_data[session_id]['gesture']['detections']
        if not detections:
            return {
                "metric": "gesture",
                "value": 0,
                "interpretation": "Insufficient data",
                "confidence": 0.0
            }
        
        total_gestures = sum([d.get('gestureFrequency', 0) for d in detections])
        
        interpretation = "Low"
        if total_gestures > 5: interpretation = "Normal"
        elif total_gestures > 2: interpretation = "Reduced"
        
        return {
            "metric": "gesture",
            "value": int(total_gestures),
            "interpretation": interpretation,
            "confidence": 0.85
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/smile-batch")
async def analyze_smile_batch(data: LiveFrameBatch):
    """
    Process live frame batch for smile detection.
    """
    try:
        session_id = data.sessionId
        
        if session_id not in session_data:
            session_data[session_id] = {
                'eye_contact': {'frames': [], 'results': []},
                'gesture': {'frames': [], 'detections': []},
                'smile': {'frames': [], 'detections': []},
                'repetitive': {'frames': [], 'results': []}
            }
        
        # Analyze batch
        batch_result = smile_analyzer.analyze(data.frames, duration=len(data.frames) * 0.2)
        smile_detected = batch_result.get('smileRatio', 0) > 0.3
        
        session_data[session_id]['smile']['detections'].append(batch_result)
        
        return {
            "status": "processed",
            "sessionId": session_id,
            "smileDetected": smile_detected
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze/smile-result/{session_id}")
async def get_smile_result(session_id: str):
    """
    Get aggregated smile results.
    """
    try:
        if session_id not in session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        detections = session_data[session_id]['smile']['detections']
        if not detections:
            return {
                "metric": "smile",
                "value": 0,
                "interpretation": "Insufficient data",
                "confidence": 0.0
            }
        
        avg_smile_ratio = np.mean([d.get('smileRatio', 0) for d in detections])
        
        interpretation = "Low"
        if avg_smile_ratio > 0.5: interpretation = "Normal"
        elif avg_smile_ratio > 0.3: interpretation = "Reduced"
        
        return {
            "metric": "smile",
            "value": float(avg_smile_ratio),
            "interpretation": interpretation,
            "confidence": 0.80
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/repetitive-batch")
async def analyze_repetitive_batch(data: LiveFrameBatch):
    """
    Process live frame batch for repetitive behavior.
    """
    try:
        session_id = data.sessionId
        
        if session_id not in session_data:
            session_data[session_id] = {
                'eye_contact': {'frames': [], 'results': []},
                'gesture': {'frames': [], 'detections': []},
                'smile': {'frames': [], 'detections': []},
                'repetitive': {'frames': [], 'results': []}
            }
        
        # Analyze batch
        batch_result = repetitive_analyzer.analyze(data.frames, duration=len(data.frames) * 0.2)
        session_data[session_id]['repetitive']['results'].append(batch_result)
        
        return {"status": "processed", "sessionId": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze/repetitive-result/{session_id}")
async def get_repetitive_result(session_id: str):
    """
    Get aggregated repetitive behavior results.
    """
    try:
        if session_id not in session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        results = session_data[session_id]['repetitive']['results']
        if not results:
            return {
                "metric": "repetitive",
                "value": 0.0,
                "interpretation": "Absent",
                "confidence": 0.0
            }
        
        avg_ratio = np.mean([r.get('repetitiveRatio', 0) for r in results])
        
        interpretation = "Absent"
        if avg_ratio > 0.5: interpretation = "Present"
        elif avg_ratio > 0.2: interpretation = "Mild"
        
        return {
            "metric": "repetitive",
            "value": float(avg_ratio),
            "interpretation": interpretation,
            "confidence": 0.75
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
