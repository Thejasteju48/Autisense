# 🚀 QUICK START GUIDE

## Current Status

**✅ COMPLETE SETUP DONE!**

All code changes implemented:
- ✅ DeepFace microservice created (Python 3.9)
- ✅ ML service updated (Python 3.12, no TensorFlow)
- ✅ Backend updated for all 7 features
- ✅ Integration tests created
- ✅ Management scripts created

---

## 🎯 How to Use

### **1. Start Services (Every Time)**

```powershell
cd d:\AutismProject\ml-service

# Method A: Using start script
.\start_services.ps1

# Method B: Manual start
# Terminal 1:
C:\Users\Thejas\anaconda3\envs\deepface_py39\python.exe deepface_service\deepface_server.py

# Terminal 2:
.\venv\Scripts\python.exe main.py
```

**Wait 15-20 seconds** for services to fully start.

---

### **2. Verify Services Are Running**

```powershell
.\verify_services.ps1
```

Expected output:
```
✓ Main Service: RUNNING
✓ DeepFace Service: RUNNING
```

---

### **3. Test Video Processing (Optional)**

```powershell
# Test DeepFace integration
.\test_deepface.ps1

# Test full video processing (requires test video)
.\test_video_upload.ps1
```

---

### **4. Start Backend & Frontend**

```powershell
# Terminal 3 - Backend
cd d:\AutismProject\backend
npm start

# Terminal 4 - Frontend
cd d:\AutismProject\frontend
npm run dev
```

---

### **5. Upload Video Through Web Interface**

1. Open browser: http://localhost:3000
2. Login / Register
3. Add child profile
4. Start screening
5. Record or upload video
6. Complete questionnaire
7. **View results with ALL 7 features!**

---

## 📊 What You'll See

### **7 Behavioral Features Detected:**

1. **Eye Contact Ratio**: 0.0 - 1.0 (how often child looks at camera)
2. **Blink Rate**: blinks per minute (attention indicator)
3. **Head Movement**: movement frequency
4. **Head Repetitive Movements**: stereotyped patterns
5. **Hand Repetitive Movements**: stimming behaviors
6. **Social Gestures**: pointing, waving, etc.
7. **Facial Expression Variability**: emotional expressiveness ⭐ **NEW!**

### **Clinical Interpretation:**
- Risk Level: Low / Moderate / High
- Concerns: List of detected behavioral markers
- Risk Score: 0.0 - 1.0

---

## 🔧 If Services Don't Start

```powershell
# Kill all Python processes
Get-Process python | Stop-Process -Force

# Wait 2 seconds
Start-Sleep 2

# Start again
.\start_services.ps1
```

---

## 📱 Service URLs

- **Main ML Service**: http://localhost:8000
- **DeepFace Service**: http://localhost:8001
- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:3000

---

## ⚡ Quick Checks

```powershell
# Check if ports are in use
netstat -ano | findstr ":8000"
netstat -ano | findstr ":8001"
netstat -ano | findstr ":5000"
netstat -ano | findstr ":3000"

# Check running Python processes
Get-Process python
```

---

## 🛑 Stop Services

```powershell
.\stop_services.ps1

# Or manually
Get-Process python | Stop-Process -Force
```

---

## 📚 Full Documentation

- **`IMPLEMENTATION_SUMMARY.md`**: Complete technical details
- **`SETUP_INSTRUCTIONS.md`**: Step-by-step setup guide
- **`DEEPFACE_SOLUTION.md`**: Architecture explanation
- **`deepface_service/README.md`**: DeepFace service docs

---

## ✅ Success Checklist

Before testing frontend:

- [ ] DeepFace service responds: `Invoke-WebRequest http://localhost:8001/health`
- [ ] Main service responds: `Invoke-WebRequest http://localhost:8000/`
- [ ] Backend running: `Invoke-WebRequest http://localhost:5000/api/health`
- [ ] Frontend running: Open http://localhost:3000
- [ ] MongoDB connected: Check backend console logs

---

## 🎉 You're Ready!

All 7 behavioral features are now operational:
- **6 features** run locally (MediaPipe, OpenCV)
- **1 feature** uses DeepFace microservice (expression detection)

**No dependency conflicts!** Each service has its own Python environment.

---

**Need Help?** Check console windows for error messages.

**Services starting slowly?** This is normal on first run (model loading).

**Ready to test?** Upload a video and watch all 7 features get detected! 🚀
