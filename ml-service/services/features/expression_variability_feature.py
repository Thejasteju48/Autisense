"""
Facial Expression Variability Feature Extractor
Tracks facial landmark movement variance (mouth, eyebrows)
Measures expression diversity over time
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Dict, List

class ExpressionVariabilityFeature:
    """
    Extracts facial expression variability behavioral marker.
    Measures variance in facial expressions over time.
    """
    
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6
        )
        
        # Expression landmark indices
        self.MOUTH_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375]
        self.LEFT_EYEBROW = [70, 63, 105, 66, 107]
        self.RIGHT_EYEBROW = [336, 296, 334, 293, 300]
        
        # History
        self.expression_history = []
        self.window_size = 60  # frames for variance calculation
    
    def extract(self, image: np.ndarray) -> Dict:
        """
        Extract facial expression features from single frame.
        
        Returns:
            Dictionary with expression measurements
        """
        h, w = image.shape[:2]
        results = self.face_mesh.process(image)
        
        if not results.multi_face_landmarks:
            return {'detected': False}
        
        landmarks = results.multi_face_landmarks[0].landmark
        
        # Extract key expression points
        mouth_pts = np.array([
            [landmarks[i].x * w, landmarks[i].y * h]
            for i in self.MOUTH_OUTER
        ])
        left_brow_pts = np.array([
            [landmarks[i].x * w, landmarks[i].y * h]
            for i in self.LEFT_EYEBROW
        ])
        right_brow_pts = np.array([
            [landmarks[i].x * w, landmarks[i].y * h]
            for i in self.RIGHT_EYEBROW
        ])
        
        # Calculate features
        mouth_height = np.max(mouth_pts[:, 1]) - np.min(mouth_pts[:, 1])
        mouth_width = np.max(mouth_pts[:, 0]) - np.min(mouth_pts[:, 0])
        brow_height = (np.mean(left_brow_pts[:, 1]) + np.mean(right_brow_pts[:, 1])) / 2
        
        features = {
            'mouth_height': mouth_height,
            'mouth_width': mouth_width,
            'brow_height': brow_height
        }
        
        self.expression_history.append(features)
        
        return {
            'detected': True,
            'features': features
        }
    
    def calculate_variability(self, window_size: int = None) -> Dict:
        """
        Calculate variance in expressions over time window.
        
        Returns:
            Dictionary with variability metrics
        """
        if window_size is None:
            window_size = self.window_size
        
        if len(self.expression_history) < window_size:
            return {'variability': 0.0}
        
        recent = self.expression_history[-window_size:]
        
        mouth_heights = [f['mouth_height'] for f in recent]
        mouth_widths = [f['mouth_width'] for f in recent]
        brow_heights = [f['brow_height'] for f in recent]
        
        # Calculate variance
        mouth_h_var = np.var(mouth_heights)
        mouth_w_var = np.var(mouth_widths)
        brow_var = np.var(brow_heights)
        
        # Normalized variability score
        total_variability = (mouth_h_var + mouth_w_var + brow_var) / 3
        
        return {
            'variability': float(total_variability),
            'mouth_height_var': float(mouth_h_var),
            'mouth_width_var': float(mouth_w_var),
            'brow_var': float(brow_var)
        }
    
    def get_summary(self) -> Dict:
        """Get final expression variability analysis"""
        if not self.expression_history:
            return {'facial_expression_variability': 0.0}
        
        # Use up to 300 frames for final calculation
        window = min(300, len(self.expression_history))
        result = self.calculate_variability(window)
        
        return {
            'facial_expression_variability': round(result['variability'], 4),
            'total_frames': len(self.expression_history)
        }
    
    def reset(self):
        """Reset for new session"""
        self.expression_history = []
