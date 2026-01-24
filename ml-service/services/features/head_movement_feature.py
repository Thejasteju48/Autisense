"""
Head Movement Rate Feature Extractor
Tracks head pose changes over time
Computes average movement magnitude per second
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Dict

class HeadMovementFeature:
    """
    Extracts head movement rate behavioral marker.
    Tracks nose position as proxy for head movement.
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
        
        # History
        self.head_pose_history = []
        self.frame_count = 0
    
    def extract(self, image: np.ndarray) -> Dict:
        """
        Extract head pose from single frame.
        
        Returns:
            Dictionary with head position and orientation
        """
        self.frame_count += 1
        h, w = image.shape[:2]
        results = self.face_mesh.process(image)
        
        if not results.multi_face_landmarks:
            return {'detected': False}
        
        landmarks = results.multi_face_landmarks[0].landmark
        
        # Use nose landmarks for head position
        nose_tip = np.array([landmarks[self.NOSE_TIP].x, landmarks[self.NOSE_TIP].y])
        nose_bridge = np.array([landmarks[self.NOSE_BRIDGE].x, landmarks[self.NOSE_BRIDGE].y])
        
        # Orientation vector
        orientation = nose_tip - nose_bridge
        
        head_pose = {
            'position': nose_tip,
            'orientation': orientation,
            'frame': self.frame_count
        }
        
        self.head_pose_history.append(head_pose)
        
        return {
            'detected': True,
            'position': nose_tip.tolist(),
            'orientation': orientation.tolist()
        }
    
    def get_summary(self, fps: float = 5.0) -> Dict:
        """Get average head movement rate"""
        if len(self.head_pose_history) < 2:
            return {'head_movement_rate': 0.0, 'total_movement': 0.0}
        
        # Calculate frame-to-frame movements
        positions = np.array([p['position'] for p in self.head_pose_history])
        movements = np.linalg.norm(np.diff(positions, axis=0), axis=1)
        
        total_movement = np.sum(movements)
        avg_movement_per_frame = np.mean(movements)
        
        # Convert to per-second rate (assuming fps)
        movement_rate = avg_movement_per_frame * fps
        
        return {
            'head_movement_rate': round(movement_rate, 4),
            'total_movement': round(total_movement, 4),
            'avg_per_frame': round(avg_movement_per_frame, 4),
            'total_frames': len(self.head_pose_history)
        }
    
    def reset(self):
        """Reset history for new session"""
        self.head_pose_history = []
        self.frame_count = 0
