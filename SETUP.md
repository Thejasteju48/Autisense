# AutiSense - Complete Project Setup & Installation Guide

**AutiSense** is an Intelligent Web System for Early Detection of Autism using AI-powered screening analysis combined with video behavioral assessment, PDF report generation, and location-based center recommendations.

---

## 📋 Project Overview

This is a **full-stack application** with the following components:

| Component | Technology | Port | Purpose |
|-----------|-----------|------|---------|
| **Backend API** | Node.js + Express | 5000 | REST API for authentication, screening, reports |
| **Frontend App** | React + Vite | 5173 | User interface for registration & screening |
| **ML Service** | Python + FastAPI | 8000 | Video analysis, hand/face/body gesture detection |
| **Emotion Service** | Python + FastAPI | 8001 | Facial expression analysis for emotion variation |
| **Database** | MongoDB | 27017 | User data, screening results, reports |

---

## 🛠️ System Requirements

### Minimum System Specifications
- **OS**: Windows 10+ / macOS / Linux
- **RAM**: 8 GB (16 GB recommended for ML models)
- **Storage**: ~10 GB free space
- **CPU**: Intel i5/AMD Ryzen 5 or better

### Required Software (Install First)

1. **Node.js & npm** (v16+)
   - Download: https://nodejs.org/ (LTS version)
   - Verify: `node --version` and `npm --version`

2. **Python** (v3.9+)
   - Download: https://www.python.org/downloads/
   - Verify: `python --version`
   - Ensure pip is installed: `pip --version`

3. **MongoDB Community Edition**
   - **Windows/macOS**: Download from https://www.mongodb.com/try/download/community
   - **Linux**: `sudo apt-get install -y mongodb-org`
   - Verify MongoDB is running: `mongo --version`
   - **MongoDB Service**: Ensure it's running (Windows Services / macOS: `brew services` / Linux: `systemctl`)

4. **Git** (optional, for version control)
   - Download: https://git-scm.com/downloads
   - Verify: `git --version`

---

## 📦 Complete Project Dependencies

### Backend (Node.js)
```json
{
  "express": "^4.18.2",          // Web framework
  "mongoose": "^7.5.0",          // MongoDB ODM
  "bcryptjs": "^2.4.3",          // Password hashing
  "jsonwebtoken": "^9.0.2",      // JWT authentication
  "cors": "^2.8.5",              // CORS middleware
  "dotenv": "^16.3.1",           // Environment variables
  "axios": "^1.5.0",             // HTTP client
  "groq-sdk": "^0.37.0",         // Groq AI API
  "pdfkit": "^0.13.0",           // PDF generation
  "multer": "^1.4.5",            // File uploads
  "express-validator": "^7.0.1", // Input validation
  "form-data": "^4.0.5",         // Form data handling
  "nodemon": "^3.0.1"            // Dev: Auto-reload
}
```

### Frontend (React + Vite)
```json
{
  "react": "^18.2.0",                        // React framework
  "react-dom": "^18.2.0",                    // React DOM
  "react-router-dom": "^6.16.0",             // Routing
  "axios": "^1.5.0",                         // HTTP client
  "tailwindcss": "^3.3.3",                   // Styling
  "framer-motion": "^10.16.4",               // Animations
  "react-hot-toast": "^2.4.1",               // Notifications
  "react-webcam": "^7.2.0",                  // Webcam access
  "@mediapipe/camera_utils": "^0.3.1",      // MediaPipe utilities
  "@mediapipe/face_mesh": "^0.4.1",         // Face detection
  "recharts": "^2.9.0",                      // Data visualization
  "@headlessui/react": "^1.7.17",            // UI components
  "@heroicons/react": "^2.0.18",             // Icons
  "vite": "^4.4.9"                           // Build tool
}
```

### ML Service (Python)
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-multipart==0.0.6
mediapipe==0.10.14
opencv-python==4.8.1.78
numpy>=1.24,<2.0
Pillow>=10.0.0
pandas==2.2.3
scikit-learn==1.7.2
joblib==1.5.3
requests==2.32.5
python-dotenv==1.0.0
pydantic-settings==2.1.0
groq
protobuf>=4.25.3,<5
reportlab==4.2.5
```

### Emotion Service (Python)
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
opencv-python==4.12.0.88
numpy>=2.0,<2.3
torch==2.5.1
```

---

## 🔐 Environment Variables (Private - Never Commit)

The following files should **NEVER be committed to GitHub**. They are in `.gitignore`:

### Backend: `backend/.env`
```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/autism_screening

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# API Configuration
PORT=5000
NODE_ENV=development

# External APIs
GROQ_API_KEY=your_groq_api_key_here        # Get from https://www.groq.com
ML_SERVICE_URL=http://localhost:8000       # ML service URL
```

### ML Service: `ml-service/.env`
```bash
PORT=8000
HOST=0.0.0.0
UPLOAD_DIR=./uploads
MODEL_DIR=./models
GROQ_API_KEY=your_groq_api_key_here        # Same Groq key as backend
```

