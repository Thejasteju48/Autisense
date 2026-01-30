# Test All Endpoints - Autism Project
# Tests communication between Frontend, Backend, and ML Service

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   AUTISM PROJECT ENDPOINT TESTS    " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$backend = "http://localhost:5000"
$ml = "http://localhost:8000"

# Test 1: ML Service Health
Write-Host "[1/6] Testing ML Service..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$ml/" -Method Get
    Write-Host "✓ ML Service is running" -ForegroundColor Green
    Write-Host "  Version: $($response.version)" -ForegroundColor Gray
    Write-Host "  Features: $($response.features.Count) extractors" -ForegroundColor Gray
} catch {
    Write-Host "✗ ML Service FAILED: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Backend Health
Write-Host "[2/6] Testing Backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$backend/health" -Method Get
    Write-Host "✓ Backend is running" -ForegroundColor Green
    Write-Host "  Status: $($response.status)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Backend FAILED: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: ML Video Session Start
Write-Host "[3/6] Testing ML Video Session..." -ForegroundColor Yellow
try {
    $sessionId = "test_session_$(Get-Date -Format 'yyyyMMddHHmmss')"
    $body = @{
        session_id = $sessionId
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$ml/video/start-session" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✓ Video session started" -ForegroundColor Green
    Write-Host "  Session ID: $sessionId" -ForegroundColor Gray
    
    # Test session status
    Start-Sleep -Seconds 1
    $status = Invoke-RestMethod -Uri "$ml/video/session-status/$sessionId" -Method Get
    Write-Host "✓ Session status retrieved" -ForegroundColor Green
    Write-Host "  Frames: $($status.frames_processed)" -ForegroundColor Gray
    
} catch {
    Write-Host "✗ Video session FAILED: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: ML Questionnaire Prediction
Write-Host "[4/6] Testing ML Questionnaire Prediction..." -ForegroundColor Yellow
try {
    $body = @{
        responses = @($true, $false, $true, $false, $true, $false, $true, $false, $true, $false,
                     $true, $false, $true, $false, $true, $false, $true, $false, $true, $false)
        age = 36
        sex = "male"
        jaundice = "no"
        family_asd = "no"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$ml/predict/questionnaire" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✓ Questionnaire prediction successful" -ForegroundColor Green
    Write-Host "  Probability: $([math]::Round($response.probability * 100, 2))%" -ForegroundColor Gray
    Write-Host "  Risk Level: $($response.risk_level)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Questionnaire prediction FAILED: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: ML Video Behavior Prediction
Write-Host "[5/6] Testing ML Video Behavior Prediction..." -ForegroundColor Yellow
try {
    $body = @{
        eye_contact_ratio = 0.6
        blink_rate_per_minute = 15.0
        head_movement_rate = 0.25
        head_repetitive_movement = @{
            detected = $false
            oscillations = 0
            horizontal = 0
            vertical = 0
        }
        hand_repetitive_movement = @{
            leftHand = @{ detected = $false; oscillations = 0; intensity = 0 }
            rightHand = @{ detected = $false; oscillations = 0; intensity = 0 }
        }
        gesture_frequency_per_minute = 3.0
        facial_expression_variability = 0.45
    } | ConvertTo-Json -Depth 4
    
    $response = Invoke-RestMethod -Uri "$ml/predict/video-behavior" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✓ Video behavior prediction successful" -ForegroundColor Green
    Write-Host "  Video Score: $([math]::Round($response.video_behavior_score, 2))" -ForegroundColor Gray
    Write-Host "  Risk Level: $($response.risk_level)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Video behavior prediction FAILED: $_" -ForegroundColor Red
}
Write-Host ""

# Test 6: Check Backend Routes
Write-Host "[6/6] Testing Backend Routes..." -ForegroundColor Yellow
$routes = @(
    "/api/auth/register",
    "/api/auth/login",
    "/api/children",
    "/api/screenings/start"
)

foreach ($route in $routes) {
    try {
        # Just check if route exists (will return 401/400, not 404)
        Invoke-RestMethod -Uri "$backend$route" -Method Post -ErrorAction Stop 2>$null
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401 -or $statusCode -eq 400) {
            Write-Host "  ✓ $route exists (auth required)" -ForegroundColor Green
        } elseif ($statusCode -eq 404) {
            Write-Host "  ✗ $route NOT FOUND" -ForegroundColor Red
        } else {
            Write-Host "  ✓ $route exists (status: $statusCode)" -ForegroundColor Green
        }
    }
}
Write-Host ""

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "           TEST COMPLETE            " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Communication Flow:" -ForegroundColor Yellow
Write-Host "  Frontend → ML Service (video frames)" -ForegroundColor White
Write-Host "  Frontend → Backend (questionnaire + video features)" -ForegroundColor White
Write-Host "  Backend → ML Service (final predictions)" -ForegroundColor White
Write-Host ""
Write-Host "All critical endpoints tested!" -ForegroundColor Green
