# Quick Start Script for Autism Screening Platform
# Run this script to start all three services simultaneously

Write-Host "🚀 Starting Autism Screening Platform..." -ForegroundColor Cyan
Write-Host ""

# Check if services are already running
$backend = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*AutismProject\backend*" }
$mlservice = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*AutismProject\ml-service*" }
$frontend = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*AutismProject\frontend*" }

if ($backend -or $mlservice -or $frontend) {
    Write-Host "⚠️  Some services are already running!" -ForegroundColor Yellow
    Write-Host "Please stop them first or use separate terminals." -ForegroundColor Yellow
    Write-Host ""
    exit
}

# Start Backend (Terminal 1)
Write-Host "📦 Starting Backend Service (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd d:\AutismProject\backend; Write-Host '🔧 Backend Server' -ForegroundColor Cyan; npm run dev"

Start-Sleep -Seconds 3

# Start ML Service (Terminal 2)
Write-Host "🤖 Starting ML Service (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd d:\AutismProject\ml-service; Write-Host '🤖 ML Service' -ForegroundColor Cyan; .\venv\Scripts\Activate.ps1; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 3

# Start Frontend (Terminal 3)
Write-Host "⚛️  Starting Frontend (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd d:\AutismProject\frontend; Write-Host '⚛️  Frontend' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "✅ All services starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Service URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:   http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:    http://localhost:5000" -ForegroundColor White
Write-Host "   ML Service: http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  To stop all services, close the terminal windows or press Ctrl+C in each." -ForegroundColor Yellow
Write-Host ""
