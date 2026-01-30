# Start Both ML Services
# Main Service (Python 3.12) + DeepFace Service (Python 3.9)

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Starting Autism Screening ML Services" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# Check if Python 3.9 conda environment exists
$condaEnvPath = "C:\Users\Thejas\anaconda3\envs\deepface_py39\python.exe"
if (Test-Path $condaEnvPath) {
    Write-Host "[1/3] Python 3.9 conda environment found" -ForegroundColor Green
    
    # Start DeepFace service in new window
    Write-Host "[2/3] Starting DeepFace service on port 8001..." -ForegroundColor Yellow
    $deepfaceScript = "d:\AutismProject\ml-service\deepface_service\deepface_server.py"
    Start-Process -FilePath $condaEnvPath -ArgumentList $deepfaceScript -WindowStyle Normal
    
    Start-Sleep -Seconds 4
    
    # Verify DeepFace service
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8001/health" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        Write-Host "SUCCESS: DeepFace service is running on port 8001" -ForegroundColor Green
    }
    catch {
        Write-Host "WARNING: DeepFace service not responding (emotion detection disabled)" -ForegroundColor Yellow
    }
}
else {
    Write-Host "[1/3] Python 3.9 environment NOT found" -ForegroundColor Yellow
    Write-Host "      To enable emotion detection, run:" -ForegroundColor Yellow
    Write-Host "      conda create -n deepface_py39 python=3.9 -y" -ForegroundColor Gray
    Write-Host "      cd D:\AutismProject\ml-service\deepface_service" -ForegroundColor Gray
    Write-Host "      C:\Users\Thejas\anaconda3\envs\deepface_py39\python.exe -m pip install -r requirements.txt" -ForegroundColor Gray
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Starting Main ML Service (Python 3.12) on port 8000" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# Start main service in new window
Push-Location D:\AutismProject\ml-service
Start-Process -FilePath ".\venv\Scripts\python.exe" -ArgumentList "main.py" -WindowStyle Normal
Pop-Location

Start-Sleep -Seconds 3

# Verify main service
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "SUCCESS: Main ML service is running on port 8000" -ForegroundColor Green
}
catch {
    Write-Host "FAILED: Main ML service failed to start" -ForegroundColor Red
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "Services Started Successfully!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "Main Service:     http://localhost:8000" -ForegroundColor White
Write-Host "DeepFace Service: http://localhost:8001" -ForegroundColor White
Write-Host ""
Write-Host "Two console windows opened. Keep them running." -ForegroundColor Yellow
Write-Host "Press any key to exit this script..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
