import os
import logging
import mediapipe as mp
import numpy as np
from typing import Dict

from .video_utils import iter_video_frames

logger = logging.getLogger(__name__)


class EyeContactDetector:
    def __init__(self):
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6
        )

        self.left_eye = [33, 160, 158, 133, 153, 144]
        self.right_eye = [263, 387, 385, 362, 380, 373]
        self.left_eye_outer = 362
        self.left_eye_inner = 263
        self.right_eye_outer = 33
        self.right_eye_inner = 133
        self.left_iris = [474, 475, 476, 477]
        self.right_iris = [469, 470, 471, 472]

        self.eye_open_threshold = 0.18
        self.gaze_center_threshold = 0.18
        self.min_frames = 10

    def _ear(self, landmarks, indices, w, h) -> float:
        pts = np.array([[landmarks[i].x * w, landmarks[i].y * h] for i in indices])
        p1, p2, p3, p4, p5, p6 = pts
        v1 = np.linalg.norm(p2 - p6)
        v2 = np.linalg.norm(p3 - p5)
        h1 = np.linalg.norm(p1 - p4)
        if h1 < 1e-6:
            return 0.0
        return (v1 + v2) / (2.0 * h1)

    def _gaze_ratio(self, landmarks, outer, inner, iris, w, h) -> float:
        p_outer = np.array([landmarks[outer].x * w, landmarks[outer].y * h])
        p_inner = np.array([landmarks[inner].x * w, landmarks[inner].y * h])
        iris_pts = np.array([[landmarks[i].x * w, landmarks[i].y * h] for i in iris])
        iris_center = iris_pts.mean(axis=0)
        eye_width = np.linalg.norm(p_inner - p_outer)
        if eye_width < 1e-6:
            return 0.5
        return float((iris_center[0] - p_outer[0]) / eye_width)

    def analyze(self, video_path: str) -> Dict:
        total_face_frames = 0
        eye_contact_frames = 0

        for _, _, frame in iter_video_frames(video_path):
            h, w = frame.shape[:2]
            rgb = frame[:, :, ::-1]

            result = self.face_mesh.process(rgb)
            if not result.multi_face_landmarks:
                continue

            total_face_frames += 1
            lm = result.multi_face_landmarks[0].landmark

            left_ear = self._ear(lm, self.left_eye, w, h)
            right_ear = self._ear(lm, self.right_eye, w, h)
            eyes_open = (left_ear + right_ear) / 2.0 > self.eye_open_threshold

            gaze_left = self._gaze_ratio(
                lm, self.left_eye_outer, self.left_eye_inner, self.left_iris, w, h
            )
            gaze_right = self._gaze_ratio(
                lm, self.right_eye_outer, self.right_eye_inner, self.right_iris, w, h
            )

            gaze_centered = (
                abs(gaze_left - 0.5) < self.gaze_center_threshold and
                abs(gaze_right - 0.5) < self.gaze_center_threshold
            )

            if eyes_open and gaze_centered:
                eye_contact_frames += 1

        if total_face_frames < self.min_frames:
            return {"label": "Low Eye Contact", "ratio": 0.0}

        ratio = eye_contact_frames / total_face_frames
        label = "Normal Eye Contact" if ratio >= 0.6 else "Low Eye Contact"

        return {"label": label, "ratio": round(ratio, 3)}
