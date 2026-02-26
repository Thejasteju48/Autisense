import os
import cv2
import torch
import torch.nn as nn
import numpy as np
from typing import Dict, List
import logging
from PIL import Image
from torchvision import transforms

logger = logging.getLogger(__name__)

from .video_utils import iter_video_frames


class CNNv2(nn.Module):
    """CNN model matching training architecture (64x64 input)"""
    def __init__(self, num_classes):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2),

            nn.Conv2d(32, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),

            nn.Conv2d(64, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.MaxPool2d(2),

            nn.Conv2d(128, 256, 3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.MaxPool2d(2),
        )

        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256 * 4 * 4, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        return self.classifier(self.features(x))


class EmotionVariationDetector:
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.device = torch.device('cpu')
        self.img_size = 64
        self.model, self.class_names = self._load_model(model_path)
        self.model.eval()

        current_dir = os.path.dirname(os.path.abspath(__file__))
        haar_path = os.path.join(current_dir, "haarcascade_frontalface_default.xml")
        self.face_cascade = cv2.CascadeClassifier(haar_path)
        if self.face_cascade.empty():
            raise ValueError("Failed to load haarcascade_frontalface_default.xml")

        self.transform = transforms.Compose([
            transforms.Resize((self.img_size, self.img_size)),
            transforms.ToTensor(),
            transforms.Normalize(
                [0.485, 0.456, 0.406],
                [0.229, 0.224, 0.225]
            )
        ])

        self.min_frames = 10

    def _load_model(self, model_path: str):
        """Load model checkpoint with state_dict"""
        try:
            checkpoint = torch.load(model_path, map_location=self.device)
            class_names = checkpoint.get("classes", ["Happy", "Sad", "Neutral", "Angry", "Surprised", "Disgusted"])
            
            model = CNNv2(num_classes=len(class_names))
            model.load_state_dict(checkpoint["model"])
            model.to(self.device)
            
            return model, class_names
        except Exception as e:
            raise ValueError(f"Failed to load emotion model checkpoint: {str(e)}")



    def analyze(self, video_path: str) -> Dict:
        """Analyze emotion variation across video frames"""
        predictions: List[int] = []
        frame_count = 0
        face_count = 0

        print(f"[EMOTION_DETECTOR] Starting analysis of {video_path}", flush=True)
        
        try:
            for idx, total_frames, frame in iter_video_frames(video_path):
                frame_count += 1
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)
                
                if len(faces) == 0:
                    continue

                face_count += 1
                x, y, w, h = faces[0]
                face = frame[y:y + h, x:x + w]
                if face.size == 0:
                    continue

                # Convert BGR to RGB and apply transform
                rgb = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
                img = Image.fromarray(rgb)
                
                x_tensor = self.transform(img).unsqueeze(0).to(self.device)
                
                with torch.no_grad():
                    output = self.model(x_tensor)
                    probs = torch.softmax(output, dim=1)
                    conf, pred = torch.max(probs, 1)
                    predictions.append(int(pred.item()))

            print(f"[EMOTION_DETECTOR] Processed {frame_count} frames, found {face_count} faces with {len(predictions)} predictions", flush=True)
            
            if len(predictions) < self.min_frames:
                print(f"[EMOTION_DETECTOR] Insufficient predictions ({len(predictions)} < {self.min_frames}), returning Low", flush=True)
                return {"label": "Low", "entropy": 0.0}

            # Calculate entropy of emotion distribution
            values, counts = np.unique(np.array(predictions), return_counts=True)
            probs = counts / counts.sum()
            entropy = float(-np.sum(probs * np.log2(probs + 1e-9)))
            normalized = float(entropy / max(np.log2(len(values)), 1e-9))
            label = "Normal" if normalized >= 0.6 else "Low"

            print(f"[EMOTION_DETECTOR] Entropy={entropy:.3f}, Normalized={normalized:.3f}, Label={label}", flush=True)

            return {"label": label, "entropy": round(normalized, 3)}
        except Exception as e:
            print(f"[EMOTION_DETECTOR] Error during analysis: {str(e)}", flush=True)
            raise
