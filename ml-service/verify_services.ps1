# Verify Both Services Are Running

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "ML Services Status Check" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Check Main Service
Write-Host "[1/2] Checking Main ML Service (port 8000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Main Service: RUNNING" -ForegroundColor Green
    Write-Host "  Service: $($data.service)" -ForegroundColor Gray
    Write-Host "  Version: $($data.version)" -ForegroundColor Gray
    Write-Host "  Features: $($data.features.Count) available" -ForegroundColor Gray
} catch {
    Write-Host "✗ Main Service: NOT RUNNING" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# Check DeepFace Service
Write-Host "[2/2] Checking DeepFace Service (port 8001)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8001/health" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ DeepFace Service: RUNNING" -ForegroundColor Green
    Write-Host "  Service: $($data.service)" -ForegroundColor Gray
    Write-Host "  Status: $($data.status)" -ForegroundColor Gray
} catch {
    Write-Host "⚠ DeepFace Service: NOT RUNNING" -ForegroundColor Yellow
    Write-Host "  Note: Expression detection will not work" -ForegroundColor Gray
    Write-Host "  To start: Run start_services.ps1" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Status Check Complete" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
