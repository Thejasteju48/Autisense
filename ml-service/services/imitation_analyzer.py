import cv2
import numpy as np
import mediapipe as mp
import base64
from typing import List, Dict
from collections import defaultdict

class ImitationAnalyzer:
    """
    Analyzes imitation ability during 'Copy the Friend' game.
    Uses MediaPipe Pose to detect if child imitates demonstrated actions.
    """
    
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
    def decode_frame(self, base64_str: str) -> np.ndarray:
        """Decode base64 string to image array"""
        if not base64_str or len(base64_str) < 10:
            raise ValueError("Invalid or empty base64 string")
        
        # Remove data URL prefix if present
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        
        img_bytes = base64.b64decode(base64_str)
        
        if len(img_bytes) == 0:
            raise ValueError("Decoded bytes are empty")
        
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Failed to decode image")
        
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    def extract_pose_features(self, landmarks) -> Dict[str, float]:
        """Extract key pose features for action comparison"""
        # Key landmarks for different actions
        left_wrist = landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value]
        right_wrist = landmarks[self.mp_pose.PoseLandmark.RIGHT_WRIST.value]
        left_shoulder = landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value]
        right_shoulder = landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
        nose = landmarks[self.mp_pose.PoseLandmark.NOSE.value]
        
        features = {
            # Hand positions (for clapping, raising)
            'left_hand_y': left_wrist.y,
            'right_hand_y': right_wrist.y,
            'hands_distance': np.sqrt((left_wrist.x - right_wrist.x)**2 + 
                                     (left_wrist.y - right_wrist.y)**2),
            
            # Hand height relative to shoulders (for raising hands)
            'left_hand_raised': left_wrist.y < left_shoulder.y,
            'right_hand_raised': right_wrist.y < right_shoulder.y,
            
            # Head position (for nodding)
            'head_y': nose.y,
            
            # Hand-to-body center (for waving)
            'left_hand_x': left_wrist.x,
            'right_hand_x': right_wrist.x
        }
        
        return features
    
    def detect_action(self, features: Dict[str, float]) -> str:
        """Detect which action is being performed based on pose features"""
        # Clapping: hands close together in front
        if features['hands_distance'] < 0.15:
            return 'clap'
        
        # Raising hands: both hands above shoulders
        if features['left_hand_raised'] and features['right_hand_raised']:
            return 'raiseHands'
        
        # Waving: hand moving side to side (detected by variation in subsequent frames)
        # This is simplified - real implementation would track motion over time
        if features['right_hand_y'] < 0.6 and abs(features['right_hand_x'] - 0.5) > 0.2:
            return 'wave'
        
        # Nodding: detected by head movement (simplified)
        if features['head_y'] > 0.4:
            return 'nod'
        
        return 'idle'
    
    def analyze(self, frames: List[str], duration: float) -> Dict:
        """
        Analyze imitation ability from frames captured during game.
        
        Frames contain metadata indicating:
        - Which action was demonstrated (action field)
        - Whether it's demonstration or imitation phase (phase field)
        
        Returns:
            Dictionary with imitation metrics and interpretation
        """
        total_frames = len(frames)
        successful_imitations = 0
        total_attempts = 0
        delays = []
        
        # Group frames by action and phase
        action_frames = defaultdict(lambda: {'demonstration': [], 'imitation': []})
        
        processed_frames = 0
        
        for frame_data in frames:
            try:
                # frames come as objects with frame, timestamp, action, phase
                if isinstance(frame_data, dict):
                    base64_frame = frame_data.get('frame')
                    action = frame_data.get('action', 'idle')
                    phase = frame_data.get('phase', 'demonstration')
                    timestamp = frame_data.get('timestamp', 0)
                else:
                    base64_frame = frame_data
                    action = 'idle'
                    phase = 'demonstration'
                    timestamp = 0
                
                # Decode frame
                frame = self.decode_frame(base64_frame)
                
                # Process with MediaPipe
                results = self.pose.process(frame)
                
                if results.pose_landmarks:
                    features = self.extract_pose_features(results.pose_landmarks.landmark)
                    detected_action = self.detect_action(features)
                    
                    action_frames[action][phase].append({
                        'timestamp': timestamp,
                        'detected': detected_action,
                        'features': features
                    })
                    
                    processed_frames += 1
                    
            except Exception as e:
                print(f"Error processing frame: {str(e)}")
                continue
        
        # Analyze each action attempt
        for action, phases in action_frames.items():
            if action == 'idle':
                continue
                
            if phases['imitation']:
                total_attempts += 1
                
                # Check if child performed the correct action during imitation phase
                imitation_actions = [f['detected'] for f in phases['imitation']]
                
                # Success if correct action detected in at least 30% of imitation frames
                correct_count = sum(1 for a in imitation_actions if a == action)
                if len(imitation_actions) > 0 and correct_count / len(imitation_actions) >= 0.3:
                    successful_imitations += 1
                    
                    # Calculate response delay
                    if phases['demonstration'] and phases['imitation']:
                        demo_end = phases['demonstration'][-1]['timestamp']
                        imit_start = phases['imitation'][0]['timestamp']
                        delay = imit_start - demo_end
                        delays.append(delay)
        
        # Calculate metrics
        if processed_frames == 0:
            raise Exception("No pose detected in frames")
        
        imitation_score = successful_imitations / total_attempts if total_attempts > 0 else 0
        average_delay = np.mean(delays) if delays else 0
        
        # Confidence based on processed frames
        confidence = min(processed_frames / total_frames, 1.0)
        
        # Similarity score (simplified - based on successful imitations)
        similarity_score = imitation_score
        
        # Generate interpretation
        interpretation = self._generate_interpretation(
            imitation_score, 
            successful_imitations, 
            total_attempts,
            average_delay
        )
        
        return {
            'imitationScore': round(imitation_score, 3),
            'successfulImitations': successful_imitations,
            'totalAttempts': total_attempts,
            'averageDelay': round(average_delay, 2) if average_delay > 0 else 0,
            'similarityScore': round(similarity_score, 3),
            'totalFrames': total_frames,
            'confidence': round(confidence, 3),
            'interpretation': interpretation
        }
    
    def _generate_interpretation(self, score: float, successful: int, total: int, delay: float) -> str:
        """Generate human-readable interpretation"""
        if score >= 0.75:
            ability = "excellent imitation ability"
        elif score >= 0.5:
            ability = "good imitation ability"
        elif score >= 0.25:
            ability = "emerging imitation skills"
        else:
            ability = "limited imitation observed"
        
        delay_text = ""
        if delay > 0:
            if delay < 2000:  # less than 2 seconds
                delay_text = " with quick response"
            elif delay < 5000:
                delay_text = " with moderate response delay"
            else:
                delay_text = " with delayed response"
        
        return f"Child demonstrated {ability} ({successful}/{total} actions imitated){delay_text}."
