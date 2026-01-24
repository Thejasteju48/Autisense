from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import numpy as np
import os
from dotenv import load_dotenv
from services.autism_predictor import AutismPredictor
from services.behavior_analyzer import behavior_analyzer
from services.questionnaire_predictor import QuestionnairePredictor
from services.video_behavior_predictor import VideoBehaviorPredictor
from services.features.video_orchestrator import VideoFeatureOrchestrator

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Autism Screening ML Service",
    description="Live video behavioral analysis with modular feature extraction",
    version="4.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
autism_predictor = AutismPredictor()
questionnaire_predictor = QuestionnairePredictor()
video_behavior_predictor = VideoBehaviorPredictor()

# Session-based video orchestrators (one per session)
active_sessions = {}

# Request Models
class QuestionnaireInput(BaseModel):
    """Model for questionnaire prediction using trained models"""
    responses: List[bool]  # 20 yes/no answers (True=yes, False=no)
    age: int  # Child age in months
    sex: str  # 'male' or 'female'
    jaundice: str  # 'yes' or 'no'
    family_asd: str  # 'yes' or 'no'

@app.get("/")
def read_root():
    return {
        "service": "Autism Screening ML Service - Modular Live Video Analysis",
        "version": "4.0.0",
        "status": "running",
        "features": [
            "Eye Contact Ratio",
            "Blink Rate",
            "Head Movement Rate",
            "Head Repetitive Movement",
            "Hand Repetitive Movement",
            "Gesture Frequency",
            "Facial Expression Variability"
        ],
        "endpoints": [
            "/video/start-session",
            "/video/process-frame",
            "/video/end-session",
            "/video/session-status/{session_id}",
            "/predict/questionnaire"
        ]
    }

# ===== LIVE VIDEO ANALYSIS ENDPOINTS =====

class LiveVideoFrame(BaseModel):
    """Single frame for real-time processing"""
    session_id: str
    frame: str  # Base64 encoded image
    timestamp: float

class SessionRequest(BaseModel):
    """Session management"""
    session_id: str
    duration_seconds: Optional[float] = None

@app.post("/video/start-session")
async def start_video_session(data: SessionRequest):
    """
    Start a new video analysis session.
    Creates a VideoFeatureOrchestrator for the session.
    """
    try:
        session_id = data.session_id
        
        if session_id in active_sessions:
            return {"status": "session_already_exists", "session_id": session_id}
        
        # Create new orchestrator for this session
        active_sessions[session_id] = {
            'orchestrator': VideoFeatureOrchestrator(),
            'start_time': None,
            'frame_count': 0
        }
        
        print(f"✓ Started video session: {session_id}")
        
        return {
            "status": "session_started",
            "session_id": session_id,
            "message": "Ready to process frames through all feature extractors"
        }
    
    except Exception as e:
        print(f"✗ Error starting session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/video/process-frame")
async def process_frame(data: LiveVideoFrame):
    """Process a single frame through all feature extractors.
    Extracts all 7 behavioral features and returns real-time results.
    """
    try:
        session_id = data.session_id
        
        # Get or create session
        if session_id not in active_sessions:
            active_sessions[session_id] = {
                'orchestrator': VideoFeatureOrchestrator(),
                'start_time': data.timestamp,
                'frame_count': 0
            }
        
        session = active_sessions[session_id]
        orchestrator = session['orchestrator']
        
        # Set start time on first frame
        if session['start_time'] is None:
            session['start_time'] = data.timestamp
        
        # Process frame through orchestrator
        result = orchestrator.process_frame(data.frame)
        session['frame_count'] += 1
        
        # Add session info to result
        result['session_info'] = {
            'session_id': session_id,
            'total_frames': session['frame_count'],
            'elapsed_time': data.timestamp - session['start_time'] if session['start_time'] else 0
        }
        
        return result
        
    except Exception as e:
        print(f"Error processing frame: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Frame processing error: {str(e)}")

@app.post("/video/end-session")
async def end_video_session(data: SessionRequest):
    """
    End video session and return comprehensive feature summary.
    Aggregates all extracted features from the entire session.
    """
    try:
        session_id = data.session_id
        
        if session_id not in active_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = active_sessions[session_id]
        orchestrator = session['orchestrator']
        
        # Calculate session duration
        duration = data.duration_seconds or 300  # Default 5 minutes
        
        # Get comprehensive summary from orchestrator
        summary = orchestrator.get_session_summary(duration)
        
        # Clean up session
        del active_sessions[session_id]
        
        print(f"✓ Ended video session: {session_id} (Duration: {duration}s, Frames: {session['frame_count']})")
        
        return {
            "status": "session_ended",
            "session_id": session_id,
            "summary": summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error ending session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Session end error: {str(e)}")

@app.get("/video/session-status/{session_id}")
async def get_session_status(session_id: str):
    """
    Get current status of an active video session.
    """
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    orchestrator = session['orchestrator']
    
    return {
        "session_id": session_id,
        "active": True,
        "frames_processed": session['frame_count'],
        "start_time": session['start_time'],
        "features_extracted": {
            "gaze_frames": len(orchestrator.eye_contact.gaze_history),
            "blinks_detected": sum(1 for b in orchestrator.blink_rate.blink_history if b['is_blink']),
            "head_poses": len(orchestrator.head_movement.head_pose_history),
            "gestures_detected": len(orchestrator.gesture_detection.gesture_timestamps),
            "facial_expressions": len(orchestrator.expression_variability.expression_history)
        }
    }

# ===== QUESTIONNAIRE PREDICTION (PRESERVED) =====

@app.post("/predict/questionnaire")
async def predict_questionnaire(data: QuestionnaireInput):
    """
    Predict autism likelihood using trained questionnaire models.
    Uses two pre-trained models and averages their predictions.
    
    This endpoint uses the trained .pkl models for questionnaire-only prediction.
    """
    try:
        questionnaire_data = {
            'responses': data.responses,
            'age': data.age,
            'sex': data.sex,
            'jaundice': data.jaundice,
            'family_asd': data.family_asd
        }
        
        result = questionnaire_predictor.predict(questionnaire_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Questionnaire prediction error: {str(e)}")


class VideoFeaturesInput(BaseModel):
    """Model for video behavior prediction"""
    eye_contact_ratio: float
    blink_rate_per_minute: float
    head_movement_rate: float
    head_repetitive_movement: Optional[Dict] = None
    hand_repetitive_movement: Optional[Dict] = None
    gesture_frequency_per_minute: float
    facial_expression_variability: float


@app.post("/predict/video-behavior")
async def predict_video_behavior(data: VideoFeaturesInput):
    """
    Predict autism likelihood from 7 video behavioral features.
    Analyzes eye contact, expressions, gestures, and repetitive behaviors.
    """
    try:
        video_features = data.dict()
        result = video_behavior_predictor.predict(video_features)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video behavior prediction error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
