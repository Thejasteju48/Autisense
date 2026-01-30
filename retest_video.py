"""
Quick retest - Upload video to new screening and check features are saved
"""
import requests

BACKEND_URL = "http://localhost:5001/api"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NzlmZDlkNDBhMmUzMjNlYWZiY2UyZSIsImlhdCI6MTc2OTYwMjQ5NCwiZXhwIjoxNzcwMjA3Mjk0fQ.i1qOGcBZa0LqgSm5b6edBfUyyDYxQ0UeP8GGCZK6UgM"
VIDEO_PATH = r"C:\Users\Thejas\OneDrive\Pictures\Camera Roll\WIN_20260128_17_06_39_Pro.mp4"

print("="*70)
print("  RETEST: Upload video and verify features are saved")
print("="*70)

headers = {"Authorization": f"Bearer {TOKEN}"}

# Create new child
print("\n1. Creating child profile...")
child_response = requests.post(
    f"{BACKEND_URL}/children",
    headers=headers,
    json={"name": "Retest Child", "ageInMonths": 48, "gender": "male"}
)
child_id = child_response.json()['data']['child']['_id']
print(f"   Child ID: {child_id}")

# Create new screening
print("\n2. Creating screening...")
screening_response = requests.post(
    f"{BACKEND_URL}/screenings/start",
    headers=headers,
    json={"childId": child_id, "videoSource": "pre-recorded"}
)
screening_id = screening_response.json()['data']['screening']['_id']
print(f"   Screening ID: {screening_id}")

# Upload video
print(f"\n3. Uploading video... (this will take ~60 seconds)")
with open(VIDEO_PATH, 'rb') as video_file:
    files = {'video': ('test_video.mp4', video_file, 'video/mp4')}
    response = requests.post(
        f"{BACKEND_URL}/screenings/{screening_id}/video",
        headers=headers,
        files=files,
        timeout=300
    )

if response.status_code == 200:
    data = response.json()
    features = data.get('videoData', data.get('features', {}))
    
    print("\n✅ VIDEO UPLOADED AND PROCESSED")
    print("="*70)
    print(f"Frames Processed: {data.get('frames_processed', 0)}")
    print(f"Duration: {data.get('duration', 0)}s")
    print(f"FPS: {data.get('fps', 0):.1f}")
    
    print("\n📊 EXTRACTED FEATURES:")
    print(f"  Eye Contact: {features.get('eye_contact_ratio', 0)*100:.1f}% ({features.get('eye_contact_level', 'unknown')})")
    print(f"  Blink Rate: {features.get('blink_rate_per_minute', 0):.1f} blinks/min ({features.get('blink_level', 'unknown')})")
    print(f"  Head Movement: {features.get('head_movement_avg_per_frame', 0):.4f} ({features.get('head_movement_level', 'unknown')})")
    
    hm = features.get('head_movements', {})
    print(f"  Head Stimming: {'PRESENT' if hm.get('repetitive') else 'Absent'}")
    
    hs = features.get('hand_stimming', {})
    print(f"  Hand Stimming: {hs.get('severity', 'ABSENT')}")
    
    sg = features.get('social_gestures', {})
    print(f"  Social Gestures: {sg.get('frequency_per_minute', 0):.1f}/min")
    
    print(f"  Expressions: {features.get('facial_expression_variability', 0)*100:.1f}% ({features.get('expression_level', 'unknown')})")
    
    # Verify saved to database
    print("\n4. Verifying features saved to database...")
    import time
    time.sleep(2)
    
    verify_response = requests.get(f"{BACKEND_URL}/screenings/{screening_id}", headers=headers)
    saved_screening = verify_response.json()['data']['screening']
    saved_features = saved_screening.get('liveVideoFeatures', {})
    
    print(f"\n💾 DATABASE VERIFICATION:")
    print(f"  Eye Contact: {saved_features.get('eyeContactRatio', 0)*100:.1f}%")
    print(f"  Blink Rate: {saved_features.get('blinkRatePerMinute', 0):.1f} blinks/min")
    print(f"  Total Frames: {saved_features.get('totalFrames', 0)}")
    print(f"  Session Duration: {saved_features.get('sessionDuration', 0)}s")
    
    if saved_features.get('totalFrames', 0) > 0:
        print("\n✅ SUCCESS: Features correctly saved to database!")
    else:
        print("\n❌ FAILED: Features not saved to database")
else:
    print(f"\n❌ Upload failed: {response.status_code}")
    print(response.text)
