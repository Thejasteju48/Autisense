import cv2
from typing import Iterator, Tuple


def iter_video_frames(video_path: str) -> Iterator[Tuple[int, int, 'cv2.Mat']]:
    """Yield (frame_index, total_frames, frame) for each frame in the video."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Failed to open video: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
    frame_index = 0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            yield frame_index, total_frames, frame
            frame_index += 1
    finally:
        cap.release()
