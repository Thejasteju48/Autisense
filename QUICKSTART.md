# Quick Start Guide

## Installation (5 minutes)

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# ML Service
cd ../ml-service
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### Step 2: Configure Environment

```bash
# Backend - Create .env
cd backend
cp .env.example .env
# Edit .env and set your MongoDB URI

# ML Service - Create .env
cd ../ml-service
cp .env.example .env
```

### Step 3: Start Services

Open 4 terminals:

**Terminal 1 - MongoDB:**
```bash
mongod
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - ML Service:**
```bash
cd ml-service
python main.py
```

**Terminal 4 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 4: Access Application

Open browser: `http://localhost:3000`

---

## First Time Use

1. **Register**: Create parent account
2. **Add Child**: Add your child's profile
3. **Start Screening**: Upload video, audio, answer questions
4. **View Results**: See risk assessment and recommendations
5. **Play Games**: Try interactive activities
6. **Track Progress**: View history and trends

---

## Quick Commands

```bash
# Backend
npm run dev          # Development mode
npm start            # Production mode

# ML Service
python main.py       # Start service

# Frontend  
npm run dev          # Development mode
npm run build        # Production build
```

---

## Common Issues

### Port Already in Use
```bash
# Change ports in .env files
# Backend: PORT=5001
# ML Service: PORT=8001
# Frontend: Change in vite.config.js
```

### MongoDB Connection Error
```bash
# Ensure MongoDB is running
# Check MONGODB_URI in backend/.env
```

### Module Not Found
```bash
# Reinstall dependencies
npm install  # or pip install -r requirements.txt
```

---

## Test Accounts

For testing, create accounts with:
- Email: test@example.com
- Password: test123

---

## Need Help?

Check the main README.md for detailed documentation.
