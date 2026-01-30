"""
Gesture Frequency Feature Extractor (Backend Safe)
Uses MediaPipe Hands + movement-based logic with cooldowns
Detects intentional hand gestures (time-normalized)
"""

import time
import numpy as np
import mediapipe as mp
from typing import Dict, List


class GestureDetectionFeature:
    """
    Detects intentional hand gesture presence.
    Uses movement-based logic with cooldown and persistence.
    Time-aware processing to prevent flicker and false triggers.
    """

    def __init__(self):
        # ===============================
        # MEDIAPIPE HANDS
        # ===============================
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )

        # ===============================
        # THRESHOLDS (CALIBRATED)
        # Why these values:
        # - MOVE_THRESHOLD: 0.03 (3% of frame) = intentional social gestures
        # - GLITCH_LIMIT: 0.15 (15%) = ignore tracking jumps/glitches
        # - COOLDOWN_TIME: 0.7s = minimum time between distinct gestures
        # - PERSISTENCE: 0.20s = gesture must persist to count as intentional
        # ===============================
        self.MOVE_THRESHOLD = 0.03  # normalized (3% of frame) - require clear movement
        self.GLITCH_LIMIT = 0.15  # ignore large tracking jumps
        self.COOLDOWN_TIME = 0.7  # seconds between gestures
        self.PERSISTENCE_TIME = 0.20  # minimum gesture duration - filter out noise

        # ===============================
        # TIME-AWARE STATE
        # ===============================
        self.prev_pos = None
        self.prev_timestamp = None
        self.gesture_start_time = None
        self.last_trigger_time = 0.0
        self.gesture_timestamps: List[float] = []
        
        self.session_start_time = None
        self.warmup_duration = 2.0
        self.total_frames = 0

    # ==================================================
    # FRAME EXTRACTION (TIME-AWARE WITH PERSISTENCE)
    # ==================================================
    def extract(self, image: np.ndarray, timestamp: float = None) -> Dict:
        """
        Process one frame and detect gesture presence with persistence check.
        
        Requires:
        - Significant movement (> threshold)
        - No tracking glitches
        - Cooldown between gestures
        - Persistence (gesture must last ≥ 150ms)
        """
        # FIXED: Single source of time - only use passed timestamp
        if timestamp is None:
            raise ValueError("Timestamp required")
        current_time = timestamp
        
        if self.session_start_time is None:
            self.session_start_time = current_time
        
        self.total_frames += 1
        elapsed = current_time - self.session_start_time

        results = self.hands.process(image)

        gesture_detected = False

        if results.multi_hand_landmarks:
            hand_landmarks = results.multi_hand_landmarks[0].landmark

            # Use palm center (landmark 9) for stability
            x = hand_landmarks[9].x
            y = hand_landmarks[9].y
            current_pos = np.array([x, y])

            if self.prev_pos is not None and self.prev_timestamp is not None:
                # Calculate normalized movement
                movement = np.linalg.norm(current_pos - self.prev_pos)

                # Ignore tracking glitches (sudden large jumps)
                if movement < self.GLITCH_LIMIT:

                    # Check for significant movement
                    if movement > self.MOVE_THRESHOLD:
                        
                        # Start tracking gesture
                        if self.gesture_start_time is None:
                            self.gesture_start_time = current_time
                        
                        # Check persistence (gesture must last ≥ 150ms)
                        gesture_duration = current_time - self.gesture_start_time
                        
                        if gesture_duration >= self.PERSISTENCE_TIME:
                            # Check cooldown (prevent double-counting)
                            if elapsed >= self.warmup_duration and \
                               current_time - self.last_trigger_time > self.COOLDOWN_TIME:
                                gesture_detected = True
                                self.last_trigger_time = current_time
                                self.gesture_timestamps.append(current_time)
                                self.gesture_start_time = None  # Reset for next gesture
                    else:
                        # Movement too small - reset gesture tracking
                        self.gesture_start_time = None

            self.prev_pos = current_pos
            self.prev_timestamp = current_time

        else:
            # No hand detected
            self.prev_pos = None
            self.prev_timestamp = None
            self.gesture_start_time = None

        return {
            "detected": gesture_detected,
            "gesture_present": gesture_detected,
            "warmup": elapsed < self.warmup_duration
        }

    # ==================================================
    # SUMMARY (TIME-NORMALIZED)
    # ==================================================
    def get_summary(self, session_duration_seconds: float) -> Dict:
        """
        Compute gesture frequency per minute (time-normalized).
        
        Clinical interpretation:
        - Normal: 2-10 gestures/min (typical social interaction)
        - Low: < 2 gestures/min (reduced social gesturing - autism marker)
        - High: > 10 gestures/min (hyperactive gesturing)
        """
        if session_duration_seconds <= 0:
            return {
                "gesture_frequency_per_minute": 0.0,
                "level": "insufficient_data",
                "interpretation": "Invalid session duration",
                "total_gestures": 0,
                "total_frames": self.total_frames
            }

        # Calculate effective duration (excluding warm-up)
        effective_duration = session_duration_seconds - self.warmup_duration
        if effective_duration <= 0:
            return {
                "gesture_frequency_per_minute": 0.0,
                "level": "insufficient_data",
                "interpretation": "Session too short",
                "total_gestures": 0,
                "total_frames": self.total_frames
            }

        total_gestures = len(self.gesture_timestamps)
        frequency = (total_gestures / effective_duration) * 60
        
        # Safety clamp: Maximum realistic gesture frequency is ~30/min
        frequency = min(frequency, 30.0)

        # Clinical interpretation
        if frequency < 1.5:
            level = "low"
            interpretation = "Limited social gesturing (potential autism indicator)"
        elif frequency <= 10:
            level = "normal"
            interpretation = "Normal gesture frequency"
        else:
            level = "high"
            interpretation = "Frequent gesturing"

        return {
            "gesture_frequency_per_minute": round(frequency, 2),
            "level": level,
            "interpretation": interpretation,
            "total_gestures": total_gestures,
            "effective_duration_seconds": round(effective_duration, 1),
            "total_frames": self.total_frames
        }

    # ==================================================
    # RESET
    # ==================================================
    def reset(self):
        """Reset state for new session"""
        self.prev_pos = None
        self.prev_timestamp = None
        self.gesture_start_time = None
        self.last_trigger_time = 0.0
        self.gesture_timestamps = []
        self.session_start_time = None
        self.total_frames = 0