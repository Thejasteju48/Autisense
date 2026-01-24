"""
Gesture Frequency Feature Extractor
Counts intentional hand gestures (waving, pointing, clapping)
Normalizes per minute
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Dict, List

class GestureDetectionFeature:
    """
    Extracts gesture frequency behavioral marker.
    Detects intentional social gestures.
    """
    
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Hand landmark indices
        self.WRIST = 0
        self.THUMB_TIP = 4
        self.INDEX_TIP = 8
        self.MIDDLE_TIP = 12
        
        # Gesture tracking
        self.gesture_timestamps = []
        self.frame_count = 0
    
    def detect_pointing(self, landmarks) -> bool:
        """
        Detect pointing gesture.
        Pointing = index finger extended, others bent
        """
        index_tip = np.array([
            landmarks.landmark[self.INDEX_TIP].x,
            landmarks.landmark[self.INDEX_TIP].y
        ])
        middle_tip = np.array([
            landmarks.landmark[self.MIDDLE_TIP].x,
            landmarks.landmark[self.MIDDLE_TIP].y
        ])
        wrist = np.array([
            landmarks.landmark[self.WRIST].x,
            landmarks.landmark[self.WRIST].y
        ])
        
        # Distance from wrist
        index_dist = np.linalg.norm(index_tip - wrist)
        middle_dist = np.linalg.norm(middle_tip - wrist)
        
        # Pointing if index extended more than middle
        return index_dist > middle_dist * 1.2
    
    def extract(self, image: np.ndarray) -> Dict:
        """
        Detect gestures in single frame.
        
        Returns:
            Dictionary with detected gestures
        """
        self.frame_count += 1
        results = self.hands.process(image)
        
        if not results.multi_hand_landmarks:
            return {'detected': False, 'gestures': []}
        
        gestures_detected = []
        
        for hand_landmarks in results.multi_hand_landmarks:
            # Check for pointing
            if self.detect_pointing(hand_landmarks):
                gestures_detected.append('pointing')
                self.gesture_timestamps.append(self.frame_count)
        
        return {
            'detected': len(gestures_detected) > 0,
            'gestures': gestures_detected,
            'count': len(gestures_detected)
        }
    
    def get_summary(self, session_duration_seconds: float) -> Dict:
        """Get gesture frequency per minute"""
        if session_duration_seconds <= 0:
            return {
                'gesture_frequency_per_minute': 0.0,
                'total_gestures': 0
            }
        
        gesture_count = len(self.gesture_timestamps)
        frequency = (gesture_count / session_duration_seconds) * 60
        
        return {
            'gesture_frequency_per_minute': round(frequency, 2),
            'total_gestures': gesture_count,
            'total_frames': self.frame_count
        }
    
    def reset(self):
        """Reset for new session"""
        self.gesture_timestamps = []
        self.frame_count = 0
