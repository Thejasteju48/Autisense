import cv2
import numpy as np
import mediapipe as mp
import base64
from typing import List, Dict

class EyeContactAnalyzer:
    """
    Analyzes eye contact during 'Look at the Character' game.
    Uses MediaPipe FaceMesh to detect eye gaze direction and alignment.
    """
    
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Eye landmarks indices
        self.LEFT_EYE = [362, 385, 387, 263, 373, 380]
        self.RIGHT_EYE = [33, 160, 158, 133, 153, 144]
        self.LEFT_IRIS = [474, 475, 476, 477]
        self.RIGHT_IRIS = [469, 470, 471, 472]
        
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
    
    def calculate_ear(self, eye_landmarks: List, landmarks) -> float:
        """
        Calculate Eye Aspect Ratio (EAR).
        Higher EAR means eye is more open.
        """
        points = np.array([[landmarks[i].x, landmarks[i].y] for i in eye_landmarks])
        
        # Vertical distances
        v1 = np.linalg.norm(points[1] - points[5])
        v2 = np.linalg.norm(points[2] - points[4])
        
        # Horizontal distance
        h = np.linalg.norm(points[0] - points[3])
        
        ear = (v1 + v2) / (2.0 * h) if h > 0 else 0
        return ear
    
    def get_iris_position(self, iris_landmarks: List, landmarks) -> np.ndarray:
        """Get center position of iris"""
        iris_points = np.array([[landmarks[i].x, landmarks[i].y] for i in iris_landmarks])
        return np.mean(iris_points, axis=0)
    
    def get_eye_center(self, eye_landmarks: List, landmarks) -> np.ndarray:
        """Get center position of eye"""
        eye_points = np.array([[landmarks[i].x, landmarks[i].y] for i in eye_landmarks])
        return np.mean(eye_points, axis=0)
    
    def check_eye_contact(self, landmarks) -> Dict[str, float]:
        """
        Check if child is making eye contact by analyzing iris position.
        Eye contact is detected when iris is centered within the eye.
        """
        # Get iris and eye positions
        left_iris = self.get_iris_position(self.LEFT_IRIS, landmarks)
        right_iris = self.get_iris_position(self.RIGHT_IRIS, landmarks)
        left_eye_center = self.get_eye_center(self.LEFT_EYE, landmarks)
        right_eye_center = self.get_eye_center(self.RIGHT_EYE, landmarks)
        
        # Calculate deviation from center
        left_deviation = np.linalg.norm(left_iris - left_eye_center)
        right_deviation = np.linalg.norm(right_iris - right_eye_center)
        avg_deviation = (left_deviation + right_deviation) / 2
        
        # Calculate EAR
        left_ear = self.calculate_ear(self.LEFT_EYE, landmarks)
        right_ear = self.calculate_ear(self.RIGHT_EYE, landmarks)
        avg_ear = (left_ear + right_ear) / 2
        
        # Get nose position for alignment
        nose_tip = landmarks[1]
        nose_pos = np.array([nose_tip.x, nose_tip.y])
        face_center = (left_eye_center + right_eye_center) / 2
        alignment = np.linalg.norm(nose_pos - face_center)
        
        # Eye contact threshold
        CONTACT_THRESHOLD = 0.02
        has_contact = avg_deviation < CONTACT_THRESHOLD and avg_ear > 0.2
        
        return {
            'has_contact': has_contact,
            'ear': avg_ear,
            'alignment': alignment,
            'deviation': avg_deviation
        }
    
    def analyze(self, frames: List[str], duration: float) -> Dict:
        """
        Analyze eye contact from frames captured during interaction.
        
        Returns:
            Dictionary with eye contact metrics and interpretation
        """
        total_frames = len(frames)
        contact_frames = 0
        ear_sum = 0
        alignment_sum = 0
        processed_frames = 0
        
        for frame_b64 in frames:
            try:
                # Decode frame
                frame = self.decode_frame(frame_b64)
                
                # Process with MediaPipe
                results = self.face_mesh.process(frame)
                
                if results.multi_face_landmarks:
                    landmarks = results.multi_face_landmarks[0].landmark
                    
                    # Check eye contact
                    contact_data = self.check_eye_contact(landmarks)
                    
                    if contact_data['has_contact']:
                        contact_frames += 1
                    
                    ear_sum += contact_data['ear']
                    alignment_sum += contact_data['alignment']
                    processed_frames += 1
                    
            except Exception as e:
                print(f"Error processing frame: {str(e)}")
                continue
        
        # Calculate metrics
        if processed_frames == 0:
            raise Exception("No faces detected in frames")
        
        eye_contact_ratio = contact_frames / processed_frames
        average_ear = ear_sum / processed_frames
        alignment_score = 1.0 - min(alignment_sum / processed_frames, 1.0)
        
        # Confidence based on number of processed frames
        confidence = min(processed_frames / total_frames, 1.0)
        
        # Generate interpretation
        interpretation = self._generate_interpretation(eye_contact_ratio, average_ear, alignment_score)
        
        return {
            'eyeContactRatio': round(eye_contact_ratio, 3),
            'averageEAR': round(average_ear, 3),
            'alignmentScore': round(alignment_score, 3),
            'totalFrames': total_frames,
            'contactFrames': contact_frames,
            'confidence': round(confidence, 3),
            'interpretation': interpretation
        }
    
    def _generate_interpretation(self, ratio: float, ear: float, alignment: float) -> str:
        """Generate human-readable interpretation"""
        if ratio > 0.7:
            contact_level = "excellent eye contact"
        elif ratio > 0.4:
            contact_level = "moderate eye contact"
        else:
            contact_level = "limited eye contact"
        
        if alignment > 0.8:
            align_text = "with good face alignment toward the screen"
        else:
            align_text = "with some variability in head position"
        
        return f"Child demonstrated {contact_level} during the activity ({int(ratio*100)}% of frames), {align_text}."
