# Autism Project - Structure Documentation

## Project Overview
Full-stack autism behavioral screening system with video analysis and questionnaire-based assessment.

## Technology Stack
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + MongoDB
- **ML Service**: Python + FastAPI + OpenCV + MediaPipe
- **AI**: Groq LLM for analysis interpretation

---

## Directory Structure

```
AutismProject/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # Base UI components (buttons, cards, etc.)
│   │   │   └── VideoRecorder.jsx  # Batch video recording component
│   │   ├── pages/             # Page components
│   │   │   ├── Home.jsx       # Landing page
│   │   │   ├── ScreeningForm.jsx  # Questionnaire and video form
│   │   │   ├── Result.jsx     # Results display with PDF download
│   │   │   └── History.jsx    # Screening history
│   │   ├── context/           # React context providers
│   │   │   └── AuthContext.jsx
│   │   ├── services/          # API service layer
│   │   │   └── api.js         # Axios instance and endpoints
│   │   ├── hooks/             # Custom React hooks
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # Entry point
│   ├── public/                # Static assets
│   ├── package.json           # Dependencies
│   └── vite.config.js         # Vite configuration
│
├── backend/                    # Node.js Express server
│   ├── controllers/           # Request handlers
│   │   ├── screeningController.js  # Main orchestration logic
│   │   └── authController.js
│   ├── models/                # MongoDB schemas
│   │   ├── Screening.js       # Screening data model
│   │   └── User.js
│   ├── routes/                # API route definitions
│   │   ├── screeningRoutes.js
│   │   └── authRoutes.js
│   ├── middleware/            # Express middleware
│   │   └── authMiddleware.js
│   ├── services/              # Business logic services
│   │   └── pdfService.js      # PDF generation with classification details
│   ├── uploads/               # Temporary video storage
│   ├── reports/               # Generated PDF reports
│   ├── server.js              # Entry point
│   ├── package.json           # Dependencies
│   └── .env                   # Environment variables (not in git)
│
├── ml-service/                # Python FastAPI service
│   ├── services/              # Core ML services
│   │   ├── features/          # Video feature extractors
│   │   │   ├── eye_contact_feature.py      # Face mesh + gaze detection
│   │   │   ├── blink_rate_feature.py       # EAR-based blink detection
│   │   │   ├── head_movement_feature.py    # Pose tracking
│   │   │   ├── head_repetition_feature.py  # Oscillation detection
│   │   │   ├── hand_repetition_feature.py  # Stimming behavior detection
│   │   │   ├── gesture_detection_feature.py # Social gestures
│   │   │   └── expression_variability_feature.py  # Emotion entropy
│   │   ├── models/            # ML models
│   │   │   ├── questionnaire_predictor.py  # Trained model for questionnaire
│   │   │   ├── video_behavior_predictor.py # Weighted scoring for video
│   │   │   └── video_orchestrator.py       # Coordinates all feature extractors
│   │   └── *.pkl              # Trained model files
│   ├── main.py                # FastAPI entry point
│   ├── requirements.txt       # Python dependencies
│   ├── venv/                  # Python virtual environment
│   └── .env                   # Environment variables (not in git)
│
├── DEPLOYMENT.md              # Deployment instructions
├── ENDPOINT_SYNC_VERIFICATION.md  # Endpoint documentation
├── README.md                  # Main project documentation
└── setup_project.bat          # Project setup script

```

---

## Key Features Implemented

### 1. **Batch Video Processing**
- User records 3-4 minute video in browser
- Video uploaded to backend, forwarded to ML service
- Processed at 10 FPS logical rate
- 7 behavioral features extracted in parallel

### 2. **Simplified Output Format**
```javascript
{
  hand_stimming: {
    present: boolean,
    severity: "NORMAL" | "LOW" | "MODERATE" | "HIGH",
    description: string
  },
  head_movements: {
    present: boolean,
    repetitive: boolean,
    description: string
  },
  social_gestures: {
    present: boolean,
    frequency_per_minute: number,
    description: string
  },
  blink_rate: { blinks_per_minute: number, within_normal_range: boolean },
  eye_contact: { engagement_percentage: number, attention_score: number },
  expression_variability: { entropy: number, dominant_emotion: string }
}
```

### 3. **Enhanced PDF Report**
- Patient/Guardian information
- Questionnaire responses summary
- Video features summary (simplified indicators)
- **Detailed classification rationale**:
  - Lists specific concerning behaviors detected
  - Lists positive indicators observed
  - Explains classification logic
- Actionable recommendations for parents
- **Location-based hospital/therapy suggestions**

### 4. **Database Schema**
```javascript
{
  userId: ObjectId,
  childInfo: { name, age, gender },
  parentLocation: { city, state, country, postalCode },  // NEW
  questionnaireResponses: Array,
  liveVideoFeatures: {
    handStimming: { present, severity, description },  // SIMPLIFIED
    headMovements: { present, repetitive, description },  // SIMPLIFIED
    socialGestures: { present, frequency_per_minute, description },
    blinkRate: { blinks_per_minute, within_normal_range },
    eyeContact: { engagement_percentage, attention_score },
    expressionVariability: { entropy, dominant_emotion }
  },
  riskLevel: "low" | "medium" | "high",
  autismProbability: number,
  recommendations: Array,
  pdfUrl: string,
  createdAt: Date
}
```

---

## API Endpoints

