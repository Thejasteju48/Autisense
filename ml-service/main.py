from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import numpy as np
import os
import cv2
import base64
import tempfile
from dotenv import load_dotenv
from services.questionnaire_predictor import QuestionnairePredictor
from services.video_behavior_predictor import VideoBehaviorPredictor
from services.features.video_orchestrator import VideoFeatureOrchestrator

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Autism Screening ML Service",
    description="Batch video behavioral analysis with modular feature extraction",
    version="5.0.0"
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
questionnaire_predictor = QuestionnairePredictor()
video_behavior_predictor = VideoBehaviorPredictor()

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
        "service": "Autism Screening ML Service - Batch Video Processing",
        "version": "5.0.0",
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
            "/video/process-complete",
            "/predict/questionnaire",
            "/predict/video-behavior"
        ]
    }

# ===== QUESTIONNAIRE PREDICTION ENDPOINT =====

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


# ===== VIDEO BEHAVIOR PREDICTION ENDPOINT =====

class VideoFeaturesInput(BaseModel):
    """Model for video behavior prediction"""
    eye_contact_ratio: float
    blink_rate_per_minute: float
    head_movement_rate: float
    head_movements: Optional[Dict] = None
    hand_stimming: Optional[Dict] = None
    social_gestures: Optional[Dict] = None
    facial_expression_variability: float


@app.post("/predict/video-behavior")
async def predict_video_behavior(data: VideoFeaturesInput):
    """
    Predict autism likelihood from 7 video behavioral features.
    Analyzes eye contact, expressions, gestures, and repetitive behaviors.
    """
    try:
        video_features = data.model_dump()
        result = video_behavior_predictor.predict(video_features)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video behavior prediction error: {str(e)}")


# ===== BATCH VIDEO PROCESSING ENDPOINT =====

