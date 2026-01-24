"""
Video Feature Orchestrator
Coordinates all 7 behavioral feature extractors
Manages frame processing and session aggregation
"""

import cv2
import numpy as np
import base64
from typing import Dict

from .eye_contact_feature import EyeContactFeature
from .blink_rate_feature import BlinkRateFeature
from .head_movement_feature import HeadMovementFeature
from .head_repetition_feature import HeadRepetitionFeature
from .hand_repetition_feature import HandRepetitionFeature
from .gesture_detection_feature import GestureDetectionFeature
from .expression_variability_feature import ExpressionVariabilityFeature


class VideoFeatureOrchestrator:
    """
    Orchestrates all 7 behavioral feature extractors.
    Processes frames through each extractor and aggregates results.
    """
    
    def __init__(self):
        # Initialize all feature extractors
        self.eye_contact = EyeContactFeature()
        self.blink_rate = BlinkRateFeature()
        self.head_movement = HeadMovementFeature()
        self.head_repetition = HeadRepetitionFeature()
        self.hand_repetition = HandRepetitionFeature()
        self.gesture_detection = GestureDetectionFeature()
        self.expression_variability = ExpressionVariabilityFeature()
        
        # Session tracking
        self.frame_count = 0
        self.session_start_time = None
    
    def decode_frame(self, base64_str: str) -> np.ndarray:
        """Decode base64 string to image array"""
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        
        img_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    def _convert_numpy_types(self, obj):
        """
        Recursively convert numpy types to native Python types for JSON serialization.
        """
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
            return float(obj)
        elif isinstance(obj, (np.bool_, bool)):
            return bool(obj)
        elif isinstance(obj, dict):
            return {key: self._convert_numpy_types(value) for key, value in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [self._convert_numpy_types(item) for item in obj]
        else:
            return obj
    
    def process_frame(self, base64_frame: str) -> Dict:
        """
        Process single frame through all feature extractors.
        
        Returns:
            Dictionary with results from all extractors
        """
        self.frame_count += 1
        
        try:
            image = self.decode_frame(base64_frame)
        except Exception as e:
            return {'error': f'Failed to decode frame: {str(e)}'}
        
        # Extract features from all modules
        results = {
            'frame_number': self.frame_count,
            'eye_contact': self.eye_contact.extract(image),
            'blink': self.blink_rate.extract(image),
            'head_pose': self.head_movement.extract(image),
            'hand_movement': self.hand_repetition.extract(image),
            'gesture': self.gesture_detection.extract(image),
            'facial_expression': self.expression_variability.extract(image)
        }
        
        # Add head position to repetition analyzer
        if results['head_pose']['detected']:
            position = np.array(results['head_pose']['position'])
            self.head_repetition.add_position(position)
        
        # Calculate periodic metrics (every 10 frames)
        if self.frame_count % 10 == 0:
            results['head_oscillation'] = self.head_repetition.extract_from_window()
            results['hand_oscillation_left'] = self.hand_repetition.detect_hand_oscillation('left')
            results['hand_oscillation_right'] = self.hand_repetition.detect_hand_oscillation('right')
            results['expression_variability'] = self.expression_variability.calculate_variability()
        
        # Convert numpy types to native Python types for JSON serialization
        results = self._convert_numpy_types(results)
        
        return results
    
    def get_session_summary(self, session_duration_seconds: float) -> Dict:
        """
        Aggregate all features over entire session.
        
        Returns:
            Comprehensive behavioral profile with all 7 features
        """
        # Get summaries from each extractor
        eye_contact_summary = self.eye_contact.get_summary()
        blink_summary = self.blink_rate.get_summary(session_duration_seconds)
        head_movement_summary = self.head_movement.get_summary()
        head_repetition_summary = self.head_repetition.get_summary()
        hand_repetition_summary = self.hand_repetition.get_summary()
        gesture_summary = self.gesture_detection.get_summary(session_duration_seconds)
        expression_summary = self.expression_variability.get_summary()
        
        # Compile complete feature set
        features = {
            'eye_contact_ratio': eye_contact_summary['eye_contact_ratio'],
            'blink_rate_per_minute': blink_summary['blink_rate_per_minute'],
            'head_movement_rate': head_movement_summary['head_movement_rate'],
            'head_repetitive_movement': {
                'detected': head_repetition_summary['detected'],
                'oscillations': head_repetition_summary['oscillations'],
                'horizontal': head_repetition_summary['horizontal'],
                'vertical': head_repetition_summary['vertical']
            },
            'hand_repetitive_movement': hand_repetition_summary,
            'gesture_frequency_per_minute': gesture_summary['gesture_frequency_per_minute'],
            'facial_expression_variability': expression_summary['facial_expression_variability']
        }
        
        # Generate interpretation
        interpretation = self._generate_interpretation(features)
        
        summary = {
            'session_duration_seconds': session_duration_seconds,
            'total_frames_processed': self.frame_count,
            'features': features,
            'interpretation': interpretation
        }
        
        # Convert numpy types to native Python types
        return self._convert_numpy_types(summary)
    
    def _generate_interpretation(self, metrics: Dict) -> Dict:
        """Generate clinical interpretation from features"""
        concerns = []
        
        # Eye contact assessment
        eye_contact_ratio = metrics['eye_contact_ratio']
        if eye_contact_ratio < 0.30:
            concerns.append('Significantly reduced eye contact')
        elif eye_contact_ratio < 0.50:
            concerns.append('Below average eye contact')
        
        # Repetitive behaviors
        head_osc = metrics['head_repetitive_movement']['oscillations']
        if head_osc > 5:
            concerns.append('Repetitive head movements detected')
        
        hand_osc = max(
            metrics['hand_repetitive_movement']['left_hand']['oscillations'],
            metrics['hand_repetitive_movement']['right_hand']['oscillations']
        )
        if hand_osc > 5:
            concerns.append('Repetitive hand movements (stimming) detected')
        
        # Social gestures
        gesture_freq = metrics['gesture_frequency_per_minute']
        if gesture_freq < 1.0:
            concerns.append('Limited social gesturing')
        
        # Expression variability
        expr_var = metrics['facial_expression_variability']
        if expr_var < 0.01:
            concerns.append('Restricted facial expressions')
        
        # Calculate risk score
        risk_score = len(concerns) / 7  # Normalized 0-1
        
        if risk_score >= 0.5:
            risk_level = "High"
        elif risk_score >= 0.3:
            risk_level = "Moderate"
        else:
            risk_level = "Low"
        
        return {
            'concerns': concerns,
            'risk_score': round(risk_score, 3),
            'risk_level': risk_level,
            'summary': f"{len(concerns)} behavioral concerns identified" if concerns else "No significant concerns detected"
        }
    
    def reset(self):
        """Reset all extractors for new session"""
        self.eye_contact.reset()
        self.blink_rate.reset()
        self.head_movement.reset()
        self.head_repetition.reset()
        self.hand_repetition.reset()
        self.gesture_detection.reset()
        self.expression_variability.reset()
        self.frame_count = 0
        self.session_start_time = None
