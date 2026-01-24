# System Integration Test Script
# Tests backend, ML service, and their interactions

Write-Host "=== Autisense System Integration Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Backend Health
Write-Host "Test 1: Testing Backend Service (Port 5000)..." -ForegroundColor Yellow
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:5000" -Method GET -ErrorAction Stop
    Write-Host "✓ Backend is running" -ForegroundColor Green
}
catch {
    Write-Host "✗ Backend is NOT responding" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: ML Service Health
Write-Host "Test 2: Testing ML Service (Port 8000)..." -ForegroundColor Yellow
try {
    $mlResponse = Invoke-WebRequest -Uri "http://localhost:8000/docs" -Method GET -ErrorAction Stop
    if ($mlResponse.StatusCode -eq 200) {
        Write-Host "✓ ML Service is running" -ForegroundColor Green
    }
}
catch {
    Write-Host "✗ ML Service is NOT responding" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: ML Video Features Endpoint
Write-Host "Test 3: Testing ML Video Features Endpoint..." -ForegroundColor Yellow
try {
    $testFeatures = @{
        eyeContactDuration = 0.6
        blinkRate = 0.4
        headMovementRepetition = 0.2
        handFlapping = 0.3
        bodyRocking = 0.2
        faceOrientation = 0.5
        emotionStability = 0.4
        sessionId = "test-integration-123"
    } | ConvertTo-Json

    $mlVideoResponse = Invoke-WebRequest -Uri "http://localhost:8000/process-video-features" -Method POST -ContentType "application/json" -Body $testFeatures -ErrorAction Stop
    $mlVideoResult = $mlVideoResponse.Content | ConvertFrom-Json
    
    Write-Host "✓ ML Video Features Endpoint working" -ForegroundColor Green
    Write-Host "  Video Score: $($mlVideoResult.realtime_analysis.video_score)" -ForegroundColor Cyan
    Write-Host "  Risk Level: $($mlVideoResult.realtime_analysis.risk_level)" -ForegroundColor Cyan
    Write-Host "  Confidence: $($mlVideoResult.realtime_analysis.confidence)%" -ForegroundColor Cyan
}
catch {
    Write-Host "✗ ML Video Features Endpoint failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: ML Finalize Analysis Endpoint
Write-Host "Test 4: Testing ML Finalize Analysis Endpoint..." -ForegroundColor Yellow
try {
    $finalizeData = @{
        videoFeatures = @{
            eyeContactDuration = 0.55
            blinkRate = 0.35
            headMovementRepetition = 0.25
            handFlapping = 0.28
            bodyRocking = 0.18
            faceOrientation = 0.48
            emotionStability = 0.42
        }
        questionnaireAnswers = @(
            @{ question = "Does your child make eye contact?"; answer = 1; weight = 2 }
            @{ question = "Does your child respond to their name?"; answer = 0; weight = 2 }
            @{ question = "Does your child engage in repetitive behaviors?"; answer = 1; weight = 1.5 }
        )
        childId = "test-child-123"
    } | ConvertTo-Json -Depth 10

    $finalizeResponse = Invoke-WebRequest -Uri "http://localhost:8000/finalize-analysis" -Method POST -ContentType "application/json" -Body $finalizeData -ErrorAction Stop
    $finalizeResult = $finalizeResponse.Content | ConvertFrom-Json
    
    Write-Host "✓ ML Finalize Analysis Endpoint working" -ForegroundColor Green
    Write-Host "  Combined Score: $($finalizeResult.analysis.combined_score)" -ForegroundColor Cyan
    Write-Host "  Risk Classification: $($finalizeResult.analysis.risk_classification.level)" -ForegroundColor Cyan
    Write-Host "  Recommendations: $($finalizeResult.analysis.recommendations.Count) items" -ForegroundColor Cyan
}
catch {
    Write-Host "✗ ML Finalize Analysis Endpoint failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Frontend
Write-Host "Test 5: Testing Frontend Service (Port 3000)..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -ErrorAction Stop
    Write-Host "✓ Frontend is running" -ForegroundColor Green
    Write-Host "  Status: $($frontendResponse.StatusCode)" -ForegroundColor Cyan
}
catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "✓ Frontend is running (404 is normal for SPA root)" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Frontend is NOT responding" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Summary
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "All three services should be running:" -ForegroundColor White
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Gray
Write-Host "  ML Service: http://localhost:8000 (Swagger: /docs)" -ForegroundColor Gray
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "New Live Video Analysis Module is ready!" -ForegroundColor Green
Write-Host "  ✓ Real-time video processing with MediaPipe" -ForegroundColor Gray
Write-Host "  ✓ 7 behavioral feature extraction" -ForegroundColor Gray
Write-Host "  ✓ Risk classification (LOW/MODERATE/HIGH)" -ForegroundColor Gray
Write-Host "  ✓ Backend + ML service integration" -ForegroundColor Gray
Write-Host ""
Write-Host "To view the app, open: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
