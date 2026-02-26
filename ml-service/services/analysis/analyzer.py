from typing import Dict

from .eye_contact_detector import EyeContactDetector
from .head_stimming_detector import HeadStimmingDetector
from .hand_stimming_detector import HandStimmingDetector
from .hand_gesture_detector import HandGestureDetector
from .social_reciprocity import assess_social_reciprocity


class VideoAnalyzer:
    def __init__(self):
        pass

    def analyze(self, video_path: str) -> Dict:
        eye_contact = EyeContactDetector().analyze(video_path)
        head_stimming = HeadStimmingDetector().analyze(video_path)
        hand_stimming = HandStimmingDetector().analyze(video_path)
        hand_gesture = HandGestureDetector().analyze(video_path)
        emotion_variation = "Unknown"

        social = assess_social_reciprocity(
            eye_contact_label=eye_contact["label"],
            gesture_present=hand_gesture["present"],
            head_stable=head_stimming["stable"]
        )

        return {
            "eye_contact": eye_contact["label"],
            "head_stimming": "Present" if head_stimming["present"] else "Absent",
            "hand_stimming": "Present" if hand_stimming["present"] else "Absent",
            "hand_gesture": "Present" if hand_gesture["present"] else "Absent",
            "social_reciprocity": social["label"],
            "emotion_variation": emotion_variation
        }
