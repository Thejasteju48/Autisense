# Autisense

**An Intelligent Web System for Early Detection of Autism**

A comprehensive full-stack web application for early autism screening in children aged 12-72 months (1-6 years). Autisense combines AI-powered video analysis, interactive games, and behavioral assessments to provide parents with insights about their child's development.

## ⚠️ Important Disclaimer

**This application is for SCREENING PURPOSES ONLY and is NOT a diagnostic tool.** It should NOT be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult qualified healthcare professionals or developmental pediatricians for any concerns about your child's development.

---

## 🎯 Project Overview

This application provides:
- **Video Analysis**: Uses MediaPipe and OpenCV to detect eye contact, gestures, repetitive behaviors, and facial expressions
- **Audio Analysis**: Analyzes vocal activity patterns using librosa
- **Behavioral Questionnaire**: 10 autism-relevant questions for parents
- **ML-Based Prediction**: Combines all inputs to generate autism likelihood score
- **Child-Friendly Games**: Interactive activities to support development
- **Progress Tracking**: History of screenings with trend visualization
- **PDF Reports**: Downloadable comprehensive screening reports

---

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │ (Port 3000)
│  Tailwind CSS   │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│ Express Backend │ (Port 5000)
│  JWT Auth       │
│  MongoDB        │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  FastAPI ML     │ (Port 8000)
│  MediaPipe      │
│  TensorFlow     │
│  OpenCV         │
└─────────────────┘
```

---

## 📁 Project Structure

```
AutismProject/
├── backend/                    # Node.js + Express Server
│   ├── controllers/           # Business logic
│   │   ├── authController.js
│   │   ├── childController.js
│   │   ├── screeningController.js
│   │   └── gameController.js
│   ├── models/               # MongoDB schemas
│   │   ├── User.js
│   │   ├── Child.js
│   │   ├── Screening.js
│   │   └── GameSession.js
│   ├── routes/               # API routes
│   │   ├── authRoutes.js
│   │   ├── childRoutes.js
│   │   ├── screeningRoutes.js
│   │   └── gameRoutes.js
│   ├── middleware/           # Auth & upload middleware
│   │   ├── auth.js
│   │   └── upload.js
│   ├── utils/                # Utilities
│   │   └── pdfGenerator.js
│   ├── server.js             # Entry point
│   ├── package.json
│   └── .env.example
│
├── ml-service/                # Python FastAPI Service
│   ├── services/             # ML services
│   │   ├── video_analyzer.py
│   │   ├── audio_analyzer.py
│   │   └── autism_predictor.py
│   ├── main.py               # FastAPI app
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                  # React Application
    ├── src/
    │   ├── components/       # Reusable components
    │   │   ├── Layout.jsx
    │   │   └── Navbar.jsx
    │   ├── context/          # React context
    │   │   └── AuthContext.jsx
    │   ├── pages/            # Page components
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── AddChild.jsx
    │   │   ├── ChildProfile.jsx
    │   │   ├── Screening.jsx
    │   │   ├── ScreeningResults.jsx
    │   │   ├── Games.jsx
    │   │   └── History.jsx
    │   ├── services/         # API services
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (v5.0 or higher)

### Installation

#### 1. Backend Setup

```bash
cd backend
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your configuration:
# 1. Set MONGODB_URI to your MongoDB Atlas connection string
# 2. Generate a secure JWT_SECRET (use: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
# 3. Update ML_SERVICE_URL if needed
```

