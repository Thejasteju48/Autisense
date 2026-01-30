import mediapipe as mp
import numpy as np
from typing import Dict


class BlinkRateFeature:
    def __init__(self):
        # =============================
        # MEDIAPIPE FACE MESH
        # =============================
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6
        )

        # =============================
        # EYE LANDMARKS
        # =============================
        self.LEFT_EYE_EAR = [33, 160, 158, 133, 153, 144]
        self.RIGHT_EYE_EAR = [263, 387, 385, 362, 380, 373]

        # =============================
        # CLINICALLY STABLE BLINK THRESHOLDS
        # =============================
        self.EYE_CLOSED_EAR = 0.16
        self.EYE_OPEN_EAR = 0.21

        # Time-based blink definition (FIX)
        self.MIN_BLINK_DURATION = 0.06   # 60 ms
        self.MAX_BLINK_DURATION = 0.40   # 400 ms

        # =============================
        # TIME / STATE
        # =============================
        self.session_start_time = None
        self.warmup_duration = 2.0

        self.eye_closed = False
        self.blink_start_time = None

        self.blink_timestamps = []
        self.face_detected_frames = 0
        self.total_frames = 0

    # ==================================================
    # EAR CALCULATION
    # ==================================================
    def _ear(self, landmarks, indices, w, h) -> float:
        pts = np.array([[landmarks[i].x * w, landmarks[i].y * h] for i in indices])
        p1, p2, p3, p4, p5, p6 = pts

        v1 = np.linalg.norm(p2 - p6)
        v2 = np.linalg.norm(p3 - p5)
        h1 = np.linalg.norm(p1 - p4)

        if h1 < 1e-6:
            return 0.0

        return (v1 + v2) / (2.0 * h1)

    # ==================================================
    # FRAME-LEVEL EXTRACTION (TRACKING ONLY)
    # ==================================================
    def extract(self, frame: np.ndarray, timestamp: float) -> Dict:
        """
        Tracks blink internally.
        DOES NOT expose per-frame blink events.
        """

        if timestamp is None:
            raise ValueError("Timestamp required")

        if self.session_start_time is None:
            self.session_start_time = timestamp

        self.total_frames += 1
        elapsed = timestamp - self.session_start_time

        h, w = frame.shape[:2]
        rgb = frame[:, :, ::-1]

        result = self.face_mesh.process(rgb)

        if not result.multi_face_landmarks:
            return {
                "detected": False,
                "warmup": elapsed < self.warmup_duration
            }

        self.face_detected_frames += 1
        lm = result.multi_face_landmarks[0].landmark

        left_ear = self._ear(lm, self.LEFT_EYE_EAR, w, h)
        right_ear = self._ear(lm, self.RIGHT_EYE_EAR, w, h)
        avg_ear = (left_ear + right_ear) / 2.0

        # ---------- WARM-UP ----------
        if elapsed < self.warmup_duration:
            return {
                "detected": True,
                "warmup": True
            }

        # ---------- BLINK STATE MACHINE (TIME-BASED) ----------
        if avg_ear < self.EYE_CLOSED_EAR:
            if not self.eye_closed:
                self.eye_closed = True
                self.blink_start_time = timestamp

        elif self.eye_closed and avg_ear > self.EYE_OPEN_EAR:
            if self.blink_start_time is not None:
                duration = timestamp - self.blink_start_time

                if self.MIN_BLINK_DURATION <= duration <= self.MAX_BLINK_DURATION:
                    self.blink_timestamps.append(timestamp)

            self.eye_closed = False
            self.blink_start_time = None

        return {
            "detected": True,
            "warmup": False
        }

    # ==================================================
    # SESSION SUMMARY (ONLY PLACE BLINK RATE IS REPORTED)
    # ==================================================
    def get_summary(self, session_duration_seconds: float) -> Dict:
        if session_duration_seconds <= self.warmup_duration:
            return {
                "blink_rate_per_minute": 0.0,
                "level": "insufficient_data",
                "interpretation": "Session too short",
                "total_blinks": 0,
                "data_quality": "too_short"
            }

        effective_duration = session_duration_seconds - self.warmup_duration
        face_ratio = self.face_detected_frames / max(self.total_frames, 1)

        if face_ratio < 0.5:
            return {
                "blink_rate_per_minute": 0.0,
                "level": "insufficient_data",
                "interpretation": "Face not consistently detected",
                "total_blinks": len(self.blink_timestamps),
                "data_quality": "poor_face_tracking"
            }

        total_blinks = len(self.blink_timestamps)
        blink_rate = (total_blinks / effective_duration) * 60
        blink_rate = float(np.clip(blink_rate, 0.0, 60.0))

        if blink_rate < 5:
            level = "low"
            interpretation = "Reduced spontaneous blinking"
        elif blink_rate <= 25:
            level = "normal"
            interpretation = "Normal blink rate"
        else:
            level = "high"
            interpretation = "Elevated blink rate"

        return {
            "blink_rate_per_minute": round(blink_rate, 2),
            "level": level,
            "interpretation": interpretation,
            "total_blinks": total_blinks,
            "effective_duration_seconds": round(effective_duration, 1),
            "face_detection_ratio": round(face_ratio, 3),
            "data_quality": "good"
        }

    # ==================================================
    # RESET
    # ==================================================
    def reset(self):
        self.session_start_time = None
        self.eye_closed = False
        self.blink_start_time = None
        self.blink_timestamps.clear()
        self.face_detected_frames = 0
        self.total_frames = 0