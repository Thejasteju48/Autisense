# Autisense - Complete Requirements & Dependencies

## Project Overview
Autisense is an intelligent web system for early detection of autism using dual assessment:
- **60%**: M-CHAT-R 20-item questionnaire (DSM-5 based)
- **40%**: AI video analysis of behavioral markers

---

## 🖥️ **Backend Service** (Port 5001)
**Framework**: Node.js + Express  
**Database**: MongoDB  
**File**: `backend/package.json`

### Core Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| **express** | ^4.18.2 | Web framework, routing, middleware |
| **mongoose** | ^7.5.0 | MongoDB ODM, database schema & validation |
| **jsonwebtoken** | ^9.0.2 | JWT authentication & token generation |
| **bcryptjs** | ^2.4.3 | Password hashing for user accounts |
| **cors** | ^2.8.5 | Cross-origin resource sharing |
| **axios** | ^1.5.0 | HTTP client for ML service communication |
| **groq-sdk** | ^0.37.0 | LLM API for screening interpretation |
| **multer** | ^1.4.5-lts.1 | Video file upload handling |
| **pdfkit** | ^0.13.0 | PDF report generation |
| **express-validator** | ^7.0.1 | Request validation & sanitization |
| **dotenv** | ^16.3.1 | Environment variable configuration |
| **form-data** | ^4.0.5 | Multipart form data handling |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| **nodemon** | ^3.0.1 | Auto-restart server during development |

### Installation
```bash
cd backend
npm install
```

### Running
```bash
# Development
npm run dev

# Production
npm start
```

---

## 🎥 **ML Service - Video Analysis** (Port 8000)
**Framework**: FastAPI (Python)  
**File**: `ml-service/requirements.txt`

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| **fastapi** | 0.104.1 | Modern async REST API framework |
| **uvicorn** | 0.24.0 | ASGI server for FastAPI |
| **pydantic** | 2.5.0 | Data validation & models |
| **python-multipart** | 0.0.6 | File upload handling |

### Computer Vision & MediaPipe
| Package | Version | Purpose |
|---------|---------|---------|
| **mediapipe** | 0.10.14 | Google's perception framework (468 face landmarks, 21 hand landmarks, 33 body landmarks) |
| **opencv-python** | 4.8.1.78 | Video processing & frame analysis |
| **numpy** | >=1.24,<2.0 | Numerical computing for landmark calculations |
| **pillow** | >=10.0.0 | Image processing utilities |

### Machine Learning & Data Science
| Package | Version | Purpose |
|---------|---------|---------|
| **scikit-learn** | 1.7.2 | Random Forest & Gradient Boosting models (ensemble predictions) |
| **pandas** | 2.2.3 | Data manipulation & analysis |
| **joblib** | 1.5.3 | Model serialization & persistence |

### Utilities & APIs
| Package | Version | Purpose |
|---------|---------|---------|
| **requests** | 2.32.5 | HTTP requests to external APIs |
| **python-dotenv** | 1.0.0 | Load .env configuration |
| **pydantic-settings** | 2.1.0 | Settings validation from environment |
| **groq** | Latest | LLM integration for symptom descriptions |
| **protobuf** | >=4.25.3,<5 | MediaPipe protocol buffer compatibility |
| **reportlab** | 4.2.5 | PDF report generation |

### Behavioral Markers Detected
1. **Eye Contact** - Gaze direction analysis (468 facial landmarks)
2. **Head Stimming** - Repetitive head movements (33 body landmarks + FFT periodicity)
3. **Hand Stimming** - Flapping/fidgeting patterns (21 hand landmarks per hand, velocity analysis)
4. **Hand Gesture** - Communicative vs. self-directed movements
5. **Social Reciprocity** - Body posture & engagement (full-body skeleton)
6. **Emotion Variation** - Facial expression diversity (entropy calculation)

### Installation
```bash
cd ml-service
pip install -r requirements.txt
```

### Running
```bash
python main.py
# Runs on http://localhost:8000
```

---

## 😊 **Emotion Service** (Port 8001)
**Framework**: FastAPI (Python)  
**File**: `emotion-service/requirements.txt`

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| **fastapi** | 0.104.1 | REST API framework |
| **uvicorn** | 0.24.0 | ASGI server |
| **pydantic** | 2.5.0 | Data validation |

### Computer Vision
| Package | Version | Purpose |
|---------|---------|---------|
| **opencv-python** | 4.12.0.88 | Video frame processing |
| **numpy** | >=2.0,<2.3 | Facial expression calculations |

### Deep Learning
| Package | Version | Purpose |
|---------|---------|---------|
| **torch** | 2.5.1 | PyTorch for emotion classification model |

### Features
- Facial expression recognition
- Emotion variation detection (joy, sadness, surprise, neutral)
- Real-time analysis

### Installation
```bash
cd emotion-service
pip install -r requirements.txt
```

### Running
```bash
python main.py
# Runs on http://localhost:8001
```

---

## 🎨 **Frontend** (Port 5173 dev / 3000 prod)
**Framework**: React + Vite  
**File**: `frontend/package.json`

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| **react** | ^18.2.0 | React library |
| **react-dom** | ^18.2.0 | React DOM rendering |
| **react-router-dom** | ^6.16.0 | Client-side routing |