**Required Environment Variables:**
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - A secure random string (64+ characters)
- `ML_SERVICE_URL` - URL of the ML service (default: http://localhost:8000)

See [SECURITY.md](SECURITY.md) for detailed setup instructions.

#### 2. ML Service Setup

```bash
cd ml-service

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Edit .env and add your GROQ API key
# Get your API key from: https://console.groq.com
```

**Required Environment Variables:**
- `GROQ_API_KEY` - Your GROQ API key for AI predictions

See [SECURITY.md](SECURITY.md) for detailed setup instructions.

#### 3. Frontend Setup

```bash
cd frontend
npm install

# No .env needed (configured in vite.config.js)
```

---

## 🏃 Running the Application

### Terminal 1: Start MongoDB
```bash
# Make sure MongoDB is running
mongod
```

### Terminal 2: Start Backend
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

### Terminal 3: Start ML Service
```bash
cd ml-service
python main.py
# Service runs on http://localhost:8000
```

### Terminal 4: Start Frontend
```bash
cd frontend
npm run dev
# Application runs on http://localhost:3000
```

---

## 🔐 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phoneNumber": "+1234567890"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Children Endpoints

#### Get All Children
```http
GET /api/children
Authorization: Bearer <token>
```

#### Add Child
```http
POST /api/children
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "name": "Emma Smith",
  "nickname": "Emmy",
  "ageInMonths": 36,
  "gender": "female",
  "profileImage": <file>
}
```

### Screening Endpoints

#### Start Screening
```http
POST /api/screenings/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "childId": "child_id_here"
}
```

#### Analyze Video
```http
POST /api/screenings/:screeningId/video
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "video": <file>
}
```

#### Complete Screening
```http
POST /api/screenings/:screeningId/complete
Authorization: Bearer <token>
```

---

## 🧠 ML Service Endpoints

### Video Analysis
```http
POST /analyze/video
Content-Type: multipart/form-data

{
  "video": <file>
}

Response:
{
  "eyeContactRatio": 0.65,
  "gestureFrequency": 5.2,
  "repetitiveBehaviorRatio": 0.15,
  "smileFrequency": 3.1
}
```

### Audio Analysis
```http
POST /analyze/audio
Content-Type: multipart/form-data

{
  "audio": <file>
}

Response:
{
  "vocalActivityRatio": 0.45,
  "energyLevel": 0.05
}
```

### Autism Prediction
```http
POST /predict/autism
Content-Type: application/json

{
  "videoFeatures": {...},
  "audioFeatures": {...},
  "questionnaireScore": 0.4
}

Response:
{
  "autismProbability": 35.5,
  "riskLevel": "Moderate",
  "interpretation": {...}
}
```

---

## 🎮 Interactive Games

The application includes 4 child-friendly games:

1. **Follow the Friend** (Eye Contact) 👀
   - Helps practice eye contact and attention
   - Bright colors and friendly characters

2. **Copy the Dance** (Imitation) 💃
   - Encourages movement imitation
   - Fun animations and music

3. **Happy Faces** (Emotion Matching) 😊
   - Teaches emotion recognition
   - Simple and engaging interface

4. **Wave Hello** (Gesture Mimic) 👋
   - Practices social gestures
   - Positive reinforcement

---

## 📊 Features Explained

### Video Analysis Features

1. **Eye Contact Ratio** (0-1)
   - Measures proportion of time making eye contact
   - Uses iris position relative to eye center
   - Lower ratios may indicate autism characteristics

2. **Gesture Frequency** (per minute)
   - Counts significant body movements
   - Tracks hand, arm, and body gestures
   - Very low or very high can be indicators

3. **Repetitive Behavior Ratio** (0-1)
   - Detects repeating movement patterns
   - Uses pose sequence similarity
   - Higher ratios indicate more repetitive behaviors

4. **Smile Frequency** (per minute)
   - Counts facial expressions indicating happiness
   - Uses mouth geometry analysis
   - Lower frequency may indicate reduced social engagement

### Audio Analysis Features

1. **Vocal Activity Ratio** (0-1)
   - Proportion of audio with voice activity
   - Uses energy-based detection
   - Low ratios may indicate communication delays

2. **Energy Level**
   - Average RMS energy of vocal segments
   - Very low or very high can be indicators

### Questionnaire

10 carefully selected questions covering:
- Social interaction
- Communication patterns
- Repetitive behaviors
- Sensory sensitivities
- Emotional responses

---

## 🎨 UI/UX Design Principles

### Autism-Friendly Design
- **Soft, calming colors** - Blues, purples, pinks, greens
- **Large, rounded buttons** - Easy to tap/click
- **Minimal text** - Clear, simple language
- **Smooth animations** - Non-jarring transitions
- **High contrast** - Easy to read
- **Consistent layout** - Predictable navigation
- **No overwhelming stimuli** - Gentle interface

### Accessibility Features
- WCAG 2.1 AA compliant color contrasts
- Keyboard navigation support
- Screen reader friendly
- Clear focus indicators
- Error messages with icons

---

## 📈 Scoring Algorithm

The final autism likelihood score is calculated as:

```
Final Score = (Video Score × 0.45) + (Audio Score × 0.20) + (Questionnaire Score × 0.35)
```

### Risk Levels
- **Low Risk**: 0-29%
- **Moderate Risk**: 30-59%
- **High Risk**: 60-100%

### Interpretation Logic
The system provides feature-wise interpretation:
- Video insights (eye contact, gestures, repetitive behaviors)
- Audio insights (vocal activity, energy levels)
- Questionnaire insights (parental observations)
- Personalized recommendations based on risk level

---

## 🔒 Security Features

### Authentication
- JWT-based authentication
- Password hashing with bcryptjs (12 rounds)
- Protected API routes
- Token expiration (7 days default)

### Data Protection
- Input validation on all endpoints
- File type validation for uploads
- File size limits (100MB videos, 50MB audio)
- SQL injection prevention (MongoDB)
- XSS protection

### Privacy
- User data isolation (parent can only access their own children)
- Secure file storage
- No data sharing with third parties

---

## 🧪 Testing Recommendations

### Backend Testing
```bash
# Add test framework
npm install --save-dev jest supertest

# Test authentication
# Test CRUD operations
# Test file uploads
# Test ML service integration
```

### Frontend Testing
```bash
# Add testing libraries
npm install --save-dev @testing-library/react vitest

# Test components
# Test user flows
# Test API integration
```

### ML Service Testing
```python
# Test video analysis with sample videos
# Test audio analysis with sample audio
# Test prediction accuracy
# Test edge cases (corrupted files, etc.)
```

---

## 🚀 Deployment

### Backend Deployment (Heroku/Railway)
1. Set environment variables
2. Configure MongoDB Atlas
3. Deploy using Git

### Frontend Deployment (Vercel/Netlify)
1. Build production bundle: `npm run build`
2. Deploy dist folder
3. Configure environment variables

### ML Service Deployment (Render/AWS)
1. Create Dockerfile
2. Set up GPU instance (recommended)
3. Deploy container

---

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/autism_screening
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
ML_SERVICE_URL=http://localhost:8000
NODE_ENV=development
```

### ML Service (.env)
```env
PORT=8000
HOST=0.0.0.0
UPLOAD_DIR=./uploads
MODEL_DIR=./models
```

---

## 📝 Future Enhancements

1. **Advanced ML Models**
   - Train custom CNN for emotion detection
   - Implement attention mechanisms
   - Add speech analysis (prosody, intonation)

2. **Additional Features**
   - Multi-language support
   - Real-time video screening
   - Mobile app (React Native)
   - Therapist dashboard
   - Progress tracking analytics

3. **Integrations**
   - Healthcare provider APIs
   - Appointment scheduling
   - Telemedicine integration

4. **Enhanced Games**
   - More game varieties
   - Difficulty levels
   - Adaptive gameplay
   - Multiplayer options

---

## 🤝 Contributing

This is a production-ready application. For contributions:
1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Submit pull requests

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👥 Support

For questions or issues:
- Check documentation
- Review error logs
- Contact support team

---

## 🙏 Acknowledgments

- MediaPipe team for face and pose detection
- librosa developers for audio analysis tools
- React and Express communities
- Autism research community

---

**Built with ❤️ for early intervention and child development support**
