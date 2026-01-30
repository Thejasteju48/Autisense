"""
Facial Emotion & Expression Variability Feature Extractor
STEP-1 NORMALIZED OUTPUT
INTERNAL entropy preserved, EXTERNAL output = LOW / MODERATE / HIGH only
"""

import cv2
import numpy as np
import os
import time
import base64
import requests
from typing import Dict, List


class ExpressionVariabilityFeature:
    def __init__(self):
        # ==========================================
        # DeepFace Microservice Configuration
        # ==========================================
        self.deepface_url = "http://localhost:8001/analyze_emotion"
        self.deepface_available = self._check_deepface_service()

        # ==========================================
        # Haar Cascade
        # ==========================================
        current_dir = os.path.dirname(os.path.abspath(__file__))
        xml_path = os.path.join(current_dir, "haarcascade_frontalface_default.xml")

        self.face_cascade = cv2.CascadeClassifier(xml_path)
        if self.face_cascade.empty():
            raise ValueError("Failed to load haarcascade_frontalface_default.xml")

        # ==========================================
        # TIME-AWARE TRACKING
        # ==========================================
        self.emotion_history: List[str] = []
        self.session_start_time = None
        self.warmup_duration = 2.0

        # ==========================================
        # DATA QUALITY
        # ==========================================
        self.total_frames_processed = 0
        self.successful_detections = 0

    def _check_deepface_service(self) -> bool:
        try:
            r = requests.get("http://localhost:8001/health", timeout=1)
            return r.status_code == 200
        except:
            return False

    # ==================================================
    # FRAME EXTRACTION (TRACKING ONLY)
    # ==================================================
    def extract(self, frame: np.ndarray, timestamp: float = None) -> Dict:
        """
        Tracks facial emotion internally.
        DOES NOT expose emotion labels externally.
        """
        if timestamp is None:
            raise ValueError("Timestamp required")

        if self.session_start_time is None:
            self.session_start_time = timestamp

        self.total_frames_processed += 1
        elapsed = timestamp - self.session_start_time

        if frame is None:
            return {"detected": False, "warmup": False}

        gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
        )

        if len(faces) == 0:
            return {"detected": False, "warmup": elapsed < self.warmup_duration}

        if elapsed < self.warmup_duration:
            return {"detected": True, "warmup": True}

        # Call DeepFace every 10th frame
        if not self.deepface_available or self.total_frames_processed % 10 != 0:
            return {"detected": True, "warmup": False}

        try:
            _, buffer = cv2.imencode(".jpg", frame)
            img_base64 = base64.b64encode(buffer).decode("utf-8")

            response = requests.post(
                self.deepface_url,
                json={"image": img_base64},
                timeout=5  # Increased from 2 to 5 seconds
            )

            if response.status_code == 200:
                data = response.json()
                emotion = data.get("dominant_emotion")
                if emotion and emotion != "unknown":
                    self.emotion_history.append(emotion)
                    self.successful_detections += 1
            else:
                # Don't disable service on single failure, just log
                print(f"⚠️ Emotion service returned status {response.status_code}")

        except requests.exceptions.Timeout:
            # Don't disable on timeout, just skip this frame
            print(f"⚠️ Emotion service timeout on frame {self.total_frames_processed}")
        except Exception as e:
            # Only disable on connection errors, not timeouts
            print(f"⚠️ Emotion service error: {str(e)}")
            if "Connection" in str(e) or "refused" in str(e):
                self.deepface_available = False

        return {"detected": True, "warmup": False}

    # ==================================================
    # SESSION SUMMARY (ONLY LEVEL OUTPUT)
    # ==================================================
    def get_summary(self) -> Dict:
        detection_rate = (self.successful_detections / max(1, self.total_frames_processed))
        
        if len(self.emotion_history) < 20:
            return {
                "variability": 0.0,
                "level": "insufficient_data",
                "interpretation": "Insufficient facial expression data collected",
                "detection_rate": detection_rate
            }

        # Shannon entropy for expression diversity
        values, counts = np.unique(self.emotion_history, return_counts=True)
        probabilities = counts / counts.sum()

        entropy = -np.sum(probabilities * np.log2(probabilities + 1e-9))
        max_entropy = np.log2(len(values))  # Max possible entropy for this many unique emotions
        
        # Normalize to 0-1 range (variability score)
        variability = float(entropy / max(max_entropy, 1e-9))
        variability = float(np.clip(variability, 0.0, 1.0))

        # Determine level classification - stricter for autism screening
        if variability < 0.50:
            level = "low"
            interpretation = "Restricted facial expressions - limited emotional range observed (autism indicator)"
        elif variability < 0.75:
            level = "moderate"
            interpretation = "Moderate emotional expressiveness - some variation but limited"
        else:
            level = "high"
            interpretation = "Diverse emotional expressions - good range of facial expressions"

        return {
            "variability": variability,
            "level": level,
            "interpretation": interpretation,
            "detection_rate": detection_rate
        }

    # ==================================================
    # RESET
    # ==================================================
    def reset(self):
        self.emotion_history.clear()
        self.session_start_time = None
        self.total_frames_processed = 0
        self.successful_detections = 0