### Frontend: `frontend/.env`
```bash
VITE_API_URL=http://localhost:5001/api     # Backend API URL (note: port 5001 for dev)
VITE_BACKEND_URL=http://localhost:5001     # Backend base URL
VITE_ML_URL=http://localhost:8000          # ML service URL
```

**⚠️ IMPORTANT:**
- Never share or commit `.env` files
- Use `.env.example` files as templates
- Generate new JWT_SECRET for production
- Obtain GROQ_API_KEY from https://www.groq.com (free tier available)

---

## 🚀 Complete Installation & Setup Instructions

### Step 1: Clone & Navigate to Project

```bash
# If cloning from GitHub
git clone https://github.com/yourusername/autism-screening-app.git
cd autism-screening-app

# OR if already in project directory
cd /path/to/AutismProject
```

### Step 2: Verify Prerequisites

```bash
# Check Node.js
node --version
npm --version

# Check Python
python --version
pip --version

# Check MongoDB
# Windows: Services → MongoDB
# macOS: brew services list | grep mongodb
# Linux: systemctl status mongod
# Or simply: mongod --version
```

### Step 3: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file from template
# Copy backend/.env.example to backend/.env and update with your credentials
copy .env.example .env    # Windows
# OR
cp .env.example .env      # macOS/Linux

# Update the .env file with:
# - MongoDB URI (if not local)
# - Unique JWT_SECRET
# - Your GROQ_API_KEY from https://www.groq.com

# Start backend development server
npm run dev         # Uses nodemon for auto-reload
# OR for production
npm start

# Expected output:
# Server is running on port 5000
# Connected to MongoDB
```

**Backend runs on:** `http://localhost:5000`

---

### Step 4: Setup Frontend

```bash
# Open new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file
copy .env.example .env    # Windows
# OR
cp .env.example .env      # macOS/Linux

# Start development server with Vite
npm run dev

# Expected output:
# VITE v4.4.9 ready in 234ms
# Local: http://localhost:5173/
```

**Frontend runs on:** `http://localhost:5173`

---

### Step 5: Setup ML Service (Python)

```bash
# Open new terminal
cd ml-service

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env    # Windows
# OR
cp .env.example .env      # macOS/Linux

# Update with MongoDB/Groq details if needed

# Start ML service
python main.py

# Expected output:
# INFO: Started server process [12345]
# INFO: Uvicorn running on http://0.0.0.0:8000
```

**ML Service runs on:** `http://localhost:8000`

---

### Step 6: Setup Emotion Service (Python)

```bash
# Open new terminal
cd emotion-service

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Note: Emotion service doesn't require .env setup (no API keys needed)

# Start emotion service
python main.py

# Expected output:
# INFO: Started server process [12345]
# INFO: Uvicorn running on http://0.0.0.0:8001
```

**Emotion Service runs on:** `http://localhost:8001`

---

### Step 7: Verify All Services are Running

Once all services are started, verify them:

```bash
# Backend
curl http://localhost:5000/health      # If health endpoint exists

# Frontend
# Open browser: http://localhost:5173

# ML Service
curl http://localhost:8000/docs        # FastAPI docs

# Emotion Service
curl http://localhost:8001/docs        # FastAPI docs

# MongoDB
# macOS:
brew services list
# Windows: Check Services.msc
# Linux:
systemctl status mongod
```

---

## 📝 Using Automated Setup Scripts

The project includes helper scripts for Windows and Unix systems:

### Windows PowerShell
```powershell
# One command to start all services
.\start-all-services.ps1

# Or with interactive setup
.\setup-interactive.ps1
```

### macOS/Linux
```bash
# One command to start all services
bash start-all-services.sh
```

---

## 🌐 Access the Application

Once all services are running:

1. **Frontend (User Interface)**: Open browser → `http://localhost:5173`
2. **Backend API**: `http://localhost:5000`
3. **ML Service Docs**: `http://localhost:8000/docs`
4. **Emotion Service Docs**: `http://localhost:8001/docs`

### Typical Workflow

1. **Register Parent/Guardian**: Fill form with name, email, location (city, state, country)
2. **Add Child**: Create child profile with name, age, gender, DOB
3. **Start Screening**: Answer behavioral questionnaire
4. **Video Assessment**: Record child behavioral video (30 seconds)
5. **View Results**: Get AI screening report with:
   - Risk score (low/medium/high)
   - Per-indicator AI explanations (Groq LLM)
   - Suggested nearby autism centers (OpenStreetMap)
6. **Download Report**: PDF medical report (hospital-style format)

---

## 🛑 Troubleshooting

### MongoDB Connection Error
```
MongoError: connect ECONNREFUSED
```
**Solution**: Start MongoDB service
- Windows: `Services.msc` → Start MongoDB
- macOS: `brew services start mongodb-community`
- Linux: `sudo systemctl start mongod`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Kill process on port
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Python Virtual Environment Issues
```bash
# Deactivate current env
deactivate

# Remove old env
rm -rf venv
# OR Windows: rmdir /s venv

# Recreate
python -m venv venv
```

