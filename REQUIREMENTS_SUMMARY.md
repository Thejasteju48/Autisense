# 📦 Complete Project Requirements & Dependencies

This document lists **every single requirement** needed to run the AutiSense project.

---

## 🖥️ System Requirements

### Hardware
- **Processor**: Intel i5/AMD Ryzen 5 or better (for ML video processing)
- **RAM**: Minimum 8 GB (16 GB recommended)
- **Storage**: At least 10 GB free space
- **GPU**: Optional (PyTorch will use CPU if GPU unavailable)

### Operating System
- Windows 10 or newer
- macOS 10.14 or newer
- Ubuntu 18.04 or newer
- Any Linux distribution with Python 3.9+

---

## 🔧 Required Software (Downloads)

| Software | Version | Purpose | Download |
|----------|---------|---------|----------|
| **Node.js** | v16+ (LTS) | JavaScript runtime for backend | https://nodejs.org/ |
| **npm** | v7+ (comes with Node) | JavaScript package manager | Included with Node.js |
| **Python** | v3.9 or v3.10 | Python interpreter for ML services | https://www.python.org/ |
| **pip** | v21+ (comes with Python) | Python package manager | Included with Python |
| **MongoDB** | v5.0+ | NoSQL database | https://www.mongodb.com/try/download/community |
| **Git** | v2.30+ | Version control (optional) | https://git-scm.com/downloads |

### Installation Verification
```bash
# Check installations
node --version         # Should show v16.0.0 or higher
npm --version          # Should show v7.0.0 or higher
python --version       # Should show Python 3.9+
pip --version          # Should show pip 21.0 or higher
mongo --version        # Should show MongoDB version 5.0+
git --version          # Should show git version 2.30+
```

---

## 📚 Backend Node.js Dependencies

### Production Dependencies (Required for Runtime)

```
express@4.18.2                    # Web framework for API
mongoose@7.5.0                    # MongoDB object modeling
jsonwebtoken@9.0.2                # JWT token generation/validation
bcryptjs@2.4.3                    # Password hashing/encryption
cors@2.8.5                        # Cross-Origin Resource Sharing
dotenv@16.3.1                     # Environment variable management
axios@1.5.0                       # HTTP client for API calls
groq-sdk@0.37.0                   # Groq LLM integration
pdfkit@0.13.0                     # PDF generation (hospital-style reports)
multer@1.4.5-lts.1               # File upload handling
express-validator@7.0.1           # Input validation
form-data@4.0.5                   # HTTP form data
```

### Development Dependencies (Optional, for development only)

```
nodemon@3.0.1                     # Auto-reload on file changes
```

### Installation Command
```bash
cd backend
npm install
```

### Package Lock
- **File**: `backend/package-lock.json`
- **Purpose**: Locks exact dependency versions for reproducibility
- **Should be committed**: YES
- **Action**: Do not modify manually

---

## 🎨 Frontend React + Vite Dependencies

### Production Dependencies

```
react@18.2.0                      # React framework
react-dom@18.2.0                  # React DOM rendering
react-router-dom@6.16.0           # Client-side routing
axios@1.5.0                       # HTTP client for API calls
framer-motion@10.16.4             # Smooth animations
react-hot-toast@2.4.1             # Toast notifications
react-webcam@7.2.0                # Webcam access for video
recharts@2.9.0                    # Data visualization charts
tailwindcss@3.3.3                 # Utility-first CSS
autoprefixer@10.4.15              # CSS vendor prefixes
postcss@8.4.29                    # CSS processing
@headlessui/react@1.7.17          # Accessible UI components
@heroicons/react@2.0.18           # Icon library
@mediapipe/camera_utils@0.3.1     # MediaPipe camera utilities
@mediapipe/face_mesh@0.4.1        # Face detection
```

### Development Dependencies

```
vite@4.4.9                        # Build tool (much faster than webpack)
@vitejs/plugin-react@4.0.4        # Vite React plugin
@types/react@18.2.22              # TypeScript types for React
@types/react-dom@18.2.7           # TypeScript types for React DOM
```

