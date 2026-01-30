"""
Eye Contact Ratio ML Service
Backend-safe, time-aware feature extractor
INTERNAL ratios preserved
OUTPUT NORMALIZED: only LOW / MODERATE / HIGH in summary
"""

import mediapipe as mp
import numpy as np
from typing import Dict, List, Tuple
from collections import deque


class EyeContactFeature:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6
        )

        # -----------------------------
        # LANDMARK INDICES
        # -----------------------------
        self.LEFT_EYE_EAR = [33, 160, 158, 133, 153, 144]
        self.RIGHT_EYE_EAR = [263, 387, 385, 362, 380, 373]

        self.RIGHT_EYE_OUTER = 33
        self.RIGHT_EYE_INNER = 133
        self.LEFT_EYE_OUTER = 362
        self.LEFT_EYE_INNER = 263

        self.RIGHT_IRIS = [469, 470, 471, 472]
        self.LEFT_IRIS = [474, 475, 476, 477]

        self.NOSE_CENTER = 1

        # -----------------------------
        # CLINICAL THRESHOLDS
        # -----------------------------
        self.EYE_OPEN_THRESHOLD = 0.20
        self.NOSE_CENTER_THRESHOLD = 0.35
        self.GAZE_CENTER_THRESHOLD = 0.15

        # -----------------------------
        # TIME / DURATION SETTINGS
        # -----------------------------
        self.warmup_duration = 2.0
        self.MIN_EYE_CONTACT_DURATION = 1.0  # 🔥 key fix (seconds)

        # -----------------------------
        # STATE
        # -----------------------------
        self.session_start_time = None
        self.total_frames = 0
        self.face_detected_count = 0

        # Track continuous eye contact segments
        self.current_contact_start = None
        self.eye_contact_segments: List[Tuple[float, float]] = []

    # =====================================================
    # UTILS
    # =====================================================
    def _ear(self, landmarks, indices, w, h) -> float:
        pts = np.array([[landmarks[i].x * w, landmarks[i].y * h] for i in indices])
        p1, p2, p3, p4, p5, p6 = pts

        v1 = np.linalg.norm(p2 - p6)
        v2 = np.linalg.norm(p3 - p5)
        h1 = np.linalg.norm(p1 - p4)

        if h1 < 1e-3:
            return 0.0

        return (v1 + v2) / (2.0 * h1)

    def _gaze_ratio(self, landmarks, outer, inner, iris, w, h) -> float:
        p_outer = np.array([landmarks[outer].x * w, landmarks[outer].y * h])
        p_inner = np.array([landmarks[inner].x * w, landmarks[inner].y * h])

        iris_pts = np.array([[landmarks[i].x * w, landmarks[i].y * h] for i in iris])
        iris_center = iris_pts.mean(axis=0)

        eye_width = np.linalg.norm(p_inner - p_outer)
        if eye_width < 1e-3:
            return 0.5

        return float((iris_center[0] - p_outer[0]) / eye_width)

    # =====================================================
    # FRAME EXTRACTION (TRACKING ONLY)
    # =====================================================
    def extract(self, frame: np.ndarray, timestamp: float = None) -> Dict:
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
            self._end_eye_contact(timestamp)
            return {"detected": False, "warmup": elapsed < self.warmup_duration}

        self.face_detected_count += 1
        lm = result.multi_face_landmarks[0].landmark

        # ---------- EYES OPEN ----------
        left_ear = self._ear(lm, self.LEFT_EYE_EAR, w, h)
        right_ear = self._ear(lm, self.RIGHT_EYE_EAR, w, h)
        eyes_open = (left_ear + right_ear) / 2.0 > self.EYE_OPEN_THRESHOLD

        # ---------- HEAD CENTER ----------
        left_eye_x = (lm[self.LEFT_EYE_OUTER].x + lm[self.LEFT_EYE_INNER].x) * 0.5 * w
        right_eye_x = (lm[self.RIGHT_EYE_OUTER].x + lm[self.RIGHT_EYE_INNER].x) * 0.5 * w
        eye_mid_x = (left_eye_x + right_eye_x) / 2.0
        eye_width = abs(right_eye_x - left_eye_x)

        nose_x = lm[self.NOSE_CENTER].x * w
        head_centered = abs(nose_x - eye_mid_x) / max(eye_width, 1e-3) < self.NOSE_CENTER_THRESHOLD

        # ---------- GAZE ----------
        gaze_left = self._gaze_ratio(
            lm, self.LEFT_EYE_OUTER, self.LEFT_EYE_INNER, self.LEFT_IRIS, w, h
        )
        gaze_right = self._gaze_ratio(
            lm, self.RIGHT_EYE_OUTER, self.RIGHT_EYE_INNER, self.RIGHT_IRIS, w, h
        )

        gaze_centered = (
            abs(gaze_left - 0.5) < self.GAZE_CENTER_THRESHOLD and
            abs(gaze_right - 0.5) < self.GAZE_CENTER_THRESHOLD
        )

        looking = eyes_open and head_centered and gaze_centered

        # ---------- TIME-BASED TRACKING ----------
        if elapsed >= self.warmup_duration:
            if looking:
                if self.current_contact_start is None:
                    self.current_contact_start = timestamp
            else:
                self._end_eye_contact(timestamp)

        return {"detected": True, "warmup": elapsed < self.warmup_duration}

    def _end_eye_contact(self, timestamp: float):
        if self.current_contact_start is not None:
            duration = timestamp - self.current_contact_start
            if duration >= self.MIN_EYE_CONTACT_DURATION:
                self.eye_contact_segments.append(
                    (self.current_contact_start, timestamp)
                )
            self.current_contact_start = None

    # =====================================================
    # SESSION SUMMARY (CORRECTED)
    # =====================================================
    def get_summary(self) -> Dict:
        if self.current_contact_start is not None:
            self._end_eye_contact(self.current_contact_start)

        face_ratio = self.face_detected_count / max(self.total_frames, 1)

        total_duration = (
            max(self.session_start_time + 1e-6, self.session_start_time)
        )

        eye_contact_time = sum(
            end - start for start, end in self.eye_contact_segments
        )

        session_time = max(
            (self.total_frames * 0.033),  # approx 30 FPS fallback
            1.0
        )

        ratio = eye_contact_time / session_time

        # Stricter thresholds for autism screening
        if ratio < 0.50:
            level = "low"
            interpretation = "Reduced eye contact (autism indicator)"
        elif ratio < 0.70:
            level = "moderate"
            interpretation = "Moderate eye contact - borderline"
        else:
            level = "high"
            interpretation = "Good eye contact"

        return {
            "eye_contact_ratio": round(ratio, 3),
            "level": level,
            "interpretation": interpretation,
            "face_detection_ratio": round(face_ratio, 3)
        }

    # =====================================================
    # RESET
    # =====================================================
    def reset(self):
        self.session_start_time = None
        self.total_frames = 0
        self.face_detected_count = 0
        self.current_contact_start = None
        self.eye_contact_segments.clear()