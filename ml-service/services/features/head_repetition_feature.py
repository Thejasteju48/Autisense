import numpy as np
from typing import Dict, List, Tuple, Optional


class HeadRepetitionFeature:
    """
    Extracts head repetitive movement behavioral marker.
    STRUCTURE PRESERVED – logic corrected using duration-based detection.
    Detects sustained rhythmic head oscillations only.
    """

    def __init__(self):
        # =============================
        # TIME / WINDOW CONFIG
        # =============================
        self.TIME_WINDOW = 2.0          # seconds
        self.WARM_UP_PERIOD = 2.0       # seconds

        # Minimum total rhythmic time required
        self.MIN_TOTAL_TIME = 3.0       # seconds (clinical - more sensitive)

        # =============================
        # CLINICAL THRESHOLDS (BALANCED)
        # =============================
        self.MIN_AMPLITUDE = 0.02       # normalized
        self.MIN_SPEED = 0.001
        self.MAX_DRIFT_RATIO = 0.65     # key fix
        self.MIN_OSCILLATIONS = 5       # per window

        # =============================
        # STATE
        # =============================
        self.head_positions: List[Tuple[float, np.ndarray]] = []
        self.session_start_time = None

        self.accumulated_stimming_time = 0.0
        self.head_stimming_confirmed = False

    # =====================================================
    # CORE OSCILLATION LOGIC (UNCHANGED SIGNATURE)
    # =====================================================
    def _count_oscillations(self, values: np.ndarray) -> int:
        oscillations = 0
        prev_dir = 0

        for i in range(1, len(values)):
            d = values[i] - values[i - 1]

            if abs(d) < self.MIN_SPEED:
                continue

            curr_dir = 1 if d > 0 else -1
            if prev_dir != 0 and curr_dir != prev_dir:
                oscillations += 1

            prev_dir = curr_dir

        return oscillations

    # =====================================================
    # ADD POSITION (UNCHANGED API)
    # =====================================================
    def add_position(self, position: np.ndarray, timestamp: Optional[float] = None):
        if timestamp is None:
            raise ValueError("Timestamp required")

        if self.session_start_time is None:
            self.session_start_time = timestamp

        elapsed = timestamp - self.session_start_time
        if elapsed < self.WARM_UP_PERIOD:
            return

        self.head_positions.append((timestamp, position))

        cutoff = timestamp - (self.TIME_WINDOW + 0.5)
        self.head_positions = [
            (t, p) for t, p in self.head_positions if t >= cutoff
        ]

    # =====================================================
    # OSCILLATION DETECTION (UNCHANGED API)
    # =====================================================
    def detect_oscillation(self, axis: int) -> Dict:
        if len(self.head_positions) < 6:
            return {"oscillations": 0, "range": 0.0}

        values = np.array([p[axis] for _, p in self.head_positions])

        amplitude = values.max() - values.min()
        if amplitude < self.MIN_AMPLITUDE:
            return {"oscillations": 0, "range": float(amplitude)}

        oscillations = self._count_oscillations(values)

        # Drift normalization (KEY FIX)
        travel = abs(values[-1] - values[0])
        drift_ratio = travel / max(amplitude, 1e-6)

        if drift_ratio > self.MAX_DRIFT_RATIO:
            return {"oscillations": 0, "range": float(amplitude)}

        return {
            "oscillations": oscillations,
            "range": float(amplitude)
        }

    # =====================================================
    # WINDOW ANALYSIS (UNCHANGED API)
    # =====================================================
    def extract_from_window(self) -> Dict:
        if len(self.head_positions) < 6:
            return {
                "detected": False,
                "horizontal_oscillations": 0,
                "vertical_oscillations": 0,
                "total_oscillations": 0,
                "level": "normal"
            }

        h = self.detect_oscillation(axis=0)
        v = self.detect_oscillation(axis=1)

        total = max(h["oscillations"], v["oscillations"])

        window_valid = total >= self.MIN_OSCILLATIONS

        # ✅ Duration-based accumulation (FIX)
        if window_valid:
            self.accumulated_stimming_time += self.TIME_WINDOW

        if self.accumulated_stimming_time >= self.MIN_TOTAL_TIME:
            self.head_stimming_confirmed = True

        # Informational level only
        if total >= 10:
            level = "high"
        elif total >= 7:
            level = "moderate"
        elif total >= 5:
            level = "low"
        else:
            level = "normal"

        return {
            "detected": self.head_stimming_confirmed,
            "horizontal_oscillations": h["oscillations"],
            "vertical_oscillations": v["oscillations"],
            "total_oscillations": total,
            "level": level
        }

    # =====================================================
    # FINAL SUMMARY (UNCHANGED API)
    # =====================================================
    def get_summary(self) -> Dict:
        if self.head_stimming_confirmed:
            return {
                "detected": True,
                "level": "PRESENT",
                "interpretation": "Sustained repetitive head movement detected"
            }
        else:
            return {
                "detected": False,
                "level": "ABSENT",
                "interpretation": "No repetitive head movements detected"
            }

    def reset(self):
        self.head_positions.clear()
        self.session_start_time = None
        self.accumulated_stimming_time = 0.0
        self.head_stimming_confirmed = False