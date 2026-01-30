#!/usr/bin/env pwsh

$serverScript = Join-Path $PSScriptRoot "emotion_service.py"

try {
    $envList = conda env list 2>&1 | Out-String
    if ($envList -notmatch "emotion_py39") {
        Write-Host "Environment not found! Run .\setup-deepface.ps1" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Conda not available!" -ForegroundColor Red
    exit 1
}

$portInUse = Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "Service already running on port 8001" -ForegroundColor Yellow
    exit 0
}

Write-Host "Starting DeepFace service..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit","-Command","conda run -n emotion_py39 python '$serverScript'"

Start-Sleep -Seconds 5

try {
    Invoke-WebRequest -Uri "http://localhost:8001/health" -TimeoutSec 3 | Out-Null
    Write-Host "Service started successfully" -ForegroundColor Green
} catch {
    Write-Host "Service starting (check window)" -ForegroundColor Yellow
}