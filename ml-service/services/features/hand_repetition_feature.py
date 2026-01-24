"""
Hand Repetitive Movement Feature Extractor
Tracks wrist landmarks from MediaPipe Pose
Detects repeated oscillatory motion (stimming, flapping)
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Dict

class HandRepetitionFeature:
    """
    Extracts hand repetitive movement behavioral marker.
    Detects flapping, stimming patterns using wrist tracking.
    """
    
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Landmark indices
        self.LEFT_WRIST = 15
        self.RIGHT_WRIST = 16
        
        # History
        self.wrist_history = {
            'left': [],
            'right': []
        }
        
        self.window_size = 30
        self.MIN_RANGE = 0.1  # Minimum vertical movement
    
    def extract(self, image: np.ndarray) -> Dict:
        """
        Extract wrist positions from single frame.
        
        Returns:
            Dictionary with left and right wrist positions
        """
        results = self.pose.process(image)
        
        if not results.pose_landmarks:
            return {'detected': False}
        
        landmarks = results.pose_landmarks.landmark
        
        left_wrist = np.array([
            landmarks[self.LEFT_WRIST].x,
            landmarks[self.LEFT_WRIST].y
        ])
        right_wrist = np.array([
            landmarks[self.RIGHT_WRIST].x,
            landmarks[self.RIGHT_WRIST].y
        ])
        
        # Store positions
        self.wrist_history['left'].append(left_wrist)
        self.wrist_history['right'].append(right_wrist)
        
        return {
            'detected': True,
            'left_wrist': left_wrist.tolist(),
            'right_wrist': right_wrist.tolist()
        }
    
    def detect_hand_oscillation(self, hand: str = 'left', window_size: int = None) -> Dict:
        """
        Detect repetitive hand movements for specified hand.
        
        Args:
            hand: 'left' or 'right'
            window_size: Number of recent frames to analyze
        
        Returns:
            Dictionary with oscillation detection results
        """
        if window_size is None:
            window_size = self.window_size
        
        history = self.wrist_history[hand]
        
        if len(history) < window_size:
            return {
                'detected': False,
                'oscillations': 0,
                'intensity': 0.0
            }
        
        recent = history[-window_size:]
        positions = np.array(recent)
        
        # Analyze vertical movement (primary axis for flapping)
        y_values = positions[:, 1]
        y_velocity = np.diff(y_values)
        y_sign_changes = np.sum(np.diff(np.sign(y_velocity)) != 0)
        y_range = np.max(y_values) - np.min(y_values)
        
        # Flapping = rapid vertical oscillations
        oscillations = y_sign_changes // 2 if y_range > self.MIN_RANGE else 0
        intensity = min(oscillations * y_range, 1.0)
        
        return {
            'detected': oscillations > 0,
            'oscillations': int(oscillations),
            'range': float(y_range),
            'intensity': float(intensity)
        }
    
    def get_summary(self) -> Dict:
        """Get final hand repetition analysis for both hands"""
        window = min(150, max(
            len(self.wrist_history['left']),
            len(self.wrist_history['right'])
        ))
        
        left = self.detect_hand_oscillation('left', window)
        right = self.detect_hand_oscillation('right', window)
        
        return {
            'left_hand': {
                'detected': left['detected'],
                'oscillations': left['oscillations'],
                'intensity': left['intensity']
            },
            'right_hand': {
                'detected': right['detected'],
                'oscillations': right['oscillations'],
                'intensity': right['intensity']
            }
        }
    
    def reset(self):
        """Reset for new session"""
        self.wrist_history = {'left': [], 'right': []}
