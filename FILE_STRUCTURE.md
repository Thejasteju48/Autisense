# 🗂️ Complete File Structure

```
AutismProject/
│
├── 📄 README.md                          # Main documentation (650+ lines)
├── 📄 QUICKSTART.md                      # Quick setup guide
├── 📄 API_EXAMPLES.md                    # API usage examples
├── 📄 DEPLOYMENT.md                      # Deployment instructions
├── 📄 PROJECT_SUMMARY.md                 # Project overview & stats
├── 📄 .gitignore                         # Git ignore rules
├── 📜 setup.sh                           # Unix setup script
├── 📜 setup.ps1                          # Windows setup script
│
├── 📁 backend/                           # Node.js + Express Backend
│   ├── 📄 package.json                   # Dependencies & scripts
│   ├── 📄 .env.example                   # Environment template
│   ├── 📄 server.js                      # Main entry point (100+ lines)
│   │
│   ├── 📁 controllers/                   # Business Logic Layer
│   │   ├── authController.js             # Auth operations (200+ lines)
│   │   ├── childController.js            # Child CRUD (150+ lines)
│   │   ├── screeningController.js        # Screening logic (300+ lines)
│   │   └── gameController.js             # Game sessions (150+ lines)
│   │
│   ├── 📁 models/                        # MongoDB Schemas
│   │   ├── User.js                       # Parent user model
│   │   ├── Child.js                      # Child profile model
│   │   ├── Screening.js                  # Screening results model
│   │   └── GameSession.js                # Game session model
│   │
│   ├── 📁 routes/                        # API Routes
│   │   ├── authRoutes.js                 # /api/auth/*
│   │   ├── childRoutes.js                # /api/children/*
│   │   ├── screeningRoutes.js            # /api/screenings/*
│   │   └── gameRoutes.js                 # /api/games/*
│   │
│   ├── 📁 middleware/                    # Express Middleware
│   │   ├── auth.js                       # JWT authentication
│   │   └── upload.js                     # File upload (Multer)
│   │
│   ├── 📁 utils/                         # Utility Functions
│   │   └── pdfGenerator.js               # PDF report generation (200+ lines)
│   │
│   └── 📁 uploads/                       # File Storage (gitignored)
│       ├── videos/
│       ├── audio/
│       ├── reports/
│       └── profiles/
│
├── 📁 ml-service/                        # Python + FastAPI ML Service
│   ├── 📄 requirements.txt               # Python dependencies
│   ├── 📄 .env.example                   # Environment template
│   ├── 📄 main.py                        # FastAPI app (150+ lines)
│   │
│   ├── 📁 services/                      # ML Services
│   │   ├── video_analyzer.py             # Video CV analysis (350+ lines)
│   │   │   ├── MediaPipe face mesh
│   │   │   ├── Eye contact detection
│   │   │   ├── Gesture tracking
│   │   │   ├── Repetitive behavior detection
│   │   │   └── Smile frequency
│   │   │
│   │   ├── audio_analyzer.py             # Audio analysis (150+ lines)
│   │   │   ├── Vocal activity detection
│   │   │   ├── Energy level calculation
│   │   │   └── Librosa features
│   │   │
│   │   └── autism_predictor.py           # ML prediction (250+ lines)
│   │       ├── Feature fusion
│   │       ├── Risk classification
│   │       └── Interpretation generation
│   │
│   ├── 📁 models/                        # ML Models (optional)
│   │   └── emotion_detector.h5           # CNN model (future)
│   │
│   └── 📁 uploads/                       # Temp storage (gitignored)
│       ├── videos/
│       └── audio/
│
└── 📁 frontend/                          # React + Tailwind Frontend
    ├── 📄 package.json                   # Dependencies & scripts
    ├── 📄 index.html                     # HTML template
    ├── 📄 vite.config.js                 # Vite configuration
    ├── 📄 tailwind.config.js             # Tailwind CSS config
    ├── 📄 postcss.config.js              # PostCSS config (auto-generated)
    │
    └── 📁 src/
        ├── 📄 main.jsx                   # React entry point
        ├── 📄 App.jsx                    # Main app component with routing
        ├── 📄 index.css                  # Global styles + Tailwind
        │
        ├── 📁 components/                # Reusable Components
        │   ├── Layout.jsx                # Main layout wrapper
        │   └── Navbar.jsx                # Navigation bar
        │
        ├── 📁 context/                   # React Context
        │   └── AuthContext.jsx           # Authentication state
        │
        ├── 📁 services/                  # API Integration
        │   └── api.js                    # Axios setup & endpoints (200+ lines)
        │       ├── authAPI
        │       ├── childrenAPI
        │       ├── screeningAPI
        │       └── gamesAPI
        │
        └── 📁 pages/                     # Page Components
            ├── Login.jsx                 # Login page (150+ lines)
            ├── Register.jsx              # Registration page (180+ lines)
            ├── Dashboard.jsx             # Main dashboard (250+ lines)
            │   ├── Children list
            │   ├── Latest screenings
            │   └── Quick actions
            │
            ├── AddChild.jsx              # Add child form (200+ lines)
            ├── ChildProfile.jsx          # Child details (150+ lines)
            │
            ├── Screening.jsx             # Screening flow (300+ lines)
            │   ├── Video upload
            │   ├── Audio upload
            │   └── Questionnaire
            │
            ├── ScreeningResults.jsx      # Results display (200+ lines)
            │   ├── Risk visualization
            │   ├── Feature insights
            │   ├── Recommendations
            │   └── PDF download
            │
            ├── Games.jsx                 # Interactive games (200+ lines)
            │   ├── Game selection
            │   └── Game interface
            │
            └── History.jsx               # Screening history (180+ lines)
                ├── Historical list
                └── Trend chart
```

