import os
import logging
import mediapipe as mp
import numpy as np
from typing import Dict
from collections import deque

from .video_utils import iter_video_frames

logger = logging.getLogger(__name__)


class HandGestureDetector:
    """
    Detects communicative hand WAVING gestures (e.g., hello/goodbye wave).
    Uses a rolling window to count direction reversals:
      - Wave:    open palm + 1-4 reversals in 1s window (1-2 back-and-forth sweeps)
      - Stimming: 5+ reversals in 1s window → explicitly rejected
    """
    def __init__(self):
        self.hands = mp.solutions.hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6
        )

        self.fps = 30
        self.window_frames = self.fps          # 1-second rolling window
        self.cooldown_frames = 30

        # Wave motion constraints
        self.wave_min_reversals = 1            # at least 1 direction change
        self.wave_max_reversals = 4            # ≤4 reversals = wave; 5+ = stimming
        self.wave_min_amplitude = 0.04         # hand must travel meaningful distance
        self.wave_min_palm_ratio = 0.5         # palm must be open ≥50% of window
        self.min_reversal_spacing = 6          # reversals < 6 frames apart = stimming (too rapid-fire)

    def _finger_extended(self, lm, tip, pip) -> bool:
        return lm[tip].y < lm[pip].y

    def _is_open_palm(self, lm) -> bool:
        return (
            self._finger_extended(lm, 8, 6) and
            self._finger_extended(lm, 12, 10) and
            self._finger_extended(lm, 16, 14) and
            self._finger_extended(lm, 20, 18)
        )

    def _is_wave(self, wrist_positions, palm_open_flags) -> bool:
        """
        Detect a wave in a 1-second window of wrist positions.
        Wave = open palm + 1-4 direction reversals + meaningful amplitude
              + reversals well-spaced apart (not rapid-fire stimming).
        Stimming = 5+ reversals OR reversals < 6 frames apart → rejected.
        Requires full 30-frame (1s) window.
        """
        if len(wrist_positions) < self.window_frames:
            return False

        # Require palm open for majority of window
        if sum(palm_open_flags) / len(palm_open_flags) < self.wave_min_palm_ratio:
            return False

        pts = np.array(wrist_positions)
        xs = pts[:, 0]
        ys = pts[:, 1]

        amp_x = xs.max() - xs.min()
        amp_y = ys.max() - ys.min()
        amplitude = max(amp_x, amp_y)

        if amplitude < self.wave_min_amplitude:
            return False

        # Use primary axis for reversal counting
        motion = xs if amp_x >= amp_y else ys

        # Smooth to remove jitter
        if len(motion) >= 3:
            kernel = np.array([0.25, 0.5, 0.25])
            smoothed = np.convolve(motion, kernel, mode='valid')
        else:
            smoothed = motion

        direction = np.sign(np.diff(smoothed))
        direction = direction[direction != 0]

        if len(direction) < 2:
            return False

        reversal_mask = direction[1:] * direction[:-1] < 0
        reversals = int(np.sum(reversal_mask))

        # Wave: 1-4 reversals. Stimming: 5+ reversals → rejected
        if not (self.wave_min_reversals <= reversals <= self.wave_max_reversals):
            return False

        # Spacing check: wave reversals are well-spread out.
        # Stimming reversals fire every 2-4 frames; wave reversals every 6+ frames.
        reversal_indices = np.where(reversal_mask)[0]
        if len(reversal_indices) >= 2:
            min_spacing = int(np.min(np.diff(reversal_indices)))
            if min_spacing < self.min_reversal_spacing:
                return False

        return True

    def analyze(self, video_path: str) -> Dict:
        gesture_count = 0
        last_gesture_frame = -self.cooldown_frames

        wrist_history = deque(maxlen=self.window_frames)
        palm_history = deque(maxlen=self.window_frames)
        frame_count = 0

        for idx, _, frame in iter_video_frames(video_path):
            frame_count += 1
            rgb = frame[:, :, ::-1]
            result = self.hands.process(rgb)

            if not result.multi_hand_landmarks:
                wrist_history.clear()
                palm_history.clear()
                continue

            lm = result.multi_hand_landmarks[0].landmark
            wrist_history.append((lm[0].x, lm[0].y))
            palm_history.append(self._is_open_palm(lm))

            if (
                len(wrist_history) >= self.window_frames and
                frame_count % (self.window_frames // 2) == 0 and
                frame_count - last_gesture_frame >= self.cooldown_frames
            ):
                if self._is_wave(list(wrist_history), list(palm_history)):
                    gesture_count += 1
                    last_gesture_frame = frame_count
                    wrist_history.clear()
                    palm_history.clear()

        logger.info(
            "[HAND_GESTURE] count=%s present=%s",
            gesture_count,
            gesture_count > 0
        )

        return {"present": gesture_count > 0, "count": gesture_count}
