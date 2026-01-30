#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start DeepFace Emotion Detection Service (Conda)
.DESCRIPTION
    Starts the DeepFace emotion detection microservice on port 8001
    using conda environment
#>

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Starting DeepFace Emotion Detection Service            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$serverScript = Join-Path $PSScriptRoot "emotion_service.py"

# Check if conda environment exists
try {
    $envList = conda env list 2>&1 | Out-String
    if ($envList -notmatch "emotion_py39") {
        Write-Host "`n✗ Conda environment 'emotion_py39' not found!" -ForegroundColor Red
        Write-Host "   Run setup first: .\setup-deepface.ps1" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "`n✗ Conda not available!" -ForegroundColor Red
    exit 1
}

# Check if port 8001 is available
$portInUse = Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "`n⚠ Port 8001 is already in use!" -ForegroundColor Yellow
    Write-Host "   DeepFace service might already be running" -ForegroundColor Gray
    
    $response = Read-Host "`n   Kill existing process? (y/n)"
    if ($response -eq 'y') {
        $processId = $portInUse[0].OwningProcess
        Stop-Process -Id $processId -Force
        Write-Host "   ✓ Process killed" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } else {
        exit 1
    }
}

Write-Host "`n🚀 Starting DeepFace service on port 8001..." -ForegroundColor Yellow
Write-Host "   Environment: emotion_py39" -ForegroundColor Gray
Write-Host "   Script: $serverScript" -ForegroundColor Gray
Write-Host "`n   Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan

# Start the server
conda run -n emotion_py39 python $serverScript