### API Key Issues
```
Error: GROQ_API_KEY not found
```
**Solution**: 
1. Get free API key from https://www.groq.com
2. Add to `backend/.env` and `ml-service/.env`
3. Restart services

### Mongoose/MongoDB Version Mismatch
```bash
# Update MongoDB driver
npm install mongoose@latest
```

---

## 📦 Project Structure

```
autism-screening-app/
├── backend/                          # Node.js + Express API
│   ├── controllers/                  # API logic
│   ├── models/                       # MongoDB schemas
│   ├── services/                     # External APIs (Groq, OSM, PDF)
│   ├── routes/                       # API endpoints
│   ├── middleware/                   # Auth, validation
│   ├── .env                          # ⚠️ PRIVATE - Never commit
│   ├── .env.example                  # Template
│   ├── package.json                  # Node dependencies
│   └── server.js                     # Main entry point
│
├── frontend/                         # React + Vite
│   ├── src/
│   │   ├── pages/                    # React pages
│   │   ├── components/               # React components
│   │   ├── services/                 # API client
│   │   └── App.jsx                   # Main component
│   ├── .env                          # ⚠️ PRIVATE - Never commit
│   ├── .env.example                  # Template
│   ├── package.json                  # React dependencies
│   └── vite.config.js               # Build config
│
├── ml-service/                       # Python FastAPI
│   ├── services/                     # Video analysis
│   ├── models/                       # ML models
│   ├── .env                          # ⚠️ PRIVATE - Never commit
│   ├── .env.example                  # Template
│   ├── requirements.txt              # Python dependencies
│   └── main.py                       # Entry point
│
├── emotion-service/                  # Python FastAPI
│   ├── analysis/                     # Facial expression analysis
│   ├── requirements.txt              # Python dependencies
│   └── main.py                       # Entry point
│
├── .env                              # ⚠️ Root .env (rarely used)
├── .gitignore                        # Files NOT to commit
├── SETUP.md                          # This file
└── README.md                         # Project overview
```

---

## 🔒 Security Best Practices

### For Development
1. ✅ Use `.env` files locally (never commit)
2. ✅ Use `.env.example` for templates
3. ✅ Change JWT_SECRET from default
4. ✅ Keep API keys private
5. ✅ Use environment-specific settings

### For Production
1. Set all environment variables in hosting platform (Heroku, AWS, etc.)
2. Use strong `JWT_SECRET` (minimum 32 characters)
3. Enable HTTPS/SSL
4. Use production MongoDB Atlas (not local)
5. Implement rate limiting
6. Enable CORS only for trusted domains
7. Rotate API keys regularly

---

## 🚀 Deployment

### Backend Deployment (Heroku/AWS) Example
```bash
# Set environment variables
heroku config:set MONGODB_URI=...
heroku config:set JWT_SECRET=...
heroku config:set GROQ_API_KEY=...

# Deploy
git push heroku main
```

### Frontend Deployment (Vercel/Netlify) Example
```bash
# Build frontend
cd frontend
npm run build

# Deploy to Vercel/Netlify
# Or push to GitHub and auto-deploy
```

---

## 📞 Support & Debugging

### Enable Debug Logging
```bash
# Backend
NODE_ENV=development npm run dev

# ML Service
# Check logs in terminal output
```

### Check Service Health
```bash
# Backend health check
curl http://localhost:5000/api/health

# Database connection
# In backend terminal, should see: "Connected to MongoDB"
```

### View System Logs

**Windows**:
- PowerShell: Check error messages in terminal output
- Event Viewer: `eventvwr.msc`

**macOS/Linux**:
```bash
# System logs
dmesg

# Service logs
journalctl -u mongodb
journalctl -u nodejs
```

---

## ✅ Verification Checklist

After setup, verify all components:

- [ ] MongoDB running locally
- [ ] Backend (`npm run dev`) starts without errors
- [ ] Frontend (`npm run dev`) loads at http://localhost:5173
- [ ] ML Service (`python main.py`) runs at port 8000
- [ ] Emotion Service (`python main.py`) runs at port 8001
- [ ] Can access FastAPI docs at `localhost:8000/docs`
- [ ] Can access FastAPI docs at `localhost:8001/docs`
- [ ] Backend connects to MongoDB successfully
- [ ] GROQ_API_KEY is set in backend/.env
- [ ] Registration form loads in browser
- [ ] Can create new user account
- [ ] Can add child profile
- [ ] Screening questionnaire functions
- [ ] Video recording feature works
- [ ] Can generate and download PDF report
- [ ] All services restart cleanly

---

## 📚 Additional Resources

- **Node.js Setup**: https://nodejs.org/en/docs/
- **Python Venv**: https://docs.python.org/3/tutorial/venv.html
- **MongoDB Setup**: https://docs.mongodb.com/manual/installation/
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Vite**: https://vitejs.dev/
- **Groq API**: https://www.groq.com
- **Express.js**: https://expressjs.com/
- **Mongoose**: https://mongoosejs.com/

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Contributing

To contribute to this project:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open Pull Request

**Important**: Never commit `.env` files with real API keys!

---

**Last Updated**: March 2026
**Version**: 1.0.0
