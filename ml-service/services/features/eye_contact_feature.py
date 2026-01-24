"""
Eye Contact Ratio Feature Extractor
Detects face and eyes using MediaPipe Face Mesh
Estimates gaze direction toward camera
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Dict, List

class EyeContactFeature:
    """
    Extracts eye contact behavioral marker.
    Uses MediaPipe Face Mesh with iris landmarks for gaze estimation.
    """
    
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6
        )
        
        # Landmark indices
        self.LEFT_EYE_EAR = [33, 160, 158, 133, 153, 144]
        self.RIGHT_EYE_EAR = [263, 387, 385, 362, 380, 373]
        self.LEFT_IRIS = [474, 475, 476, 477]
        self.RIGHT_IRIS = [469, 470, 471, 472]
        self.LEFT_EYE_OUTER = 362
        self.LEFT_EYE_INNER = 263
        self.RIGHT_EYE_OUTER = 33
        self.RIGHT_EYE_INNER = 133
        
        # Thresholds
        self.EYE_OPEN_THRESHOLD = 0.20
        self.GAZE_CENTER_MIN = 0.35
        self.GAZE_CENTER_MAX = 0.65
        
        # History
        self.gaze_history = []
    
    def calculate_ear(self, eye_landmarks: List, landmarks, w: int, h: int) -> float:
        """Calculate Eye Aspect Ratio"""
        pts = np.array([[landmarks[i].x * w, landmarks[i].y * h] for i in eye_landmarks])
        p1, p2, p3, p4, p5, p6 = pts
        
        v1 = np.linalg.norm(p2 - p6)
        v2 = np.linalg.norm(p3 - p5)
        h1 = np.linalg.norm(p1 - p4)
        
        return (v1 + v2) / (2.0 * h1) if h1 > 1e-3 else 0.0
    
    def estimate_gaze(self, landmarks, w: int, h: int) -> Dict:
        """Estimate if gaze is directed toward camera"""
        # Get iris centers
        left_iris_pts = np.array([[landmarks[i].x * w, landmarks[i].y * h] 
                                  for i in self.LEFT_IRIS])
        right_iris_pts = np.array([[landmarks[i].x * w, landmarks[i].y * h] 
                                   for i in self.RIGHT_IRIS])
        
        left_iris_center = np.mean(left_iris_pts, axis=0)
        right_iris_center = np.mean(right_iris_pts, axis=0)
        
        # Get eye corners
        left_outer = np.array([landmarks[self.LEFT_EYE_OUTER].x * w, 
                              landmarks[self.LEFT_EYE_OUTER].y * h])
        left_inner = np.array([landmarks[self.LEFT_EYE_INNER].x * w,
                              landmarks[self.LEFT_EYE_INNER].y * h])
        right_outer = np.array([landmarks[self.RIGHT_EYE_OUTER].x * w,
                               landmarks[self.RIGHT_EYE_OUTER].y * h])
        right_inner = np.array([landmarks[self.RIGHT_EYE_INNER].x * w,
                               landmarks[self.RIGHT_EYE_INNER].y * h])
        
        # Calculate gaze ratio
        left_h_ratio = np.linalg.norm(left_iris_center - left_outer) / \
                       (np.linalg.norm(left_outer - left_inner) + 1e-6)
        right_h_ratio = np.linalg.norm(right_iris_center - right_outer) / \
                        (np.linalg.norm(right_outer - right_inner) + 1e-6)
        
        avg_h_ratio = (left_h_ratio + right_h_ratio) / 2
        looking_at_camera = self.GAZE_CENTER_MIN < avg_h_ratio < self.GAZE_CENTER_MAX
        
        return {
            'horizontal_ratio': avg_h_ratio,
            'looking_at_camera': looking_at_camera
        }
    
    def extract(self, image: np.ndarray) -> Dict:
        """
        Extract eye contact feature from single frame.
        
        Returns:
            Dictionary with eye contact status and metrics
        """
        h, w = image.shape[:2]
        results = self.face_mesh.process(image)
        
        if not results.multi_face_landmarks:
            return {'detected': False, 'eye_contact': False}
        
        landmarks = results.multi_face_landmarks[0].landmark
        
        # Check if eyes are open
        left_ear = self.calculate_ear(self.LEFT_EYE_EAR, landmarks, w, h)
        right_ear = self.calculate_ear(self.RIGHT_EYE_EAR, landmarks, w, h)
        avg_ear = (left_ear + right_ear) / 2
        eyes_open = avg_ear > self.EYE_OPEN_THRESHOLD
        
        # Estimate gaze
        gaze = self.estimate_gaze(landmarks, w, h)
        
        # Eye contact = eyes open + looking at camera
        eye_contact = eyes_open and gaze['looking_at_camera']
        self.gaze_history.append(eye_contact)
        
        return {
            'detected': True,
            'eye_contact': eye_contact,
            'eyes_open': eyes_open,
            'ear': avg_ear,
            'gaze_ratio': gaze['horizontal_ratio']
        }
    
    def get_summary(self) -> Dict:
        """Get aggregated eye contact ratio"""
        if not self.gaze_history:
            return {'eye_contact_ratio': 0.0, 'total_frames': 0}
        
        eye_contact_frames = sum(self.gaze_history)
        total_frames = len(self.gaze_history)
        ratio = eye_contact_frames / total_frames
        
        return {
            'eye_contact_ratio': round(ratio, 3),
            'total_frames': total_frames,
            'eye_contact_frames': eye_contact_frames
        }
    
    def reset(self):
        """Reset history for new session"""
        self.gaze_history = []
