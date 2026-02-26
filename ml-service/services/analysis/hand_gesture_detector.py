import os
import logging
import mediapipe as mp
import numpy as np
from typing import Dict

from .video_utils import iter_video_frames

logger = logging.getLogger(__name__)


class HandGestureDetector:
    def __init__(self):
        self.hands = mp.solutions.hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6
        )

        self.cooldown_frames = 15

        # --- internal stability config ---
        self.min_hold_frames = 6          # gesture must persist
        self.max_motion_threshold = 0.015 # reject fast movement

    def _finger_extended(self, lm, tip, pip) -> bool:
        return lm[tip].y < lm[pip].y

    def _is_open_palm(self, lm) -> bool:
        return (
            self._finger_extended(lm, 8, 6) and
            self._finger_extended(lm, 12, 10) and
            self._finger_extended(lm, 16, 14) and
            self._finger_extended(lm, 20, 18)
        )

    def _is_pointing(self, lm) -> bool:
        index_extended = self._finger_extended(lm, 8, 6)
        middle_folded = lm[12].y > lm[10].y
        ring_folded = lm[16].y > lm[14].y
        pinky_folded = lm[20].y > lm[18].y
        return index_extended and middle_folded and ring_folded and pinky_folded

    def analyze(self, video_path: str) -> Dict:
        gesture_count = 0
        last_gesture_frame = -self.cooldown_frames

        hold_counter = 0
        prev_wrist = None

        for idx, _, frame in iter_video_frames(video_path):
            rgb = frame[:, :, ::-1]
            result = self.hands.process(rgb)

            if not result.multi_hand_landmarks:
                hold_counter = 0
                prev_wrist = None
                continue

            lm = result.multi_hand_landmarks[0].landmark

            # --- motion check (reject stimming) ---
            wrist = np.array([lm[0].x, lm[0].y])
            motion_ok = True

            if prev_wrist is not None:
                motion = np.linalg.norm(wrist - prev_wrist)
                if motion > self.max_motion_threshold:
                    motion_ok = False

            prev_wrist = wrist

            # --- shape check ---
            shape_ok = self._is_open_palm(lm) or self._is_pointing(lm)

            if shape_ok and motion_ok:
                hold_counter += 1
            else:
                hold_counter = 0

            # --- gesture confirmed ---
            if (
                hold_counter >= self.min_hold_frames and
                idx - last_gesture_frame >= self.cooldown_frames
            ):
                gesture_count += 1
                last_gesture_frame = idx
                hold_counter = 0

        logger.info(
            "[HAND_GESTURE] count=%s present=%s",
            gesture_count,
            gesture_count > 0
        )

        return {"present": gesture_count > 0, "count": gesture_count}
