# START ALL SERVICES - CORRECTED CONFIGURATION
# Backend on port 5001, Frontend auto-detects port

Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Starting All Autism Screening Services       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Stop existing services
Write-Host "[0/4] Stopping existing services..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 3

# Start DeepFace
Write-Host "[1/4] Starting DeepFace Service (port 8001)..." -ForegroundColor Yellow
Start-Process -FilePath "C:\Users\Thejas\anaconda3\envs\deepface_py39\python.exe" `
    -ArgumentList "d:\AutismProject\ml-service\deepface_service\deepface_server.py" `
    -WindowStyle Normal
Start-Sleep 5

# Start Main ML
Write-Host "[2/4] Starting Main ML Service (port 8000)..." -ForegroundColor Yellow
Start-Process -FilePath "d:\AutismProject\ml-service\venv\Scripts\python.exe" `
    -ArgumentList "d:\AutismProject\ml-service\main.py" `
    -WorkingDirectory "d:\AutismProject\ml-service" `
    -WindowStyle Normal
Start-Sleep 5

# Start Backend
Write-Host "[3/4] Starting Backend (port 5001)..." -ForegroundColor Yellow
$backendScript = @"
cd d:\AutismProject\backend
`$env:PORT=5001
Write-Host 'Backend starting on port 5001...' -ForegroundColor Green
npm start
"@
$backendScript | Out-File -FilePath "d:\AutismProject\start_backend.ps1" -Encoding UTF8
Start-Process powershell -ArgumentList "-NoExit", "-File", "d:\AutismProject\start_backend.ps1" -WindowStyle Normal
Start-Sleep 8

# Start Frontend
Write-Host "[4/4] Starting Frontend..." -ForegroundColor Yellow
$frontendScript = @"
cd d:\AutismProject\frontend
Write-Host 'Frontend starting with backend: http://localhost:5001' -ForegroundColor Green
npm run dev
"@
$frontendScript | Out-File -FilePath "d:\AutismProject\start_frontend.ps1" -Encoding UTF8
Start-Process powershell -ArgumentList "-NoExit", "-File", "d:\AutismProject\start_frontend.ps1" -WindowStyle Normal

Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  Services Starting in Separate Windows        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "⏱  Please wait 30-40 seconds for all services to load" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Configuration:" -ForegroundColor Yellow
Write-Host "   • Backend: http://localhost:5001" -ForegroundColor White
Write-Host "   • Frontend: http://localhost:3000 or 3001" -ForegroundColor White
Write-Host "   • ML Service: http://localhost:8000" -ForegroundColor White
Write-Host "   • DeepFace: http://localhost:8001" -ForegroundColor White
Write-Host ""
Write-Host "✅ Fixed Issues:" -ForegroundColor Yellow
Write-Host "   • icon.svg created" -ForegroundColor White
Write-Host "   • Backend port changed from 5000 to 5001" -ForegroundColor White
Write-Host "   • Frontend .env updated" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next: Wait 40 seconds, then check frontend console" -ForegroundColor Cyan
Write-Host "   for the actual URL (usually 3000 or 3001)" -ForegroundColor Cyan
Write-Host ""
