# ML Service Setup Instructions

## Main Service (Python 3.12)

This service handles:
- Video processing
- Eye contact detection (MediaPipe)
- Blink rate analysis (MediaPipe)
- Head movement tracking (MediaPipe)
- Hand repetition detection (MediaPipe Pose)
- Gesture detection (MediaPipe Hands)
- Questionnaire prediction (scikit-learn)

### Installation

```powershell
# Navigate to ml-service
cd d:\AutismProject\ml-service

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Run Service

```powershell
.\venv\Scripts\python.exe main.py
```

Service runs on: **http://localhost:8000**

---

## DeepFace Service (Python 3.9 REQUIRED)

This service handles:
- Facial expression/emotion detection using DeepFace + TensorFlow 2.10.1

### Why Separate Service?

DeepFace requires TensorFlow 2.10.1, which:
- Only supports Python 3.7-3.10 (NOT 3.12)
- Requires numpy<2.0 and protobuf==3.20.3
- Conflicts with MediaPipe's requirements (numpy>=2.0, protobuf<5)

### Installation

1. **Install Python 3.9** (if not already installed):
   - Download from: https://www.python.org/downloads/release/python-3918/
   - Install to: `C:\Python39\`

2. **Create Python 3.9 virtual environment:**
   ```powershell
   cd d:\AutismProject\ml-service\deepface_service
   C:\Python39\python.exe -m venv venv39
   ```

3. **Activate and install dependencies:**
   ```powershell
   .\venv39\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Run DeepFace service:**
   ```powershell
   python deepface_server.py
   ```

Service runs on: **http://localhost:8001**

---

## Running Both Services

### Option 1: Two Terminals

**Terminal 1 (Main Service):**
```powershell
cd d:\AutismProject\ml-service
.\venv\Scripts\python.exe main.py
```

**Terminal 2 (DeepFace Service):**
```powershell
cd d:\AutismProject\ml-service\deepface_service
.\venv39\Scripts\python.exe deepface_server.py
```

### Option 2: Background Process

```powershell
# Start DeepFace service in background
cd d:\AutismProject\ml-service\deepface_service
Start-Process -FilePath ".\venv39\Scripts\python.exe" -ArgumentList "deepface_server.py" -WindowStyle Hidden

# Start main service
cd d:\AutismProject\ml-service
.\venv\Scripts\python.exe main.py
```

---

## Verification

### Check Main Service
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/" -Method GET
```

### Check DeepFace Service
```powershell
Invoke-WebRequest -Uri "http://localhost:8001/health" -Method GET
```

---

## Troubleshooting

### Main Service Issues

**Error: "No module named 'mediapipe'"**
```powershell
pip install mediapipe==0.10.14
```

**Error: "numpy version conflict"**
```powershell
pip install "numpy>=2.0,<2.3" --force-reinstall
```

### DeepFace Service Issues

**Error: "tensorflow requires Python <3.11"**
- You must use Python 3.9, not 3.12
- Reinstall with: `C:\Python39\python.exe -m venv venv39`

**Error: "No module named 'deepface'"**
```powershell
.\venv39\Scripts\activate
pip install -r requirements.txt
```

**Port 8001 already in use:**
```powershell
# Find and kill process
Get-Process | Where-Object {$_.ProcessName -eq "python"} | Stop-Process -Force
```

---

## Package Versions

### Main Service (Python 3.12)
- FastAPI: 0.104.1
- MediaPipe: 0.10.14
- NumPy: 2.2.6
- OpenCV: 4.12.0.88
- Protobuf: 4.25.8
- scikit-learn: 1.8.0

### DeepFace Service (Python 3.9)
- TensorFlow: 2.10.1
- Keras: 2.10.0
- NumPy: 1.23.5
- Protobuf: 3.20.3
- DeepFace: 0.0.79
- Flask: 2.3.2
