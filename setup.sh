#!/bin/bash

# Autism Screening Application - Setup Script (Unix/Linux/Mac)
# Run this script to set up all three services

echo "🚀 Setting up Autism Screening Application..."
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js installed: $NODE_VERSION"
else
    echo "✗ Node.js not found. Please install Node.js v16+ from https://nodejs.org/"
    exit 1
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✓ Python installed: $PYTHON_VERSION"
else
    echo "✗ Python not found. Please install Python 3.8+ from https://python.org/"
    exit 1
fi

# Check MongoDB
if command -v mongod &> /dev/null; then
    echo "✓ MongoDB installed"
else
    echo "⚠ MongoDB not found. Please install MongoDB from https://mongodb.com/download-center/community"
    echo "  Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas"
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Setup Backend
echo "1️⃣ Setting up Backend..."
cd backend
if [ -f "package.json" ]; then
    npm install
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo "✓ Created .env file - Please update with your configuration"
    fi
    echo "✓ Backend setup complete"
else
    echo "✗ Backend package.json not found"
fi
cd ..

echo ""

# Setup ML Service
echo "2️⃣ Setting up ML Service..."
cd ml-service
if [ -f "requirements.txt" ]; then
    # Check if venv exists, create if not
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    echo "Activating virtual environment..."
    source venv/bin/activate
    
    echo "Installing Python packages..."
    pip install -r requirements.txt
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo "✓ Created .env file"
    fi
    echo "✓ ML Service setup complete"
    deactivate
else
    echo "✗ ML Service requirements.txt not found"
fi
cd ..

echo ""

# Setup Frontend
echo "3️⃣ Setting up Frontend..."
cd frontend
if [ -f "package.json" ]; then
    npm install
    echo "✓ Frontend setup complete"
else
    echo "✗ Frontend package.json not found"
fi
cd ..

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update backend/.env with your MongoDB URI and JWT secret"
echo "2. Start MongoDB: mongod"
echo "3. Start Backend: cd backend && npm run dev"
echo "4. Start ML Service: cd ml-service && source venv/bin/activate && python main.py"
echo "5. Start Frontend: cd frontend && npm run dev"
echo ""
echo "📚 Documentation:"
echo "- Quick Start: QUICKSTART.md"
echo "- Full Guide: README.md"
echo "- API Examples: API_EXAMPLES.md"
echo "- Deployment: DEPLOYMENT.md"
echo ""
echo "🌐 Default URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:5000"
echo "- ML Service: http://localhost:8000"
echo ""
echo "Happy coding! 🎉"