---

## 📊 File Statistics

### Backend (Node.js)
- **Total Files**: 20+
- **Total Lines**: ~3,000
- **Key Files**:
  - `server.js`: 100 lines
  - Controllers: 800 lines total
  - Models: 400 lines total
  - Routes: 300 lines total
  - Middleware: 200 lines total
  - Utils: 200 lines total

### ML Service (Python)
- **Total Files**: 5+
- **Total Lines**: ~1,200
- **Key Files**:
  - `main.py`: 150 lines
  - `video_analyzer.py`: 350 lines
  - `audio_analyzer.py`: 150 lines
  - `autism_predictor.py`: 250 lines

### Frontend (React)
- **Total Files**: 20+
- **Total Lines**: ~4,000
- **Key Files**:
  - `App.jsx`: 50 lines
  - Components: 200 lines total
  - Context: 100 lines total
  - Services: 200 lines total
  - Pages: 1,800 lines total
  - Styles: 150 lines total

### Documentation
- **Total Files**: 5
- **Total Lines**: ~2,000
- **Files**:
  - `README.md`: 650 lines
  - `QUICKSTART.md`: 100 lines
  - `API_EXAMPLES.md`: 400 lines
  - `DEPLOYMENT.md`: 500 lines
  - `PROJECT_SUMMARY.md`: 350 lines

---

## 🎯 Key Entry Points

### Development
1. **Start Backend**: `backend/server.js`
2. **Start ML Service**: `ml-service/main.py`
3. **Start Frontend**: `frontend/src/main.jsx` → `App.jsx`

### API Endpoints
- **Backend**: `backend/routes/*.js`
- **ML Service**: `ml-service/main.py` endpoints

### User Interface
- **Login Flow**: `frontend/src/pages/Login.jsx` → `Register.jsx`
- **Main Flow**: `Dashboard.jsx` → `Screening.jsx` → `ScreeningResults.jsx`
- **Games**: `Games.jsx`
- **History**: `History.jsx`

---

## 🔍 Quick Navigation Guide

### Want to modify authentication?
→ `backend/controllers/authController.js`  
→ `backend/middleware/auth.js`  
→ `frontend/src/context/AuthContext.jsx`

### Want to change video analysis?
→ `ml-service/services/video_analyzer.py`

### Want to update the dashboard?
→ `frontend/src/pages/Dashboard.jsx`

### Want to add new game?
→ `frontend/src/pages/Games.jsx`  
→ `backend/controllers/gameController.js`

### Want to modify screening flow?
→ `frontend/src/pages/Screening.jsx`  
→ `backend/controllers/screeningController.js`

### Want to change PDF report?
→ `backend/utils/pdfGenerator.js`

---

## 🎨 Styling Files

- **Tailwind Config**: `frontend/tailwind.config.js`
- **Global Styles**: `frontend/src/index.css`
- **Component Styles**: Inline Tailwind classes

---

## 🔧 Configuration Files

### Backend
- `package.json` - Dependencies
- `.env` - Environment variables
- `server.js` - Main config

### ML Service
- `requirements.txt` - Dependencies
- `.env` - Environment variables
- `main.py` - FastAPI config

### Frontend
- `package.json` - Dependencies
- `vite.config.js` - Build config
- `tailwind.config.js` - Styling config

---

## 📝 Important Notes

1. **Environment Files**: Always use `.env.example` as template
2. **Uploads Folder**: Created automatically, git-ignored
3. **Virtual Environment**: ML service uses `venv/` directory
4. **Node Modules**: Each service has its own `node_modules/`
5. **Build Output**: Frontend creates `dist/` for production

---

## 🚀 Where to Start?

1. **New to project?** → Read `README.md`
2. **Want to run it?** → Read `QUICKSTART.md`
3. **Exploring APIs?** → Read `API_EXAMPLES.md`
4. **Ready to deploy?** → Read `DEPLOYMENT.md`
5. **Need overview?** → Read `PROJECT_SUMMARY.md`
6. **Navigating code?** → You're reading it! 📖

---

**Happy coding! 🎉**
