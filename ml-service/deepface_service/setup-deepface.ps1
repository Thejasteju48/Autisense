#!/usr/bin/env pwsh
# Setup DeepFace with Conda

Write-Host "`n=== DeepFace Setup (Conda Python 3.9) ===" -ForegroundColor Cyan

Write-Host "`n[1/4] Checking conda..." -ForegroundColor Yellow
try {
    $v = conda --version 2>&1
    Write-Host "   Found: $v" -ForegroundColor Green
} catch {
    Write-Host "   Conda not found!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/4] Creating environment..." -ForegroundColor Yellow
$e = conda env list | Select-String "emotion_py39"
if ($e) { conda env remove -n emotion_py39 -y | Out-Null }
conda create -n emotion_py39 python=3.9 -y
Write-Host "   Created" -ForegroundColor Green

Write-Host "`n[3/4] Installing (5-10 min)..." -ForegroundColor Yellow
conda run -n emotion_py39 pip install -r "$PSScriptRoot\requirements.txt"
Write-Host "   Installed" -ForegroundColor Green

Write-Host "`n[4/4] Verifying..." -ForegroundColor Yellow
conda run -n emotion_py39 python -c "import tensorflow; import deepface; import fastapi; print('OK')"

Write-Host "`n=== COMPLETE ===" -ForegroundColor Green
Write-Host "Next: .\start-deepface-background.ps1" -ForegroundColor Cyan