### Installation Command
```bash
cd frontend
npm install
```

### Build & Run Commands
```bash
npm run dev       # Start development server on port 5173
npm run build     # Build for production
npm run preview   # Preview production build locally
```

---

## 🐍 ML Service Python Dependencies

### Core Framework & Web
```
fastapi==0.104.1                  # Modern async web framework
uvicorn[standard]==0.24.0         # ASGI web server
pydantic==2.5.0                   # Data validation
python-multipart==0.0.6           # Form data handling
```

### Computer Vision & ML
```
mediapipe==0.10.14                # Hand/face/body pose detection (Google framework)
opencv-python==4.8.1.78           # Video processing & frame analysis
numpy>=1.24,<2.0                  # Numerical computing
Pillow>=10.0.0                    # Image processing
scikit-learn==1.7.2               # Machine learning algorithms
joblib==1.5.3                     # Model serialization
```

### Data Processing
```
pandas==2.2.3                     # Data manipulation
```

### External APIs & Utilities
```
requests==2.32.5                  # HTTP requests
python-dotenv==1.0.0              # Environment variables
pydantic-settings==2.1.0          # Settings management
groq                              # Groq LLM API (latest version)
```

### Additional
```
protobuf>=4.25.3,<5               # Protocol buffers for MediaPipe
reportlab==4.2.5                  # PDF generation for reports
```

### Installation Command
```bash
cd ml-service

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# OR Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

## 😊 Emotion Service Python Dependencies

### Core Framework & Web
```
fastapi==0.104.1                  # Web framework
uvicorn[standard]==0.24.0         # ASGI server
pydantic==2.5.0                   # Data validation
```

### Computer Vision & Deep Learning
```
opencv-python==4.12.0.88          # Video/image processing
numpy>=2.0,<2.3                   # Numerical computing
torch==2.5.1                       # PyTorch for emotion recognition
```

### Installation Command
```bash
cd emotion-service

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# OR Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

## 🗄️ Database Requirements

### MongoDB Community Edition

**Installation**:
- Windows: Download MSI from MongoDB.com
- macOS: `brew install mongodb-community`
- Linux (Ubuntu): `sudo apt-get install -y mongodb-org`

**Service Management**:

```bash
# Windows - Open Services.msc and find MongoDB
# Start service manually or enable auto-start

# macOS
brew services start mongodb-community
brew services status mongodb-community

# Linux
sudo systemctl start mongod
sudo systemctl status mongod
sudo systemctl enable mongod  # Auto-start on boot
```

**Connection String**:
```
mongodb://localhost:27017/autism_screening
```

**Collections Created Automatically**:
- `users` - Parent/guardian profiles
- `children` - Child profiles
- `screenings` - Screening assessments
- `videos` - Video submission records (file references)

---

## 🔐 API Keys & External Services

### 1. Groq API (Required)

**Purpose**: AI-powered screening explanations and clinical analysis

**Get Free Key**:
1. Visit https://www.groq.com
2. Sign up for free account
3. Generate API key
4. Add to `.env` files

**Free Tier Limits**:
- Requests per minute: 30
- Tokens per minute: 6000

**Sufficient for**:
- Single-user development
- Testing
- Small pilot deployments

**Usage in Project**:
- Backend: `backend/.env` → `GROQ_API_KEY`
- ML Service: `ml-service/.env` → `GROQ_API_KEY`

### 2. OpenStreetMap (Free, No Key Required)

**Purpose**: Locate nearby autism therapy centers

**Services Used**:
- Nominatim (Geocoding): Convert addresses to coordinates
- Overpass API (POI Search): Find nearby clinics, hospitals, therapy centers

**No API key needed** - completely free and open-source

---

## 🌍 Environment Variables Summary

### What Gets Committed to GitHub
✅ `.env.example` - Template files (with blank values)  
✅ `package.json` - Dependency lists  
✅ `requirements.txt` - Python dependency lists  
✅ `SETUP.md` - Setup instructions  
✅ `.gitignore` - Git ignore rules  