### UI & Styling
| Package | Version | Purpose |
|---------|---------|---------|
| **tailwindcss** | ^3.3.3 | Utility-first CSS framework |
| **framer-motion** | ^10.16.4 | Animation & motion library |
| **@headlessui/react** | ^1.7.17 | Unstyled accessible components |
| **@heroicons/react** | ^2.0.18 | Icon library |

### Video & MediaPipe
| Package | Version | Purpose |
|---------|---------|---------|
| **react-webcam** | ^7.2.0 | Webcam integration |
| **@mediapipe/camera_utils** | ^0.3.1675466862 | Real-time camera input |
| **@mediapipe/face_mesh** | ^0.4.1633559619 | Live face landmark visualization |

### Data & API
| Package | Version | Purpose |
|---------|---------|---------|
| **axios** | ^1.5.0 | HTTP client |
| **recharts** | ^2.9.0 | Data visualization charts |

### Notifications
| Package | Version | Purpose |
|---------|---------|---------|
| **react-hot-toast** | ^2.4.1 | Toast notifications |

### Build Tools (Dev Dependencies)
| Package | Version | Purpose |
|---------|---------|---------|
| **vite** | ^4.4.9 | Lightning-fast build tool |
| **@vitejs/plugin-react** | ^4.0.4 | React plugin for Vite |
| **autoprefixer** | ^10.4.15 | CSS vendor prefixes |
| **postcss** | ^8.4.29 | CSS transformations |
| **@types/react** | ^18.2.22 | TypeScript definitions |
| **@types/react-dom** | ^18.2.7 | TypeScript definitions |

### Installation
```bash
cd frontend
npm install
```

### Running
```bash
# Development (Vite dev server)
npm run dev
# Runs on http://localhost:5173

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## 📋 **Environment Variables Required**

### Backend (.env)
```env
PORT=5001
MONGODB_URI=mongodb+srv://[user]:[password]@[cluster].mongodb.net/?appName=Cluster0
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
ML_SERVICE_URL=http://localhost:8000
GROQ_API_KEY=your_groq_api_key
NODE_ENV=development
```

### ML Service (.env)
```env
GROQ_API_KEY=your_groq_api_key
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5001
PORT=5173
```

### Emotion Service (.env)
```env
# Optional service-specific configs
```

---

## 🚀 **Full Stack Installation & Startup**

### Prerequisites
- **Node.js** >= 16.x
- **Python** >= 3.9
- **MongoDB** (cloud or local)
- **Git**

### Installation Steps

#### 1. Clone Repository
```bash
git clone https://github.com/Thejasteju48/Autisense.git
cd Autisense
```

#### 2. Setup Backend
```bash
cd backend
npm install
# Configure .env with MongoDB URI and API keys
npm run dev
```

#### 3. Setup ML Service
```bash
cd ml-service
pip install -r requirements.txt
python main.py
```

#### 4. Setup Emotion Service
```bash
cd emotion-service
pip install -r requirements.txt
python main.py
```

#### 5. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🔄 **Service Communication Flow**

```
Frontend (React)
    ↓ HTTP/Axios
Backend (Express)
    ↓ Axios HTTP calls
ML Service (FastAPI:8000)  ← Processes video (6 markers)
Emotion Service (FastAPI:8001) ← Facial expressions
    ↓
MongoDB ← Stores screening results
    ↓
Groq LLM API ← Generates interpretations
```

---

## 📊 **Data Flow: Screening Process**

1. **Child Registration** → User creates child profile
2. **Questionnaire** → 20-item M-CHAT-R (Yes/No) → ML prediction (0-100%)
3. **Video Upload** → 60-300 seconds → ML service analyzes
4. **Feature Extraction** → 6 markers detected from video
5. **Scoring** → `Final = (Questionnaire × 0.6) + (Video × 0.4)`
6. **Risk Classification** → Low (<40%), Moderate (40-70%), High (≥70%)
7. **Report Generation** → PDF with recommendations
8. **LLM Interpretation** → Groq API for detailed analysis

---

## 🧪 **Testing Commands**

```bash
# Test backend health
curl http://localhost:5001/health

# Test ML service
curl http://localhost:8000/health

# Test emotion service
curl http://localhost:8001/health
```

---

## 📦 **Dependency Summary**

**Total Packages:**
- **Backend**: 13 dependencies + 1 dev dependency
- **ML Service**: 19 dependencies
- **Emotion Service**: 7 dependencies
- **Frontend**: 12 dependencies + 6 dev dependencies

**Total Package Count**: ~58 packages

---

## 🔐 **Security Notes**

1. **Never commit `.env` files** - Use `.env.example` for reference
2. **Rotate JWT_SECRET** in production
3. **Use HTTPS** in production
4. **Secure MongoDB** with IP whitelist & strong passwords
5. **API Keys** should be environment variables only
6. **Video uploads** are validated (size, duration, format)

---

## 📝 **Version Information**

- **Node.js**: v16+
- **Python**: 3.9+
- **npm**: 8+
- **pip**: 21+

---

## 🤝 **Contributing**

When adding new dependencies:
1. Install with `npm i` or `pip install`
2. Update corresponding `package.json` or `requirements.txt`
3. Document the package purpose
4. Include version numbers (pinned for Python, ranges for Node)
5. Update this REQUIREMENTS.md file

---

## 📞 **Support**

For dependency issues:
- Check compatibility with existing versions
- Review service-specific requirements
- Test in isolation before integrating
