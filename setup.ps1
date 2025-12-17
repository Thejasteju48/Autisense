# Autism Screening Application - Setup Script
# Run this script to set up all three services

Write-Host "🚀 Setting up Autism Screening Application..." -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js v16+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "✓ Python installed: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.8+ from https://python.org/" -ForegroundColor Red
    exit 1
}

# Check MongoDB
try {
    $mongoVersion = mongod --version
    Write-Host "✓ MongoDB installed" -ForegroundColor Green
} catch {
    Write-Host "⚠ MongoDB not found. Please install MongoDB from https://mongodb.com/download-center/community" -ForegroundColor Yellow
    Write-Host "  Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

# Setup Backend
Write-Host "1️⃣ Setting up Backend..." -ForegroundColor Cyan
Set-Location backend
if (Test-Path "package.json") {
    npm install
    if (!(Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ Created .env file - Please update with your configuration" -ForegroundColor Green
    }
    Write-Host "✓ Backend setup complete" -ForegroundColor Green
} else {
    Write-Host "✗ Backend package.json not found" -ForegroundColor Red
}
Set-Location ..

Write-Host ""

# Setup ML Service
Write-Host "2️⃣ Setting up ML Service..." -ForegroundColor Cyan
Set-Location ml-service
if (Test-Path "requirements.txt") {
    # Check if venv exists, create if not
    if (!(Test-Path "venv")) {
        Write-Host "Creating virtual environment..." -ForegroundColor Yellow
        python -m venv venv
    }
    
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
    
    Write-Host "Installing Python packages..." -ForegroundColor Yellow
    pip install -r requirements.txt
    
    if (!(Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ Created .env file" -ForegroundColor Green
    }
    Write-Host "✓ ML Service setup complete" -ForegroundColor Green
    deactivate
} else {
    Write-Host "✗ ML Service requirements.txt not found" -ForegroundColor Red
}
Set-Location ..

Write-Host ""

# Setup Frontend
Write-Host "3️⃣ Setting up Frontend..." -ForegroundColor Cyan
Set-Location frontend
if (Test-Path "package.json") {
    npm install
    Write-Host "✓ Frontend setup complete" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend package.json not found" -ForegroundColor Red
}
Set-Location ..

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update backend/.env with your MongoDB URI and JWT secret" -ForegroundColor White
Write-Host "2. Start MongoDB: mongod" -ForegroundColor White
Write-Host "3. Start Backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "4. Start ML Service: cd ml-service && python main.py" -ForegroundColor White
Write-Host "5. Start Frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "- Quick Start: QUICKSTART.md" -ForegroundColor White
Write-Host "- Full Guide: README.md" -ForegroundColor White
Write-Host "- API Examples: API_EXAMPLES.md" -ForegroundColor White
Write-Host "- Deployment: DEPLOYMENT.md" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Default URLs:" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "- Backend: http://localhost:5000" -ForegroundColor White
Write-Host "- ML Service: http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🎉" -ForegroundColor Green