### What Never Gets Committed
❌ `.env` - Actual environment variables with secrets  
❌ `node_modules/` - Installed JavaScript packages  
❌ `venv/` - Python virtual environment  
❌ `reports/` - Generated PDF reports (user data)  
❌ `uploads/` - User-uploaded files  
❌ `__pycache__/` - Python cache files  
❌ Any file with API keys, passwords, or database URIs  

---

## 📋 Quick Reference Installation Summary

| Component | Install Command | Verify Command |
|-----------|-----------------|-----------------|
| **Node.js** | Download & run installer | `node -v` |
| **Python** | Download & run installer | `python -v` |
| **MongoDB** | Download & run installer | `mongod --version` |
| **Backend** | `cd backend && npm install` | `npm list --depth=0` |
| **Frontend** | `cd frontend && npm install` | `npm list --depth=0` |
| **ML Service** | `pip install -r requirements.txt` | `pip list` |
| **Emotion Service** | `pip install -r requirements.txt` | `pip list` |

---

## 🔄 Dependency Update Process

### Check for Updates
```bash
# Node.js packages
npm outdated              # Show outdated packages
npm update                # Update to latest minor versions

# Python packages
pip list --outdated       # Show outdated packages
pip install --upgrade PACKAGE_NAME  # Update specific package
```

### Security Updates
```bash
# Node.js
npm audit                 # Find security vulnerabilities
npm audit fix             # Automatically fix vulnerabilities

# Python
pip install --upgrade pip
pip-audit                 # Scan for known vulnerabilities
```

---

## 💾 Total Disk Space Usage

| Component | Size |
|-----------|------|
| Node.js (installed) | ~500 MB |
| Python (installed) | ~100 MB |
| MongoDB (initial) | ~100 MB |
| Project source code | ~50 MB |
| `node_modules/` (backend) | ~800 MB |
| `node_modules/` (frontend) | ~600 MB |
| Python `venv/` (ml-service) | ~1.5 GB |
| Python `venv/` (emotion-service) | ~2 GB |
| ML Models (downloaded on first run) | ~500 MB - 2 GB |
| **TOTAL ESTIMATE** | **~6-7 GB** |

---

## ✅ Verification Checklist

After installation, verify everything:

```bash
# System tools
node --version           # v16.0.0+
npm --version            # v7.0.0+
python --version         # Python 3.9+
pip --version            # pip 21.0+
mongod --version         # MongoDB 5.0+

# Backend
cd backend
npm list --depth=0       # Check installed packages
npm run dev              # Should start without errors

# Frontend (new terminal)
cd frontend
npm list --depth=0       # Check installed packages
npm run dev              # Should compile and start

# ML Service (new terminal)
cd ml-service
source venv/bin/activate  # or: venv\Scripts\activate (Windows)
pip list                  # Check installed packages
python main.py            # Should start server

# Emotion Service (new terminal)
cd emotion-service
source venv/bin/activate  # or: venv\Scripts\activate (Windows)
pip list                  # Check installed packages
python main.py            # Should start server

# Database
# Windows: Services.msc → MongoDB status should be Running
# macOS: brew services list | grep mongo
# Linux: systemctl status mongod
```

---

## 🆘 Common Installation Issues

### Issue: `npm install` fails with permission error
**Solution**: Run terminal as administrator (Windows) or use `sudo` (macOS/Linux)

### Issue: Python module not found
**Solution**: Ensure virtual environment is activated
```bash
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

### Issue: MongoDB connection refused
**Solution**: Start MongoDB service
```bash
# Windows: Open Services.msc
# macOS
brew services start mongodb-community
# Linux
sudo systemctl start mongod
```

### Issue: Port already in use
**Solution**: Kill process on port or use different port
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

---

## 📞 Dependency Documentation

- **Express.js**: https://expressjs.com/
- **Mongoose**: https://mongoosejs.com/
- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **FastAPI**: https://fastapi.tiangolo.com/
- **MediaPipe**: https://developers.google.com/mediapipe
- **Groq API**: https://www.groq.com
- **MongoDB**: https://docs.mongodb.com/

---

**Last Updated**: March 2026  
**Version**: 1.0.0
