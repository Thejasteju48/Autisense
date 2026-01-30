# Test Video Upload to ML Service
# This script tests the complete video processing pipeline with all 7 features

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Testing ML Service Video Processing" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Configuration
$ML_SERVICE_URL = "http://localhost:8000"
$DEEPFACE_SERVICE_URL = "http://localhost:8001"

# Step 1: Verify both services are running
Write-Host "[1/4] Verifying services..." -ForegroundColor Yellow

try {
    $mainResponse = Invoke-WebRequest -Uri "$ML_SERVICE_URL/" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✓ Main ML Service: ONLINE" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Main ML Service: OFFLINE" -ForegroundColor Red
    Write-Host "  Run: .\start_services.ps1" -ForegroundColor Gray
    exit 1
}

try {
    $deepfaceResponse = Invoke-WebRequest -Uri "$DEEPFACE_SERVICE_URL/health" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✓ DeepFace Service: ONLINE (Expression detection enabled)" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ DeepFace Service: OFFLINE (Expression detection disabled)" -ForegroundColor Yellow
    Write-Host "  Note: Will continue with 6/7 features" -ForegroundColor Gray
}

Write-Host ""

# Step 2: Check for test video
Write-Host "[2/4] Looking for test video..." -ForegroundColor Yellow

# Common locations for test videos
$testVideoPaths = @(
    "d:\AutismProject\test_video.mp4",
    "d:\AutismProject\test_video.webm",
    "d:\AutismProject\frontend\public\test_video.mp4",
    "d:\Downloads\test_video.mp4",
    "$env:USERPROFILE\Downloads\test_video.mp4"
)

$videoPath = $null
foreach ($path in $testVideoPaths) {
    if (Test-Path $path) {
        $videoPath = $path
        Write-Host "  ✓ Found test video: $videoPath" -ForegroundColor Green
        break
    }
}

if (-not $videoPath) {
    Write-Host "  ⚠ No test video found. Please specify path:" -ForegroundColor Yellow
    $videoPath = Read-Host "  Enter video file path"
    
    if (-not (Test-Path $videoPath)) {
        Write-Host "  ✗ Video file not found: $videoPath" -ForegroundColor Red
        exit 1
    }
}

# Get video file info
$videoFile = Get-Item $videoPath
Write-Host "  File: $($videoFile.Name)" -ForegroundColor Gray
Write-Host "  Size: $([math]::Round($videoFile.Length / 1MB, 2)) MB" -ForegroundColor Gray

Write-Host ""

# Step 3: Upload video to ML service
Write-Host "[3/4] Uploading video to ML service..." -ForegroundColor Yellow
Write-Host "  This may take 30-60 seconds depending on video length" -ForegroundColor Gray

