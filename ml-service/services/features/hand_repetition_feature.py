import mediapipe as mp
import numpy as np
from typing import Dict, List, Tuple, Optional


class HandRepetitionFeature:
    """
    Detects repetitive hand movements (stimming) using wrist tracking.
    STRUCTURE PRESERVED – logic aligned with validated testing code.
    """

    def __init__(self):
        self.pose = mp.solutions.pose.Pose(
            static_image_mode=False,
            model_complexity=0,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

        # =============================
        # TIME CONFIG (FROM TESTING)
        # =============================
        self.TIME_WINDOW = 2.0          # seconds
        self.WARM_UP_PERIOD = 2.0
        self.CONFIRM_WINDOWS = 3        # 3 × 2s = 6 seconds (dominance)

        # =============================
        # CLINICAL THRESHOLDS (BALANCED)
        # =============================
        self.MIN_AMPLITUDE = 0.02       # normalized Y-range (reject finger flicks)
        self.MAX_AMPLITUDE = 0.25       # reject waving
        self.MIN_OSCILLATIONS = 6       # direction reversals per window

        # =============================
        # STATE (UNCHANGED)
        # =============================
        self.left_positions: List[Tuple[float, float]] = []
        self.right_positions: List[Tuple[float, float]] = []

        self.session_start_time = None
        self.confirmed_windows = 0
        self.hand_stimming_confirmed = False

    # =====================================================
    # CORE OSCILLATION LOGIC (MATCHES TEST CODE)
    # =====================================================
    def _count_oscillations(self, positions: List[Tuple[float, float]], now: float) -> int:
        window_start = now - self.TIME_WINDOW
        window = [(t, y) for t, y in positions if t >= window_start]

        if len(window) < 8:
            return 0

        ys = np.array([y for _, y in window])

        amplitude = ys.max() - ys.min()
        if amplitude < self.MIN_AMPLITUDE or amplitude > self.MAX_AMPLITUDE:
            return 0

        # Direction reversals (same as testing)
        diffs = np.diff(ys)
        signs = np.sign(diffs)

        oscillations = 0
        for i in range(1, len(signs)):
            if signs[i] * signs[i - 1] < 0:
                oscillations += 1

        return oscillations

    # =====================================================
    # FRAME EXTRACTION (API UNCHANGED)
    # =====================================================
    def extract(self, image: np.ndarray, timestamp: Optional[float] = None) -> Dict:
        if timestamp is None:
            raise ValueError("Timestamp required")

        if self.session_start_time is None:
            self.session_start_time = timestamp

        elapsed = timestamp - self.session_start_time
        if elapsed < self.WARM_UP_PERIOD:
            return {
                "hand_oscillation_detected": False,
                "left_oscillations": 0,
                "right_oscillations": 0,
                "status": "warming_up"
            }

        results = self.pose.process(image)
        if not results.pose_landmarks:
            return {
                "hand_oscillation_detected": False,
                "left_oscillations": 0,
                "right_oscillations": 0,
                "status": "no_pose_detected"
            }

        lm = results.pose_landmarks.landmark
        lw = lm[mp.solutions.pose.PoseLandmark.LEFT_WRIST]
        rw = lm[mp.solutions.pose.PoseLandmark.RIGHT_WRIST]

        # 🔑 TRACK ONLY Y (PROVEN)
        if lw.visibility > 0.5:
            self.left_positions.append((timestamp, lw.y))
        if rw.visibility > 0.5:
            self.right_positions.append((timestamp, rw.y))

        cutoff = timestamp - (self.TIME_WINDOW + 0.5)
        self.left_positions = [(t, y) for t, y in self.left_positions if t >= cutoff]
        self.right_positions = [(t, y) for t, y in self.right_positions if t >= cutoff]

        left_osc = self._count_oscillations(self.left_positions, timestamp)
        right_osc = self._count_oscillations(self.right_positions, timestamp)

        window_detected = max(left_osc, right_osc) >= self.MIN_OSCILLATIONS

        # ✅ SESSION DOMINANCE LOGIC
        if window_detected:
            self.confirmed_windows += 1
        else:
            self.confirmed_windows = max(0, self.confirmed_windows - 1)

        if self.confirmed_windows >= self.CONFIRM_WINDOWS:
            self.hand_stimming_confirmed = True

        return {
            "hand_oscillation_detected": self.hand_stimming_confirmed,
            "left_oscillations": left_osc,
            "right_oscillations": right_osc,
            "status": "tracking"
        }

    # =====================================================
    # SESSION SUMMARY (API REQUIREMENT)
    # =====================================================
    def get_summary(self) -> Dict:
        """
        Returns final session analysis of hand stimming behavior.
        Called by VideoOrchestrator after processing all frames.
        """
        if self.hand_stimming_confirmed:
            return {
                "detected": True,
                "level": "PRESENT",
                "interpretation": "Sustained repetitive hand movements detected"
            }
        else:
            return {
                "detected": False,
                "level": "ABSENT",
                "interpretation": "No repetitive hand movements detected"
            }

    def reset(self):
        """Reset all tracking state for new session"""
        self.left_positions.clear()
        self.right_positions.clear()
        self.session_start_time = None
        self.confirmed_windows = 0
        self.hand_stimming_confirmed = False

    # =====================================================
    #