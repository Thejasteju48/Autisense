"""
Blink Rate Feature Extractor
Uses Eye Aspect Ratio (EAR) from facial landmarks
Counts blinks per minute
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Dict, List

class BlinkRateFeature:
    """
    Extracts blink rate behavioral marker.
    Uses EAR (Eye Aspect Ratio) threshold-based blink detection.
    """
    
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6
        )
        
        # Landmark indices for EAR
        self.LEFT_EYE_EAR = [33, 160, 158, 133, 153, 144]
        self.RIGHT_EYE_EAR = [263, 387, 385, 362, 380, 373]
        
        # Blink detection
        self.BLINK_THRESHOLD = 0.18
        self.blink_history = []
        self.frame_count = 0
    
    def calculate_ear(self, eye_landmarks: List, landmarks, w: int, h: int) -> float:
        """Calculate Eye Aspect Ratio"""
        pts = np.array([[landmarks[i].x * w, landmarks[i].y * h] for i in eye_landmarks])
        p1, p2, p3, p4, p5, p6 = pts
        
        v1 = np.linalg.norm(p2 - p6)
        v2 = np.linalg.norm(p3 - p5)
        h1 = np.linalg.norm(p1 - p4)
        
        return (v1 + v2) / (2.0 * h1) if h1 > 1e-3 else 0.0
    
    def extract(self, image: np.ndarray) -> Dict:
        """
        Extract blink detection from single frame.
        
        Returns:
            Dictionary with blink status and EAR value
        """
        self.frame_count += 1
        h, w = image.shape[:2]
        results = self.face_mesh.process(image)
        
        if not results.multi_face_landmarks:
            return {'detected': False, 'is_blink': False}
        
        landmarks = results.multi_face_landmarks[0].landmark
        
        # Calculate EAR for both eyes
        left_ear = self.calculate_ear(self.LEFT_EYE_EAR, landmarks, w, h)
        right_ear = self.calculate_ear(self.RIGHT_EYE_EAR, landmarks, w, h)
        avg_ear = (left_ear + right_ear) / 2
        
        # Blink detected if EAR below threshold
        is_blink = avg_ear < self.BLINK_THRESHOLD
        
        self.blink_history.append({
            'ear': avg_ear,
            'is_blink': is_blink,
            'frame': self.frame_count
        })
        
        return {
            'detected': True,
            'is_blink': is_blink,
            'ear': avg_ear
        }
    
    def get_summary(self, session_duration_seconds: float) -> Dict:
        """Get blink rate per minute"""
        if not self.blink_history or session_duration_seconds <= 0:
            return {'blink_rate_per_minute': 0.0, 'total_blinks': 0}
        
        # Count blinks (consecutive blink frames count as one)
        blink_count = 0
        in_blink = False
        
        for entry in self.blink_history:
            if entry['is_blink'] and not in_blink:
                blink_count += 1
                in_blink = True
            elif not entry['is_blink']:
                in_blink = False
        
        blink_rate = (blink_count / session_duration_seconds) * 60
        
        return {
            'blink_rate_per_minute': round(blink_rate, 2),
            'total_blinks': blink_count,
            'total_frames': len(self.blink_history)
        }
    
    def reset(self):
        """Reset history for new session"""
        self.blink_history = []
        self.frame_count = 0
