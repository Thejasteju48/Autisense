"""
Video Feature Orchestrator
Coordinates all behavioral feature extractors
TIME-AWARE processing with proper timestamp propagation
OUTPUT NORMALIZED (STEP 2 FIX)
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
    Orchestrates all behavioral feature extractors.
    ONLY output formatting is handled here.
    NO logic duplication.
    """

    def __init__(self):
        self.eye_contact = EyeContactFeature()
        self.blink_rate = BlinkRateFeature()
        self.head_movement = HeadMovementFeature()
        self.head_repetition = HeadRepetitionFeature()
        self.hand_repetition = HandRepetitionFeature()
        self.gesture_detection = GestureDetectionFeature()
        self.expression_variability = ExpressionVariabilityFeature()

        self.frame_count = 0
        self.session_start_time = None

    # =====================================================
    # FRAME DECODING
    # =====================================================
    def decode_frame(self, base64_str: str) -> np.ndarray:
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        img_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    def _convert_numpy(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, (np.int32, np.int64)):
            return int(obj)
        if isinstance(obj, (np.float32, np.float64)):
            return float(obj)
        if isinstance(obj, dict):
            return {k: self._convert_numpy(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [self._convert_numpy(v) for v in obj]
        return obj

    # =====================================================
    # FRAME PROCESSING
    # =====================================================
    def process_frame(self, base64_frame: str, timestamp: float) -> Dict:
        if timestamp is None:
            raise ValueError("Timestamp required")

        if self.session_start_time is None:
            self.session_start_time = timestamp

        self.frame_count += 1
        image = self.decode_frame(base64_frame)

        results = {
            "timestamp": timestamp,
            "elapsed_time": timestamp - self.session_start_time,
            "frame_number": self.frame_count
        }

        results["eye_contact"] = self.eye_contact.extract(image, timestamp)
        results["blink"] = self.blink_rate.extract(image, timestamp)
        results["head_pose"] = self.head_movement.extract(image, timestamp)
        results["hand_repetition"] = self.hand_repetition.extract(image, timestamp)
        results["gesture"] = self.gesture_detection.extract(image, timestamp)
        results["facial_expression"] = self.expression_variability.extract(image, timestamp)

        if results["head_pose"].get("detected"):
            position = np.array(results["head_pose"]["position"])
            self.head_repetition.add_position(position, timestamp)

        return self._convert_numpy(results)

    # =====================================================
    # SESSION SUMMARY (STEP 2 – NORMALIZED OUTPUT)
    # =====================================================
    def get_session_summary(self, session_duration_seconds: float) -> Dict:
        eye = self.eye_contact.get_summary()
        blink = self.blink_rate.get_summary(session_duration_seconds)
        head_move = self.head_movement.get_summary(session_duration_seconds)
        head_rep = self.head_repetition.get_summary()
        hand_rep = self.hand_repetition.get_summary()
        gesture = self.gesture_detection.get_summary(session_duration_seconds)
        expr = self.expression_variability.get_summary()

        # Backend-compatible format (flat keys matching screeningController.js expectations)
        summary = {
            # Feature 1: Eye Contact
            "eye_contact_ratio": eye.get("eye_contact_ratio", 0.0),
            "eye_contact_level": eye.get("level", "unknown"),
            "eye_contact_interpretation": eye.get("interpretation", ""),
            
            # Feature 2: Blink Rate
            "blink_rate_per_minute": blink.get("blink_rate_per_minute", 0.0),
            "blink_level": blink.get("level", "unknown"),
            "blink_interpretation": blink.get("interpretation", ""),
            
            # Feature 3: Head Movement Rate
            "head_movement_avg_per_frame": head_move.get("avg_movement_per_frame", 0.0),
            "head_movement_rate": head_move.get("avg_movement_per_frame", 0.0),
            "head_movement_level": head_move.get("level", "unknown"),
            "head_movement_interpretation": head_move.get("interpretation", ""),
            
            # Feature 4: Head Repetitive Movements
            "head_movements": {
                "present": head_rep.get("detected", False),
                "repetitive": head_rep.get("detected", False),
                "description": "Repetitive head movements detected" if head_rep.get("detected", False) else "No repetitive head movements"
            },
            
            # Feature 5: Hand Stimming
            "hand_stimming": {
                "present": hand_rep.get("detected", False),
                "severity": "PRESENT" if hand_rep.get("detected", False) else "ABSENT",
                "description": hand_rep.get("interpretation", "No repetitive hand movements detected")
            },
            
            # Feature 6: Social Gestures
            "social_gestures": {
                "present": len(self.gesture_detection.gesture_timestamps) > 0,
                "frequency_per_minute": gesture.get("gesture_frequency_per_minute", 0.0),
                "description": gesture.get("interpretation", "No social gestures detected")
            },
            
            # Feature 7: Facial Expression Variability
            "facial_expression_variability": expr.get("variability", 0.0),
            "expression_level": expr.get("level", "unknown"),
            "expression_interpretation": expr.get("interpretation", ""),
            
            # Session metadata
            "sessionDuration": session_duration_seconds,
            "totalFrames": self.frame_count,
            
            # Data quality
            "data_quality": {
                "face_detection_ratio": eye.get("face_detection_ratio", 0.0),
                "expression_detection_rate": expr.get("detection_rate", 0.0)
            }
        }

        # Add clinical interpretation
        summary["clinical_interpretation"] = self._clinical_summary_from_flat(summary)
        return self._convert_numpy(summary)

    # =====================================================
    # CLINICAL INTERPRETATION (CLEAN & DETERMINISTIC)
    # =====================================================
    def _clinical_summary_from_flat(self, s: Dict) -> Dict:
        """Generate clinical interpretation from flat summary structure"""
        concerns = []

        if s.get("eye_contact_level") in ["very_low", "low"]:
            concerns.append("Reduced eye contact")

        if s.get("blink_level") == "low":
            concerns.append("Reduced blink rate")

        if s.get("expression_level") == "low":
            concerns.append("Restricted facial expressions")

        if s.get("hand_stimming", {}).get("present", False):
            concerns.append("Hand stimming detected")

        if s.get("head_movements", {}).get("repetitive", False):
            concerns.append("Head stimming detected")

        if not s.get("social_gestures", {}).get("present", False):
            concerns.append("Limited social gestures")

        risk_score = min(len(concerns) / 5.0, 1.0)

        if risk_score >= 0.6:
            risk = "High"
        elif risk_score >= 0.4:
            risk = "Moderate"
        else:
            risk = "Low"

        return {
            "risk_level": risk,
            "risk_score": round(risk_score, 3),
            "concerns": concerns,
            "summary": f"{len(concerns)} behavioral concern(s) detected"
        }

    # =====================================================
    # RESET
    # =====================================================
    def reset(self):
        self.eye_contact.reset()
        self.blink_rate.reset()
        self.head_movement.reset()
        self.head_repetition.reset()
        self.hand_repetition.reset()
        self.gesture_detection.reset()
        self.expression_variability.reset()
        self.frame_count = 0
        self.session_start_time = None