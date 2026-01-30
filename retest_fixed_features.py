"""
Test script to verify video features are now properly saved to database
after the uploadVideo function fix.
"""

import requests
import json
from pathlib import Path

# Configuration
BACKEND_URL = "http://localhost:5001"
VIDEO_PATH = r"E:\WIN_20260128_17_06_39_Pro.mp4"  # High-risk autism video
SCREENING_ID = "6979fe7f40a2e323eafbce64"  # Existing screening

# Login credentials
EMAIL = "testparent@example.com"
PASSWORD = "testpassword123"

def test_video_feature_persistence():
    """Test that video features are saved to database"""
    
    print("=" * 80)
    print("VIDEO FEATURE PERSISTENCE TEST")
    print("=" * 80)
    
    # Step 1: Login
    print("\n[1] Logging in...")
    login_response = requests.post(
        f"{BACKEND_URL}/api/auth/login",
        json={"email": EMAIL, "password": PASSWORD}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return
    
    token = login_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Logged in successfully")
    
    # Step 2: Upload video
    print(f"\n[2] Uploading video: {VIDEO_PATH}")
    if not Path(VIDEO_PATH).exists():
        print(f"❌ Video file not found: {VIDEO_PATH}")
        return
    
    with open(VIDEO_PATH, 'rb') as video_file:
        files = {'video': ('test_video.mp4', video_file, 'video/mp4')}
        upload_response = requests.post(
            f"{BACKEND_URL}/api/screenings/{SCREENING_ID}/video",
            files=files,
            headers=headers,
            timeout=600
        )
    
    if upload_response.status_code != 200:
        print(f"❌ Video upload failed: {upload_response.status_code}")
        print(upload_response.text)
        return
    
    upload_data = upload_response.json()
    print("✅ Video uploaded and processed")
    print(f"   Frames processed: {upload_data.get('frames_processed', 'N/A')}")
    print(f"   Duration: {upload_data.get('duration', 'N/A')}s")
    print(f"   FPS: {upload_data.get('fps', 'N/A')}")
    
    # Step 3: Retrieve screening to verify features are saved
    print(f"\n[3] Retrieving screening from database...")
    get_response = requests.get(
        f"{BACKEND_URL}/api/screenings/{SCREENING_ID}",
        headers=headers
    )
    
    if get_response.status_code != 200:
        print(f"❌ Failed to retrieve screening: {get_response.status_code}")
        return
    
    screening = get_response.json()
    features = screening.get('liveVideoFeatures', {})
    
    print("✅ Screening retrieved from database")
    print("\n" + "=" * 80)
    print("VIDEO FEATURES IN DATABASE")
    print("=" * 80)
    
    # Feature 1: Eye Contact
    print(f"\n[1] EYE CONTACT:")
    print(f"   Ratio: {features.get('eyeContactRatio', 0) * 100:.1f}%")
    print(f"   Level: {features.get('eyeContactLevel', 'N/A')}")
    print(f"   Interpretation: {features.get('eyeContactInterpretation', 'N/A')}")
    
    # Feature 2: Blink Rate
    print(f"\n[2] BLINK RATE:")
    print(f"   Rate: {features.get('blinkRatePerMinute', 0):.1f} blinks/min")
    print(f"   Level: {features.get('blinkLevel', 'N/A')}")
    print(f"   Interpretation: {features.get('blinkInterpretation', 'N/A')}")
    
    # Feature 3: Head Movement
    print(f"\n[3] HEAD MOVEMENT:")
    print(f"   Rate: {features.get('headMovementRate', 0):.4f}")
    print(f"   Level: {features.get('headMovementLevel', 'N/A')}")
    print(f"   Interpretation: {features.get('headMovementInterpretation', 'N/A')}")
    
    # Feature 4: Head Stimming
    head_movements = features.get('headMovements', {})
    print(f"\n[4] HEAD STIMMING:")
    print(f"   Present: {head_movements.get('present', False)}")
    print(f"   Repetitive: {head_movements.get('repetitive', False)}")
    print(f"   Description: {head_movements.get('description', 'N/A')}")
    
    # Feature 5: Hand Stimming
    hand_stimming = features.get('handStimming', {})
    print(f"\n[5] HAND STIMMING:")
    print(f"   Present: {hand_stimming.get('present', False)}")
    print(f"   Severity: {hand_stimming.get('severity', 'N/A')}")
    print(f"   Description: {hand_stimming.get('description', 'N/A')}")
    
    # Feature 6: Social Gestures
    gestures = features.get('socialGestures', {})
    print(f"\n[6] SOCIAL GESTURES:")
    print(f"   Present: {gestures.get('present', False)}")
    print(f"   Frequency: {gestures.get('frequency_per_minute', 0):.1f}/min")
    print(f"   Description: {gestures.get('description', 'N/A')}")
    
    # Feature 7: Facial Expression
    print(f"\n[7] FACIAL EXPRESSION:")
    print(f"   Variability: {features.get('facialExpressionVariability', 0) * 100:.1f}%")
    print(f"   Level: {features.get('expressionLevel', 'N/A')}")
    print(f"   Interpretation: {features.get('expressionInterpretation', 'N/A')}")
    
    # Session Metadata
    print(f"\n[SESSION METADATA]:")
    print(f"   Duration: {features.get('sessionDuration', 0):.1f}s")
    print(f"   Total Frames: {features.get('totalFrames', 0)}")
    
    # Clinical Interpretation
    interpretation = features.get('interpretation', {})
    print(f"\n[CLINICAL INTERPRETATION]:")
    print(f"   Risk Level: {interpretation.get('risk_level', 'N/A')}")
    print(f"   Risk Score: {interpretation.get('riskScore', 0) * 100:.1f}%")
    print(f"   Concerns: {', '.join(interpretation.get('concerns', []))}")
    
    # Verification
    print("\n" + "=" * 80)
    print("VERIFICATION")
    print("=" * 80)
    
    all_zeros = (
        features.get('eyeContactRatio', 0) == 0 and
        features.get('blinkRatePerMinute', 0) == 0 and
        features.get('headMovementRate', 0) == 0 and
        features.get('facialExpressionVariability', 0) == 0 and
        features.get('totalFrames', 0) == 0
    )
    
    if all_zeros:
        print("[FAILED]: All features are still zero - features NOT saved!")
        print("   The uploadVideo fix did not work correctly.")
    else:
        print("[SUCCESS]: Video features are now saved to database!")
        print(f"   Eye Contact: {features.get('eyeContactRatio', 0) * 100:.1f}%")
        print(f"   Blink Rate: {features.get('blinkRatePerMinute', 0):.1f}/min")
        print(f"   Total Frames: {features.get('totalFrames', 0)}")
        print(f"   Hand Stimming: {hand_stimming.get('severity', 'N/A')}")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_video_feature_persistence()
