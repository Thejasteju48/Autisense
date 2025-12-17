import cv2
import numpy as np
import mediapipe as mp
import base64
from typing import List, Dict

class GestureAnalyzer:
    """
    Analyzes gestures during 'Wave at the Character' game.
    Uses MediaPipe Hands to detect waving and pointing gestures.
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
        self.RING_TIP = 16
        self.PINKY_TIP = 20
        
        # Store previous hand positions for motion detection
        self.prev_positions = []
        
    def decode_frame(self, base64_str: str) -> np.ndarray:
        """Decode base64 string to image array"""
        img_bytes = base64.b64decode(base64_str.split(',')[1] if ',' in base64_str else base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    def get_hand_center(self, landmarks) -> np.ndarray:
        """Calculate center position of hand"""
        points = np.array([[lm.x, lm.y] for lm in landmarks.landmark])
        return np.mean(points, axis=0)
    
    def detect_wave(self, current_pos: np.ndarray, history: List[np.ndarray]) -> bool:
        """
        Detect waving motion based on lateral movement.
        Wave is side-to-side motion with certain frequency.
        """
        if len(history) < 5:
            return False
        
        recent = np.array(history[-5:])
        
        # Calculate lateral (x-axis) movement
        x_positions = recent[:, 0]
        x_range = np.max(x_positions) - np.min(x_positions)
        
        # Check for oscillatory pattern (direction changes)
        x_diff = np.diff(x_positions)
        sign_changes = np.sum(np.diff(np.sign(x_diff)) != 0)
        
        # Wave detected if there's significant lateral movement with direction changes
        is_wave = x_range > 0.15 and sign_changes >= 2
        
        return is_wave
    
    def detect_point(self, landmarks) -> bool:
        """
        Detect pointing gesture.
        Pointing is when index finger is extended and other fingers are bent.
        """
        index_tip = np.array([landmarks.landmark[self.INDEX_TIP].x, 
                              landmarks.landmark[self.INDEX_TIP].y])
        middle_tip = np.array([landmarks.landmark[self.MIDDLE_TIP].x,
                                landmarks.landmark[self.MIDDLE_TIP].y])
        wrist = np.array([landmarks.landmark[self.WRIST].x,
                          landmarks.landmark[self.WRIST].y])
        
        # Calculate distances from wrist
        index_dist = np.linalg.norm(index_tip - wrist)
        middle_dist = np.linalg.norm(middle_tip - wrist)
        
        # Pointing: index extended, middle/ring/pinky bent
        is_pointing = index_dist > middle_dist * 1.2
        
        return is_pointing
    
    def analyze(self, frames: List[str], duration: float) -> Dict:
        """
        Analyze gestures from frames captured during interaction.
        
        Returns:
            Dictionary with gesture metrics and interpretation
        """
        total_frames = len(frames)
        wave_count = 0
        point_count = 0
        hand_detected_frames = 0
        position_history = []
        movement_scores = []
        
        for frame_b64 in frames:
            try:
                # Decode frame
                frame = self.decode_frame(frame_b64)
                
                # Process with MediaPipe
                results = self.hands.process(frame)
                
                if results.multi_hand_landmarks:
                    hand_detected_frames += 1
                    
                    for hand_landmarks in results.multi_hand_landmarks:
                        # Get hand center position
                        center = self.get_hand_center(hand_landmarks)
                        position_history.append(center)
                        
                        # Detect waving
                        if self.detect_wave(center, position_history):
                            wave_count += 1
                        
                        # Detect pointing
                        if self.detect_point(hand_landmarks):
                            point_count += 1
                        
                        # Calculate movement score
                        if len(position_history) >= 2:
                            movement = np.linalg.norm(position_history[-1] - position_history[-2])
                            movement_scores.append(movement)
                
            except Exception as e:
                print(f"Error processing frame: {str(e)}")
                continue
        
        # Calculate metrics
        if hand_detected_frames == 0:
            raise Exception("No hands detected in frames")
        
        gesture_frequency = wave_count + point_count
        hand_movement_score = np.mean(movement_scores) if movement_scores else 0
        
        # Confidence based on hand detection
        confidence = min(hand_detected_frames / total_frames, 1.0)
        
        # Generate interpretation
        interpretation = self._generate_interpretation(
            wave_count, point_count, hand_movement_score
        )
        
        return {
            'gestureFrequency': gesture_frequency,
            'waveCount': wave_count,
            'pointCount': point_count,
            'handMovementScore': round(float(hand_movement_score), 3),
            'totalFrames': total_frames,
            'confidence': round(confidence, 3),
            'interpretation': interpretation
        }
    
    def _generate_interpretation(self, waves: int, points: int, movement: float) -> str:
        """Generate human-readable interpretation"""
        total_gestures = waves + points
        
        if total_gestures >= 5:
            gesture_level = "frequent and varied"
        elif total_gestures >= 2:
            gesture_level = "moderate"
        else:
            gesture_level = "limited"
        
        if movement > 0.05:
            movement_text = "with active hand movements"
        else:
            movement_text = "with minimal hand activity"
        
        gesture_details = []
        if waves > 0:
            gesture_details.append(f"{waves} waving motion(s)")
        if points > 0:
            gesture_details.append(f"{points} pointing gesture(s)")
        
        details_text = " and ".join(gesture_details) if gesture_details else "no clear gestures"
        
        return f"Child demonstrated {gesture_level} gesture usage ({details_text}) {movement_text}."
