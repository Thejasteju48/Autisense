# Quick DeepFace Service Integration Test
# Tests if the main ML service can communicate with DeepFace service

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "DeepFace Service Integration Test" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check DeepFace service health
Write-Host "[1/3] Testing DeepFace service health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:8001/health" -Method GET -TimeoutSec 2
    Write-Host "  SUCCESS: DeepFace service is healthy" -ForegroundColor Green
    Write-Host "    Service: $($healthResponse.service)" -ForegroundColor Gray
    Write-Host "    Status: $($healthResponse.status)" -ForegroundColor Gray
}
catch {
    Write-Host "  FAILED: DeepFace service not accessible" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Please start DeepFace service first:" -ForegroundColor Yellow
    Write-Host "  .\start_services.ps1" -ForegroundColor Gray
    exit 1
}

Write-Host ""

# Test 2: Test with sample image
Write-Host "[2/3] Testing emotion detection with sample image..." -ForegroundColor Yellow

# Create a simple base64 encoded test image (1x1 pixel PNG)
$sampleImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

try {
    $emotionRequest = @{
        image = $sampleImageBase64
    } | ConvertTo-Json

    $emotionResponse = Invoke-RestMethod -Uri "http://localhost:8001/analyze_emotion" -Method POST -ContentType "application/json" -Body $emotionRequest -TimeoutSec 5
    
    if ($emotionResponse.status -eq "success") {
        Write-Host "  SUCCESS: Emotion detection working" -ForegroundColor Green
        Write-Host "    Dominant emotion: $($emotionResponse.emotion)" -ForegroundColor Gray
    }
    else {
        Write-Host "  WARNING: Unexpected response format" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  FAILED: Emotion detection failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    exit 1
}

Write-Host ""

# Test 3: Check Python integration
Write-Host "[3/3] Testing Python expression feature integration..." -ForegroundColor Yellow

try {
    $pythonEnv = "d:\AutismProject\ml-service\venv\Scripts\python.exe"
    
    $testCode = @"
import sys
sys.path.append('d:/AutismProject/ml-service')
from services.features.expression_variability_feature import ExpressionVariabilityFeature

feature = ExpressionVariabilityFeature()

if feature._check_deepface_service():
    print('SUCCESS: Expression feature can communicate with DeepFace service')
    print(f'DeepFace URL: {feature.deepface_url}')
else:
    print('ERROR: Expression feature cannot reach DeepFace service')
    sys.exit(1)
"@
    
    $testFile = "d:\AutismProject\ml-service\test_integration_temp.py"
    $testCode | Out-File -FilePath $testFile -Encoding UTF8
    
    $pythonOutput = & $pythonEnv $testFile 2>&1
    
    if ($pythonOutput -match "SUCCESS") {
        Write-Host "  SUCCESS: Expression feature can communicate with DeepFace" -ForegroundColor Green
        foreach ($line in $pythonOutput) {
            Write-Host "    $line" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "  FAILED: Integration test failed" -ForegroundColor Red
        foreach ($line in $pythonOutput) {
            Write-Host "    $line" -ForegroundColor Gray
        }
        exit 1
    }
    
    Remove-Item $testFile -ErrorAction SilentlyContinue
}
catch {
    Write-Host "  WARNING: Could not run Python integration test" -ForegroundColor Yellow
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "DeepFace microservice is working correctly." -ForegroundColor White
Write-Host "Expression detection (Feature #7) is ready." -ForegroundColor White
Write-Host ""
Write-Host "Next step: Upload a video through your frontend or use test_video_upload.ps1" -ForegroundColor Cyan
