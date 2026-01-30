# DeepFace Emotion Detection Microservice

This service runs DeepFace with TensorFlow 2.10.1 in a separate Python 3.9 environment.

## Setup

### Prerequisites
- Python 3.9 (NOT 3.10, 3.11, or 3.12)

### Installation

1. **Download and install Python 3.9** from https://www.python.org/downloads/release/python-3918/

2. **Create virtual environment with Python 3.9:**
   ```powershell
   C:\Python39\python.exe -m venv venv39
   ```

3. **Activate and install dependencies:**
   ```powershell
   .\venv39\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Run the service:**
   ```powershell
   python deepface_server.py
   ```

## Usage

### Health Check
```powershell
Invoke-WebRequest -Uri "http://localhost:8001/health" -Method GET
```

### Analyze Emotion
```python
import requests
import base64
import cv2

# Read image
img = cv2.imread("face.jpg")
_, buffer = cv2.imencode('.jpg', img)
img_base64 = base64.b64encode(buffer).decode('utf-8')

# Send request
response = requests.post(
    "http://localhost:8001/analyze_emotion",
    json={"image": img_base64}
)

result = response.json()
print(f"Emotion: {result['emotion']}")
print(f"Confidence: {result['emotions']}")
```

## Troubleshooting

### Error: "No module named 'tensorflow'"
- Ensure you're using Python 3.9, not 3.12
- Reinstall: `pip install tensorflow==2.10.1`

### Error: "Incompatible protobuf version"
- Ensure protobuf==3.20.3 is installed
- Run: `pip install protobuf==3.20.3 --force-reinstall`

### Error: "Could not find function xmlCheckVersion"
- Install Visual C++ Redistributable for Visual Studio 2015-2019
- https://aka.ms/vs/16/release/vc_redist.x64.exe