@app.post("/video/process-complete")
async def process_complete_video(
    video: UploadFile = File(...),
    screening_id: str = Form(...),
    duration: float = Form(...)
):
    """
    Process a complete recorded video file.
    Extracts frames at ~10 FPS and processes through all behavioral features.
    
    This is batch processing mode (not live streaming):
    1. Receive uploaded video file
    2. Extract frames using OpenCV
    3. Process each frame through all 7 features
    4. Return aggregated results
    """
    temp_video_path = None
    
    try:
        print(f"\n{'='*60}")
        print(f"🎥 Processing complete video for screening: {screening_id}")
        print(f"📊 Expected duration: {duration:.2f}s")
        print(f"📦 Video file: {video.filename}, content_type: {video.content_type}")
        
        # Save uploaded video to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_file:
            temp_video_path = temp_file.name
            content = await video.read()
            temp_file.write(content)
            print(f"💾 Saved video to temp file: {temp_video_path} ({len(content)} bytes)")
        
        # Open video with OpenCV
        cap = cv2.VideoCapture(temp_video_path)
        
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Could not open video file")
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # WebM videos often have incorrect FPS metadata - use provided duration
        if fps <= 0 or fps > 120 or total_frames <= 0:
            print(f"⚠️ Invalid video metadata: fps={fps}, frames={total_frames}")
            print(f"📊 Using provided duration: {duration}s for frame sampling")
            # Assume we'll process frames at target rate
            fps = None
            video_duration = duration
        else:
            video_duration = total_frames / fps
            print(f"📹 Video properties: {fps:.2f} FPS, {total_frames} total frames, {video_duration:.2f}s duration")
        
        # Calculate frame sampling rate (target 6 FPS for accurate detection)
        target_fps = 6.0  # 6 FPS provides good balance between speed and accuracy
        max_video_duration = 180.0  # Process full 3-minute videos
        
        if fps and fps > 0:
            frame_interval = max(1, int(fps / target_fps))
        else:
            # For invalid FPS, sample every frame (WebM typically 30fps browser recording)
            frame_interval = 5  # Assume 30fps, sample every 5th frame for ~6fps
        
        print(f"🎯 Extracting frames: every {frame_interval} frame(s) for ~{target_fps} FPS sampling")
        print(f"⚡ OPTIMIZED: {target_fps} FPS for accurate behavioral detection")
        print(f"📏 Max duration: {max_video_duration}s (3-minute videos)")
        
        # Create orchestrator for this video
        orchestrator = VideoFeatureOrchestrator()
        
        frame_index = 0
        processed_count = 0
        max_frames = int(max_video_duration * target_fps)  # e.g., 120s * 3fps = 360 frames
        
        print(f"📊 Will process max {max_frames} frames ({max_video_duration}s at {target_fps} FPS)")
        
        while True:
            ret, frame = cap.read()
            
            if not ret:
                break
            
            # Stop if we've processed enough frames
            if processed_count >= max_frames:
                print(f"⏹️ Reached {max_frames} frame limit ({max_video_duration}s)")
                break
            
            # Sample frames at target rate
            if frame_index % frame_interval == 0:
                # CRITICAL FIX: Use target_fps for accurate timestamps
                # timestamp = processed_count / target_fps
                timestamp = processed_count / target_fps
                
                # Convert frame to base64 for processing
                _, buffer = cv2.imencode('.jpg', frame)
                frame_base64 = base64.b64encode(buffer).decode('utf-8')
                frame_data = f"data:image/jpeg;base64,{frame_base64}"
                
                # Process through orchestrator
                result = orchestrator.process_frame(
                    base64_frame=frame_data,
                    timestamp=timestamp
                )
                
                # Debug: Log first few frames to see what's being detected
                if processed_count < 3:
                    print(f"\n🔍 Debug Frame {processed_count}:")
                    print(f"  Eye Contact: {result.get('eye_contact', {})}")
                    print(f"  Blink: {result.get('blink', {})}")
                    print(f"  Head Pose: {result.get('head_pose', {})}")
                    print(f"  Gesture: {result.get('gesture', {})}")
                    print(f"  Expression: {result.get('facial_expression', {})}")
                
                processed_count += 1
                
                # Log progress every 25 frames for better feedback
                if processed_count % 25 == 0:
                    elapsed_time = processed_count / target_fps
                    print(f"⏳ Processed {processed_count} frames ({elapsed_time:.1f}s of video analyzed)...")
            
            frame_index += 1
        
        cap.release()
        
        print(f"✓ Extracted and processed {processed_count} frames from {frame_index} total frames")
        
        # Use actual video duration, not max duration
        actual_duration = min(duration, max_video_duration)
        print(f"📊 Actual video duration: {actual_duration:.2f}s (max allowed: {max_video_duration}s)")
        
        # Get final summary with actual duration
        summary = orchestrator.get_session_summary(actual_duration)
        
        print(f"\n📊 Feature Extraction Results:")
        print(f"  Frames Processed: {processed_count}")
        print(f"  Eye Contact Segments: {len(orchestrator.eye_contact.eye_contact_segments)}")
        print(f"  Blink Count: {len(orchestrator.blink_rate.blink_timestamps)}")
        print(f"  Head Poses Tracked: {len(orchestrator.head_movement.head_pose_history)}")
        print(f"  Hand Movements: Left={len(orchestrator.hand_repetition.left_positions)}, Right={len(orchestrator.hand_repetition.right_positions)}")
        print(f"  Gestures Detected: {len(orchestrator.gesture_detection.gesture_timestamps)}")
        print(f"  Expressions Captured: {len(orchestrator.expression_variability.emotion_history)}")
        
        # Use actual video duration
        actual_duration = min(duration, max_video_duration)
        print(f"\n📊 Actual video duration: {actual_duration:.2f}s (video length: {duration:.2f}s, max allowed: {max_video_duration}s)")
        
        print(f"\n  Eye Contact Ratio: {summary.get('eye_contact_ratio', 'N/A')}")
        print(f"  Blink Rate/min: {summary.get('blink_rate_per_minute', 'N/A')}")
        print(f"  Head Movement Rate: {summary.get('head_movement_rate', 'N/A')}")
        print(f"  Hand Repetitive: {summary.get('hand_repetitive_movement', {}).get('detected', False)}")
        print(f"  Gesture Frequency/min: {summary.get('gesture_frequency_per_minute', 'N/A')}")
        print(f"  Expression Variability: {summary.get('facial_expression_variability', 'N/A')}")
        print(f"{'='*60}\n")
        
        return {
            "status": "success",
            "features": summary,
            "frames_processed": processed_count,
            "duration": actual_duration,
            "fps": target_fps
        }
        
    except Exception as e:
        print(f"✗ Error processing video: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Clean up temporary file
        if temp_video_path and os.path.exists(temp_video_path):
            try:
                os.unlink(temp_video_path)
                print(f"🗑️ Cleaned up temp file: {temp_video_path}")
            except Exception as e:
                print(f"⚠️ Could not delete temp file: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
