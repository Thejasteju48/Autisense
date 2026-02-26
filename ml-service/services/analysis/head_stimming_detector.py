import os
import logging
import mediapipe as mp
import numpy as np
from typing import Dict
from collections import deque

from .video_utils import iter_video_frames

logger = logging.getLogger(__name__)


class HeadStimmingDetector:
    def __init__(self):
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=False,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6
        )

        self.nose_tip = 1

        # Clinical config (head movements are smaller than hand)
        self.fps = 30
        self.window_seconds = 2.0
        self.window_frames = int(self.fps * self.window_seconds)

        self.min_oscillations = 4
        self.min_amplitude = 0.005
        self.max_amplitude = 0.12
        self.min_step = 0.002
        self.smooth_window = 5
        self.required_windows = 2

    def is_stimming(self, points):
        if len(points) < self.window_frames:
            return False

        pts = np.array(points)

        # ---- smoothing ----
        if self.smooth_window > 1:
            kernel = np.ones(self.smooth_window) / self.smooth_window
            xs = np.convolve(pts[:, 0], kernel, mode="valid")
            ys = np.convolve(pts[:, 1], kernel, mode="valid")
        else:
            xs, ys = pts[:, 0], pts[:, 1]

        # ---- amplitude gate ----
        amp_x = xs.max() - xs.min()
        amp_y = ys.max() - ys.min()
        amplitude = max(amp_x, amp_y)

        if amplitude < self.min_amplitude or amplitude > self.max_amplitude:
            return False

        # ---- motion gate ----
        dx = np.diff(xs)
        dy = np.diff(ys)
        speed = np.sqrt(dx ** 2 + dy ** 2)

        active = speed >= self.min_step
        if np.sum(active) < 0.5 * len(speed):
            return False

        dx_active = dx[active]
        direction = np.sign(dx_active)
        direction = direction[direction != 0]

        if len(direction) < 6:
            return False

        # ---- oscillation detection ----
        sign_changes = np.where(direction[1:] * direction[:-1] < 0)[0]
        if len(sign_changes) < self.min_oscillations:
            return False

        # ---- rhythmic consistency (KEY FIX) ----
        intervals = np.diff(sign_changes)
        if len(intervals) < 2:
            return False

        interval_mean = np.mean(intervals)
        interval_std = np.std(intervals)

        # Head gestures = irregular timing
        if interval_mean == 0 or (interval_std / interval_mean) > 0.6:
            return False

        return True

    def analyze(self, video_path: str) -> Dict:
        history = deque(maxlen=self.window_frames)
        positive_windows = 0
        total_windows = 0
        stable = True

        for _, _, frame in iter_video_frames(video_path):
            rgb = frame[:, :, ::-1]
            result = self.face_mesh.process(rgb)

            if result.multi_face_landmarks:
                lm = result.multi_face_landmarks[0].landmark
                nose = lm[self.nose_tip]
                history.append((nose.x, nose.y))

            if len(history) == self.window_frames:
                total_windows += 1
                if self.is_stimming(list(history)):
                    positive_windows += 1
                history.clear()

        present = positive_windows >= self.required_windows

        logger.info(
            "[HEAD_STIMMING] windows=%s positive=%s present=%s stable=%s",
            total_windows,
            positive_windows,
            present,
            stable
        )

        return {"present": present, "stable": stable}
