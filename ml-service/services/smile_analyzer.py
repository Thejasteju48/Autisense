import cv2
import numpy as np
import mediapipe as mp
import base64
from typing import List, Dict

class SmileAnalyzer:
    """
    Analyzes smiling during 'Make the Character Happy' game.
    Uses mouth landmark geometry to detect smiles.
    """
    
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Mouth landmarks indices
        self.MOUTH_LEFT = 61
        self.MOUTH_RIGHT = 291
        self.MOUTH_TOP = 13
        self.MOUTH_BOTTOM = 14
        self.UPPER_LIP_TOP = 0
        self.LOWER_LIP_BOTTOM = 17
        
        # Mouth outline landmarks for more accurate detection
        self.MOUTH_OUTLINE = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291,
                               146, 91, 181, 84, 17, 314, 405, 321, 375, 291]
        
        self.prev_smile_state = False
        self.smile_transition_count = 0
        
    def decode_frame(self, base64_str: str) -> np.ndarray:
        """Decode base64 string to image array"""
        img_bytes = base64.b64decode(base64_str.split(',')[1] if ',' in base64_str else base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    def calculate_mouth_aspect_ratio(self, landmarks) -> float:
        """
        Calculate Mouth Aspect Ratio (MAR).
        Higher MAR indicates wider mouth (smile).
        """
        # Get mouth corner and center points
        left = np.array([landmarks[self.MOUTH_LEFT].x, landmarks[self.MOUTH_LEFT].y])
        right = np.array([landmarks[self.MOUTH_RIGHT].x, landmarks[self.MOUTH_RIGHT].y])
        top = np.array([landmarks[self.MOUTH_TOP].x, landmarks[self.MOUTH_TOP].y])
        bottom = np.array([landmarks[self.MOUTH_BOTTOM].x, landmarks[self.MOUTH_BOTTOM].y])
        
        # Calculate distances
        horizontal = np.linalg.norm(right - left)
        vertical = np.linalg.norm(bottom - top)
        
        # MAR = width / height (smiles have higher ratio)
        mar = horizontal / vertical if vertical > 0 else 0
        
        return mar
    
    def calculate_mouth_curvature(self, landmarks) -> float:
        """
        Calculate upward curvature of mouth corners.
        Positive curvature indicates smile.
        """
        left_corner = landmarks[self.MOUTH_LEFT]
        right_corner = landmarks[self.MOUTH_RIGHT]
        mouth_center = landmarks[self.MOUTH_TOP]
        
        # Get y-coordinates (lower y = higher on face)
        left_y = left_corner.y
        right_y = right_corner.y
        center_y = mouth_center.y
        
        # Average corner height relative to center
        corner_avg_y = (left_y + right_y) / 2
        
        # Positive value means corners are higher than center (smile)
        curvature = center_y - corner_avg_y
        
        return curvature
    
    def detect_smile(self, landmarks) -> Dict[str, float]:
        """
        Detect smile using multiple geometric features.
        """
        mar = self.calculate_mouth_aspect_ratio(landmarks)
        curvature = self.calculate_mouth_curvature(landmarks)
        
        # Smile thresholds
        MAR_THRESHOLD = 3.0  # Mouth is wide
        CURVATURE_THRESHOLD = 0.01  # Mouth corners are raised
        
        is_smiling = mar > MAR_THRESHOLD and curvature > CURVATURE_THRESHOLD
        
        return {
            'is_smiling': is_smiling,
            'mar': mar,
            'curvature': curvature
        }
    
    def analyze(self, frames: List[str], duration: float) -> Dict:
        """
        Analyze smiling from frames captured during interaction.
        
        Returns:
            Dictionary with smile metrics and interpretation
        """
        total_frames = len(frames)
        smile_frames = 0
        smile_frequency = 0
        mar_sum = 0
        processed_frames = 0
        prev_smile = False
        
        for frame_b64 in frames:
            try:
                # Decode frame
                frame = self.decode_frame(frame_b64)
                
                # Process with MediaPipe
                results = self.face_mesh.process(frame)
                
                if results.multi_face_landmarks:
                    landmarks = results.multi_face_landmarks[0].landmark
                    
                    # Detect smile
                    smile_data = self.detect_smile(landmarks)
                    
                    if smile_data['is_smiling']:
                        smile_frames += 1
                        
                        # Count distinct smiles (state transitions)
                        if not prev_smile:
                            smile_frequency += 1
                        prev_smile = True
                    else:
                        prev_smile = False
                    
                    mar_sum += smile_data['mar']
                    processed_frames += 1
                    
            except Exception as e:
                print(f"Error processing frame: {str(e)}")
                continue
        
        # Calculate metrics
        if processed_frames == 0:
            raise Exception("No faces detected in frames")
        
        smile_ratio = smile_frames / processed_frames
        average_mar = mar_sum / processed_frames
        
        # Confidence based on face detection
        confidence = min(processed_frames / total_frames, 1.0)
        
        # Generate interpretation
        interpretation = self._generate_interpretation(smile_ratio, smile_frequency)
        
        return {
            'smileRatio': round(smile_ratio, 3),
            'smileFrequency': smile_frequency,
            'mouthAspectRatio': round(average_mar, 3),
            'totalFrames': total_frames,
            'smileFrames': smile_frames,
            'confidence': round(confidence, 3),
            'interpretation': interpretation
        }
    
    def _generate_interpretation(self, ratio: float, frequency: int) -> str:
        """Generate human-readable interpretation"""
        if ratio > 0.6:
            smile_level = "frequent and sustained smiling"
        elif ratio > 0.3:
            smile_level = "moderate smiling"
        else:
            smile_level = "limited smiling"
        
        if frequency >= 5:
            freq_text = f"with {frequency} distinct smile events"
        elif frequency >= 2:
            freq_text = f"with {frequency} smile events"
        else:
            freq_text = "with minimal smile responses"
        
        return f"Child demonstrated {smile_level} ({int(ratio*100)}% of frames) {freq_text} during the activity."
