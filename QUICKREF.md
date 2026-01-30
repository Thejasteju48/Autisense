# ⚡ QUICK REFERENCE CARD

## 🚀 START SERVICES (Run This First)
```powershell
cd d:\AutismProject\ml-service
.\start_services.ps1
```
Wait 15-20 seconds for services to load.

---

## 🌐 ACCESS URLS
- **Frontend**: http://localhost:3001 (or check console for actual port)
- **Backend**: http://localhost:5001
- **Main ML**: http://localhost:8000
- **DeepFace**: http://localhost:8001

---

## ✅ VERIFY STATUS
```powershell
cd d:\AutismProject\ml-service
.\verify_services.ps1
```

---

## 🛑 STOP SERVICES
```powershell
.\stop_services.ps1
```

---

## 🧪 TEST INTEGRATION
```powershell
.\test_deepface.ps1          # Test DeepFace communication
.\test_video_upload.ps1      # Test video processing (needs video file)
```

---

## 📊 7 FEATURES
1. ✅ Eye Contact Ratio
2. ✅ Blink Rate per Minute
3. ✅ Head Movement Rate
4. ✅ Head Repetitive Movements
5. ✅ Hand Repetitive Movements (Stimming)
6. ✅ Social Gestures Frequency
7. ✅ Facial Expression Variability (DeepFace)

---

## 🎯 USAGE WORKFLOW
1. Open http://localhost:3001
2. Register/Login
3. Add child profile (age, gender, etc.)
4. Click "Start Screening"
5. Record or upload video (2-5 minutes recommended)
6. Complete M-CHAT questionnaire (10 questions)
7. View comprehensive results with all 7 features!

---

## 🔧 TROUBLESHOOTING

### Services won't start?
```powershell
Get-Process python | Stop-Process -Force
Get-Process node | Stop-Process -Force
Start-Sleep 3
.\start_services.ps1
```

### Port already in use?
```powershell
netstat -ano | findstr ":8000 :8001 :5001 :3001"
```

### DeepFace not working?
- Expression detection will be disabled
- Other 6 features will still work fine
- Check console window for error messages

---

## 📚 FULL DOCUMENTATION
- **FINAL_STATUS.md** - Complete implementation summary
- **QUICK_START.md** - Detailed getting started guide  
- **SETUP_INSTRUCTIONS.md** - Full setup instructions
- **DEEPFACE_SOLUTION.md** - Architecture documentation

---

## 🎉 READY TO USE!
All implementation complete. Upload a video and see results! 🚀