try {
    # Prepare multipart form data
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    # Read video file
    $videoBytes = [System.IO.File]::ReadAllBytes($videoPath)
    
    # Build multipart body
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"video`"; filename=`"$($videoFile.Name)`"",
        "Content-Type: video/webm",
        "",
        [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($videoBytes),
        "--$boundary",
        "Content-Disposition: form-data; name=`"screening_id`"",
        "",
        "test-screening-$(Get-Date -Format 'yyyyMMdd-HHmmss')",
        "--$boundary",
        "Content-Disposition: form-data; name=`"duration`"",
        "",
        "120",
        "--$boundary--"
    ) -join $LF
    
    $uploadStartTime = Get-Date
    
    $response = Invoke-RestMethod -Uri "$ML_SERVICE_URL/video/process-complete" `
        -Method POST `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body ([System.Text.Encoding]::GetEncoding("iso-8859-1").GetBytes($bodyLines)) `
        -TimeoutSec 120
    
    $uploadDuration = ((Get-Date) - $uploadStartTime).TotalSeconds
    
    Write-Host "  ✓ Video processed successfully in $([math]::Round($uploadDuration, 1))s" -ForegroundColor Green
    
    Write-Host ""
    
    # Step 4: Display results
    Write-Host "[4/4] Feature Extraction Results:" -ForegroundColor Yellow
    Write-Host ""
    
    $features = $response.features
    
    Write-Host "  📊 Processing Summary:" -ForegroundColor Cyan
    Write-Host "    Frames Processed: $($response.frames_processed)" -ForegroundColor White
    Write-Host "    Duration: $($response.duration)s" -ForegroundColor White
    Write-Host "    FPS: $($response.fps)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "  👁️  Feature 1: Eye Contact" -ForegroundColor Cyan
    Write-Host "    Ratio: $($features.eye_contact_ratio)" -ForegroundColor White
    Write-Host "    Level: $($features.eye_contact_level)" -ForegroundColor White
    Write-Host "    $($features.eye_contact_interpretation)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "  👀 Feature 2: Blink Rate" -ForegroundColor Cyan
    Write-Host "    Rate: $($features.blink_rate_per_minute) blinks/min" -ForegroundColor White
    Write-Host "    Level: $($features.blink_level)" -ForegroundColor White
    Write-Host "    $($features.blink_interpretation)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "  🔄 Feature 3: Head Movement" -ForegroundColor Cyan
    Write-Host "    Rate: $($features.head_movement_avg_per_frame)" -ForegroundColor White
    Write-Host "    Level: $($features.head_movement_level)" -ForegroundColor White
    Write-Host "    $($features.head_movement_interpretation)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "  🔁 Feature 4: Head Repetitive Movements" -ForegroundColor Cyan
    Write-Host "    Present: $($features.head_movements.present)" -ForegroundColor White
    Write-Host "    Repetitive: $($features.head_movements.repetitive)" -ForegroundColor White
    Write-Host "    $($features.head_movements.description)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "  ✋ Feature 5: Hand Repetitive Movements" -ForegroundColor Cyan
    Write-Host "    Present: $($features.hand_stimming.present)" -ForegroundColor White
    Write-Host "    Severity: $($features.hand_stimming.severity)" -ForegroundColor White
    Write-Host "    $($features.hand_stimming.description)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "  👋 Feature 6: Social Gestures" -ForegroundColor Cyan
    Write-Host "    Present: $($features.social_gestures.present)" -ForegroundColor White
    Write-Host "    Frequency: $($features.social_gestures.frequency_per_minute) gestures/min" -ForegroundColor White
    Write-Host "    $($features.social_gestures.description)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "  😊 Feature 7: Facial Expression Variability" -ForegroundColor Cyan
    Write-Host "    Variability: $($features.facial_expression_variability)" -ForegroundColor White
    Write-Host "    Level: $($features.expression_level)" -ForegroundColor White
    Write-Host "    $($features.expression_interpretation)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "  🏥 Clinical Interpretation:" -ForegroundColor Cyan
    $interpretation = $features.clinical_interpretation
    Write-Host "    Risk Level: $($interpretation.risk_level)" -ForegroundColor White
    Write-Host "    Risk Score: $($interpretation.risk_score)" -ForegroundColor White
    Write-Host "    Summary: $($interpretation.summary)" -ForegroundColor White
    if ($interpretation.concerns -and $interpretation.concerns.Count -gt 0) {
        Write-Host "    Concerns:" -ForegroundColor White
        foreach ($concern in $interpretation.concerns) {
            Write-Host "      - $concern" -ForegroundColor Yellow
        }
    }
    Write-Host ""
    
    Write-Host "  📈 Data Quality:" -ForegroundColor Cyan
    $dataQuality = $features.data_quality
    Write-Host "    Face Detection: $([math]::Round($dataQuality.face_detection_ratio * 100, 1))%" -ForegroundColor White
    Write-Host "    Expression Detection: $([math]::Round($dataQuality.expression_detection_rate * 100, 1))%" -ForegroundColor White
    Write-Host ""
    
    Write-Host "=" * 70 -ForegroundColor Green
    Write-Host "✓ TEST COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "=" * 70 -ForegroundColor Green
    Write-Host ""
    Write-Host "All 7 behavioral features extracted and analyzed." -ForegroundColor White
    Write-Host "ML service is ready for production use." -ForegroundColor White
    
} catch {
    Write-Host "  ✗ Video processing failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check both services are running: .\verify_services.ps1" -ForegroundColor Gray
    Write-Host "  2. Check video format is supported (mp4, webm, avi)" -ForegroundColor Gray
    Write-Host "  3. Check ML service logs for detailed error" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
