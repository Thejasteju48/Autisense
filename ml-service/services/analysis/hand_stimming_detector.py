import os
import logging
import numpy as np
from typing import Dict
from collections import deque

import mediapipe as mp
from mediapipe import solutions

from .video_utils import iter_video_frames

logger = logging.getLogger(__name__)


class HandStimmingDetector:
    def __init__(self):
        self.hands = solutions.hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6
        )
        # Clinical config (unchanged names)
        self.fps = 30
        self.window_seconds = 2.0
        self.window_frames = int(self.fps * self.window_seconds)
        self.min_oscillations = 4
        self.min_amplitude = 0.008
        self.max_amplitude = 0.8
        self.min_step = 0.003
        self.smooth_window = 5
        self.required_windows = 2

    def is_stimming(self, points):
        """Check if a window of points shows stimming behavior."""
        if len(points) < self.window_frames:
            return False

        pts = np.array(points)

        # -----------------------
        # Smooth to remove jitter
        # -----------------------
        if self.smooth_window > 1 and len(pts) >= self.smooth_window:
            kernel = np.ones(self.smooth_window) / self.smooth_window
            xs = np.convolve(pts[:, 0], kernel, mode="valid")
            ys = np.convolve(pts[:, 1], kernel, mode="valid")
        else:
            xs = pts[:, 0]
            ys = pts[:, 1]

        # -----------------------
        # Amplitude gate
        # -----------------------
        amp_x = xs.max() - xs.min()
        amp_y = ys.max() - ys.min()
        amplitude = max(amp_x, amp_y)

        if amplitude < self.min_amplitude or amplitude > self.max_amplitude:
            return False

        # -----------------------
        # Velocity & motion density
        # -----------------------
        dx = np.diff(xs)
        dy = np.diff(ys)
        speed = np.sqrt(dx ** 2 + dy ** 2)

        active_motion = speed >= self.min_step

        # Require sustained motion (not brief jitter)
        if np.sum(active_motion) < 0.4 * len(speed):
            return False

        # -----------------------
        # True oscillation detection
        # -----------------------
        dx_active = dx[active_motion]
        if len(dx_active) < 3:
            return False

        direction = np.sign(dx_active)
        direction = direction[direction != 0]

        if len(direction) < 3:
            return False

        reversals = np.sum(direction[1:] * direction[:-1] < 0)

        return reversals >= self.min_oscillations

    def analyze(self, video_path: str) -> Dict:
        history = deque(maxlen=self.window_frames)
        positive_windows = 0
        total_windows = 0
        frame_count = 0

        for _, _, frame in iter_video_frames(video_path):
            frame_count += 1

            rgb = frame[:, :, ::-1]
            result = self.hands.process(rgb)

            if result.multi_hand_landmarks:
                lm = result.multi_hand_landmarks[0].landmark
                history.append((lm[9].x, lm[9].y))  # palm center

            # -----------------------
            # NON-overlapping windows
            # -----------------------
            if frame_count % self.window_frames == 0 and len(history) == self.window_frames:
                total_windows += 1
                if self.is_stimming(list(history)):
                    positive_windows += 1
                history.clear()

        present = positive_windows >= self.required_windows

        print(
            f"[HAND_STIMMING] windows={total_windows} "
            f"positive={positive_windows} present={present}",
            flush=True
        )

        return {"present": present}
