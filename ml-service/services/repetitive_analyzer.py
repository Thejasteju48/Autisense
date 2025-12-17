import cv2
import numpy as np
import mediapipe as mp
import base64
from typing import List, Dict

class RepetitiveAnalyzer:
    """
    Analyzes repetitive behaviors during free-play interaction.
    Uses MediaPipe Pose to detect oscillatory movements (hand flapping, rocking).
    """
    
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Pose landmark indices for tracking
        self.NOSE = 0
        self.LEFT_WRIST = 15
        self.RIGHT_WRIST = 16
        self.LEFT_SHOULDER = 11
        self.RIGHT_SHOULDER = 12
        
        # Store position history for pattern detection
        self.wrist_history = []
        self.head_history = []
        
    def decode_frame(self, base64_str: str) -> np.ndarray:
        """Decode base64 string to image array"""
        img_bytes = base64.b64decode(base64_str.split(',')[1] if ',' in base64_str else base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    def detect_oscillatory_motion(self, position_history: List[np.ndarray], axis: int = 1) -> Dict:
        """
        Detect oscillatory (back-and-forth) motion.
        
        Args:
            position_history: List of positions over time
            axis: 0 for x (horizontal), 1 for y (vertical)
        
        Returns:
            Dictionary with oscillation metrics
        """
        if len(position_history) < 5:
            return {'oscillations': 0, 'range': 0}
        
        positions = np.array(position_history)
        values = positions[:, axis]
        
        # Calculate direction changes (sign changes in velocity)
        velocity = np.diff(values)
        sign_changes = np.sum(np.diff(np.sign(velocity)) != 0)
        
        # Calculate range of motion
        motion_range = np.max(values) - np.min(values)
        
        # Count oscillations (each complete cycle = 2 sign changes)
        oscillation_count = sign_changes // 2
        
        return {
            'oscillations': oscillation_count,
            'range': motion_range
        }
    
    def detect_hand_flapping(self, wrist_positions: List[np.ndarray]) -> Dict:
        """
        Detect hand flapping pattern (rapid up-down wrist movement).
        """
        if len(wrist_positions) < 10:
            return {'detected': False, 'intensity': 0}
        
        # Check vertical oscillations
        vertical = self.detect_oscillatory_motion(wrist_positions, axis=1)
        
        # Hand flapping: high frequency vertical motion with significant range
        is_flapping = vertical['oscillations'] >= 3 and vertical['range'] > 0.1
        intensity = min(vertical['oscillations'] * vertical['range'] * 10, 1.0)
        
        return {
            'detected': is_flapping,
            'intensity': intensity,
            'oscillations': vertical['oscillations']
        }
    
    def detect_rocking(self, head_positions: List[np.ndarray]) -> Dict:
        """
        Detect rocking motion (side-to-side head/body movement).
        """
        if len(head_positions) < 10:
            return {'detected': False, 'intensity': 0}
        
        # Check horizontal oscillations
        horizontal = self.detect_oscillatory_motion(head_positions, axis=0)
        
        # Rocking: rhythmic side-to-side motion
        is_rocking = horizontal['oscillations'] >= 2 and horizontal['range'] > 0.05
        intensity = min(horizontal['oscillations'] * horizontal['range'] * 10, 1.0)
        
        return {
            'detected': is_rocking,
            'intensity': intensity,
            'oscillations': horizontal['oscillations']
        }
    
    def analyze(self, frames: List[str], duration: float) -> Dict:
        """
        Analyze repetitive behaviors from frames captured during interaction.
        
        Returns:
            Dictionary with repetitive behavior metrics and interpretation
        """
        total_frames = len(frames)
        processed_frames = 0
        wrist_positions = []
        head_positions = []
        
        for frame_b64 in frames:
            try:
                # Decode frame
                frame = self.decode_frame(frame_b64)
                
                # Process with MediaPipe
                results = self.pose.process(frame)
                
                if results.pose_landmarks:
                    landmarks = results.pose_landmarks.landmark
                    
                    # Track wrist positions (for hand flapping)
                    left_wrist = np.array([landmarks[self.LEFT_WRIST].x, 
                                          landmarks[self.LEFT_WRIST].y])
                    right_wrist = np.array([landmarks[self.RIGHT_WRIST].x,
                                           landmarks[self.RIGHT_WRIST].y])
                    avg_wrist = (left_wrist + right_wrist) / 2
                    wrist_positions.append(avg_wrist)
                    
                    # Track head position (for rocking)
                    nose = np.array([landmarks[self.NOSE].x, landmarks[self.NOSE].y])
                    head_positions.append(nose)
                    
                    processed_frames += 1
                    
            except Exception as e:
                print(f"Error processing frame: {str(e)}")
                continue
        
        # Calculate metrics
        if processed_frames < 10:
            raise Exception("Insufficient pose data detected")
        
        # Detect patterns
        flapping = self.detect_hand_flapping(wrist_positions)
        rocking = self.detect_rocking(head_positions)
        
        # Overall repetitive behavior score
        total_oscillations = flapping['oscillations'] + rocking['oscillations']
        pattern_score = (flapping['intensity'] + rocking['intensity']) / 2
        
        # Calculate overall motion range
        wrist_motion = self.detect_oscillatory_motion(wrist_positions, axis=1)
        head_motion = self.detect_oscillatory_motion(head_positions, axis=0)
        avg_motion_range = (wrist_motion['range'] + head_motion['range']) / 2
        
        # Repetitive ratio: 0 = no repetitive behavior, 1 = high repetitive behavior
        repetitive_ratio = min(pattern_score, 1.0)
        
        # Confidence based on processing
        confidence = min(processed_frames / total_frames, 1.0)
        
        # Generate interpretation
        interpretation = self._generate_interpretation(
            flapping['detected'], rocking['detected'], repetitive_ratio, total_oscillations
        )
        
        return {
            'repetitiveRatio': round(repetitive_ratio, 3),
            'oscillationCount': total_oscillations,
            'motionRange': round(avg_motion_range, 3),
            'patternScore': round(pattern_score, 3),
            'totalFrames': total_frames,
            'confidence': round(confidence, 3),
            'interpretation': interpretation
        }
    
    def _generate_interpretation(self, flapping: bool, rocking: bool, 
                                  ratio: float, oscillations: int) -> str:
        """Generate human-readable interpretation"""
        behaviors_detected = []
        if flapping:
            behaviors_detected.append("hand flapping")
        if rocking:
            behaviors_detected.append("rocking motion")
        
        if ratio > 0.6:
            level = "significant repetitive behaviors"
        elif ratio > 0.3:
            level = "moderate repetitive behaviors"
        else:
            level = "minimal repetitive behaviors"
        
        if behaviors_detected:
            behavior_text = f"including {' and '.join(behaviors_detected)}"
        else:
            behavior_text = "with no clear stereotypical patterns"
        
        return f"Child demonstrated {level} ({oscillations} oscillatory movements detected) {behavior_text} during free play."
