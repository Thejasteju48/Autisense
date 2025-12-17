# Health Check Script for Autism Screening Platform
# Verifies all services are running and responding

Write-Host "🔍 Checking Service Health..." -ForegroundColor Cyan
Write-Host ""

$allHealthy = $true

# Check Backend
Write-Host "📦 Backend (Port 5000)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 3 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅ Healthy" -ForegroundColor Green
    } else {
        Write-Host " ❌ Unhealthy (Status: $($response.StatusCode))" -ForegroundColor Red
        $allHealthy = $false
    }
} catch {
    Write-Host " ❌ Not Running" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Yellow
    $allHealthy = $false
}

# Check ML Service
Write-Host "🤖 ML Service (Port 8000)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 3 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅ Healthy" -ForegroundColor Green
    } else {
        Write-Host " ❌ Unhealthy (Status: $($response.StatusCode))" -ForegroundColor Red
        $allHealthy = $false
    }
} catch {
    Write-Host " ❌ Not Running" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Yellow
    $allHealthy = $false
}

# Check Frontend
Write-Host "⚛️  Frontend (Port 3000)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅ Running" -ForegroundColor Green
    } else {
        Write-Host " ❌ Unhealthy (Status: $($response.StatusCode))" -ForegroundColor Red
        $allHealthy = $false
    }
} catch {
    Write-Host " ❌ Not Running" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Yellow
    $allHealthy = $false
}

Write-Host ""

if ($allHealthy) {
    Write-Host "✅ All services are healthy and running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Access the application at: http://localhost:3000" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Some services are not running or unhealthy." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Cyan
    Write-Host "   1. Run: .\start-all-services.ps1" -ForegroundColor White
    Write-Host "   2. Check terminal windows for error messages" -ForegroundColor White
    Write-Host "   3. Review: INTEGRATION_DEBUG_REPORT.md" -ForegroundColor White
}

Write-Host ""
