"""
Head Movement Rate Feature Extractor
Tracks head pose changes over time (time-normalized)
Computes movement magnitude per second
"""

import cv2
import numpy as np
import mediapipe as mp
import time
from typing import Dict, List

class HeadMovementFeature:
    """
    Extracts head movement rate behavioral marker.
    Tracks nose position as proxy for head movement.
    Time-aware processing with warm-up period.
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
        self.NOSE_TIP = 1
        self.NOSE_BRIDGE = 6
        
        # Time-aware history
        self.head_pose_history: List[tuple] = []  # (timestamp, position, orientation)
        self.session_start_time = None
        self.warmup_duration = 10.0
    
    def extract(self, image: np.ndarray, timestamp: float = None) -> Dict:
        """
        Extract head pose from single frame (time-aware).
        
        Returns:
            Dictionary with head position and orientation
        """
        # FIXED: Single source of time - only use passed timestamp
        if timestamp is None:
            raise ValueError("Timestamp required")
        current_time = timestamp
        
        if self.session_start_time is None:
            self.session_start_time = current_time
        
        elapsed = current_time - self.session_start_time
        
        h, w = image.shape[:2]
        results = self.face_mesh.process(image)
        
        if not results.multi_face_landmarks:
            return {
                'detected': False,
                'warmup': elapsed < self.warmup_duration
            }
        
        landmarks = results.multi_face_landmarks[0].landmark
        
        # Use nose landmarks for head position (normalized 0-1)
        nose_tip = np.array([landmarks[self.NOSE_TIP].x, landmarks[self.NOSE_TIP].y])
        nose_bridge = np.array([landmarks[self.NOSE_BRIDGE].x, landmarks[self.NOSE_BRIDGE].y])
        
        # Orientation vector
        orientation = nose_tip - nose_bridge
        
        # Skip warm-up period
        if elapsed >= self.warmup_duration:
            self.head_pose_history.append((current_time, nose_tip, orientation))
        
        return {
            'detected': True,
            'position': nose_tip.tolist(),
            'orientation': orientation.tolist(),
            'warmup': elapsed < self.warmup_duration
        }
    
    def get_summary(self, session_duration_seconds: float = None) -> Dict:
        """
        Get head movement summary (frame-based, NOT time-normalized).
        
        Returns average movement magnitude per frame (no FPS assumptions).
        """
        if len(self.head_pose_history) < 2:
            return {
                'head_movement_level': 'insufficient_data',
                'interpretation': 'Insufficient data',
                'total_frames': len(self.head_pose_history)
            }
        
        # Calculate frame-to-frame movements (magnitude only)
        positions = np.array([p[1] for p in self.head_pose_history])
        movements = np.linalg.norm(np.diff(positions, axis=0), axis=1)
        
        total_movement = np.sum(movements)
        avg_movement_per_frame = np.mean(movements)
        
        # Clinical interpretation based on average movement magnitude
        # These thresholds are for normalized coordinates (0-1 range)
        if avg_movement_per_frame < 0.015:
            level = "low"
            interpretation = "Minimal head movement"
        elif avg_movement_per_frame < 0.05:
            level = "normal"
            interpretation = "Normal head movement"
        else:
            level = "high"
            interpretation = "Excessive head movement"
        
        return {
            'head_movement_level': level,
            'level': level,
            'interpretation': interpretation,
            'total_movement': round(total_movement, 4),
            'avg_movement_per_frame': round(avg_movement_per_frame, 4),
            'total_frames': len(self.head_pose_history)
        }
    
    def reset(self):
        """Reset history for new session"""
        self.head_pose_history = []
        self.session_start_time = None