### Backend (Node.js)
```
POST /api/screening/submit-questionnaire
  Body: { userId, childInfo, parentLocation, questionnaireResponses }
  Returns: { success, data: { ...screening } }

POST /api/screening/upload-video
  Body: FormData(video, userId, screeningId)
  Flow: Backend → ML Service → Database Update
  Returns: { success, message, pdfUrl, screening }

GET /api/screening/history/:userId
  Returns: { success, screenings: [...] }

GET /api/screening/:screeningId
  Returns: { success, screening: {...} }
```

### ML Service (Python)
```
POST /video/process-complete
  Body: { video_data (base64), screening_id }
  Returns: { video_features: {...}, autism_risk: {...} }

POST /predict/questionnaire
  Body: { questionnaire_data: [...] }
  Returns: { autism_probability, risk_level }

POST /predict/video-behavior
  Body: { video_features: {...} }  // Uses simplified field names
  Returns: { autism_probability, risk_level, feature_scores }
```

---

## Critical Implementation Details

### Timing Architecture
- **Single source of time**: `processed_count / 10.0` (10 FPS)
- No `time.time()` fallbacks in feature extractors
- Consistent timestamps across all modules

### Blink Detection Thresholds
```python
EAR_CLOSED_THRESHOLD = 0.22  # Was 0.15 (too strict)
EAR_OPEN_THRESHOLD = 0.24    # Was 0.20 (too strict)
MIN_BLINK_DURATION_MS = 80   # Was 100
```
- Adjusted based on observed EAR values (0.26-0.29 normal)

### Hand Stimming Severity Calculation
```python
if oscillations_per_minute < 10: "NORMAL"
elif oscillations_per_minute < 20: "LOW"
elif oscillations_per_minute < 30: "MODERATE"
else: "HIGH"
```

### Field Name Synchronization
**CRITICAL**: Backend and ML service must use consistent field names:
- ✅ `head_movements`, `hand_stimming`, `social_gestures`
- ❌ NOT `head_repetitive_movement`, `hand_repetitive_movement`

---

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/autism-screening
JWT_SECRET=your_secret_key
ML_SERVICE_URL=http://localhost:8000
```

### ML Service (.env)
```
GROQ_API_KEY=your_groq_api_key
```

---

## Dependencies

### Frontend
- react, react-dom, react-router-dom
- axios
- tailwindcss
- lucide-react (icons)

### Backend
- express, cors, dotenv
- mongodb, mongoose
- multer (file uploads)
- pdfkit (PDF generation)
- axios (ML service communication)
- bcrypt, jsonwebtoken (auth)

### ML Service
- fastapi, uvicorn
- opencv-python, mediapipe
- numpy, scipy
- pydantic, python-multipart
- groq (LLM API)

---

## Project Cleanup Status

### Removed Files (15 total)
**Frontend (4):**
- `frontend/src/components/test/` directory (old test components)
- `frontend/src/pages/TestEyeContact.jsx` (deprecated)
- `frontend/src/pages/TestGame1.jsx` (deprecated)
- `frontend/src/components/LiveVideoAnalysis.jsx` (old streaming component)

**Backend (1):**
- `backend/testGroqIntegration.js` (manual API test)

**ML Service (2):**
- `ml-service/services/behavior_analyzer.py` (unused)
- `ml-service/services/autism_predictor.py` (unused)

**Documentation (8):**
- CLEANUP_VERIFICATION.md
- ENDPOINT_ANALYSIS_REPORT.md
- ENHANCEMENTS_SUMMARY.md
- GROQ_SETUP_GUIDE.md
- QUICK_START_GROQ.md
- RESULTS_ENHANCEMENTS_SUMMARY.md
- SCREENING_HISTORY_IMPLEMENTATION.md
- QUICK_REFERENCE.txt

**Kept Documentation:**
- README.md (main project overview)
- DEPLOYMENT.md (deployment guide)
- ENDPOINT_SYNC_VERIFICATION.md (comprehensive endpoint reference)
- PROJECT_STRUCTURE.md (this file)

---

## Development Workflow

1. **Start MongoDB**: `mongod` (or MongoDB service)
2. **Start ML Service**: 
   ```bash
   cd ml-service
   venv\Scripts\activate  # Windows
   python main.py
   # Runs on http://localhost:8000
   ```
3. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   # Runs on http://localhost:5000
   ```
4. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   # Runs on http://localhost:5173
   ```

---

## Testing Checklist

- [ ] Record 3-minute video successfully
- [ ] ML service extracts all 7 features (no N/A values)
- [ ] Blink rate shows 10-25 blinks/min (not 0.67)
- [ ] Hand data shows severity (not empty `{}`)
- [ ] PDF generates with detailed classification section
- [ ] Location-based recommendations appear in PDF
- [ ] History page displays all past screenings

---

## Known Issues & Solutions

### Issue: N/A values in PDF
**Cause**: Feature extractors returning incomplete data  
**Solution**: Fixed timing architecture, adjusted thresholds

### Issue: Blink rate 0.67/min
**Cause**: EAR thresholds too strict (0.15/0.20)  
**Solution**: Adjusted to 0.22/0.24 based on observations

### Issue: Hand data empty `{}`
**Cause**: `time.time()` calls in `get_summary()`  
**Solution**: Use position history timestamps only

### Issue: Field name mismatch errors
**Cause**: Backend sending old field names to ML service  
**Solution**: Updated screeningController.js lines 226-243

---

## Future Enhancements

1. Frontend location collection UI (backend ready)
2. Real-time video processing status updates
3. Multi-language support
4. Mobile app version
5. Advanced analytics dashboard for practitioners

---

## Contact & Support

For questions or issues, refer to:
- ENDPOINT_SYNC_VERIFICATION.md (API reference)
- DEPLOYMENT.md (deployment guide)
- README.md (getting started)
