"""
Quick script to check if video features are already in database
from previous uploads.
"""

import requests
import json

BACKEND_URL = "http://localhost:5001"
SCREENING_ID = "6979fe7f40a2e323eafbce64"
EMAIL = "testparent@example.com"
PASSWORD = "testpassword123"

# Login
login_response = requests.post(
    f"{BACKEND_URL}/api/auth/login",
    json={"email": EMAIL, "password": PASSWORD}
)

if login_response.status_code != 200:
    print(f"Login failed: {login_response.status_code}")
    exit(1)

token = login_response.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

# Get screening
get_response = requests.get(
    f"{BACKEND_URL}/api/screenings/{SCREENING_ID}",
    headers=headers
)

if get_response.status_code != 200:
    print(f"Failed to retrieve screening: {get_response.status_code}")
    exit(1)

screening = get_response.json()
features = screening.get('liveVideoFeatures', {})

print("=" * 80)
print("CURRENT DATABASE STATUS")
print("=" * 80)
print(f"\nScreening ID: {SCREENING_ID}")
print(f"Status: {screening.get('status', 'N/A')}")
print(f"Risk Level: {screening.get('riskLevel', 'N/A')}")
print(f"Final Score: {screening.get('finalScore', 0):.1f}%")

print("\n" + "=" * 80)
print("VIDEO FEATURES IN DATABASE")
print("=" * 80)

if not features or not any(features.values()):
    print("\n[NO VIDEO FEATURES FOUND]")
    print("Features object is empty or doesn't exist.")
else:
    print(f"\nEye Contact: {features.get('eyeContactRatio', 0) * 100:.1f}%")
    print(f"Blink Rate: {features.get('blinkRatePerMinute', 0):.1f}/min")
    print(f"Head Movement: {features.get('headMovementRate', 0):.4f}")
    print(f"Hand Stimming: {features.get('handStimming', {}).get('severity', 'N/A')}")
    print(f"Head Stimming: {features.get('headMovements', {}).get('repetitive', False)}")
    print(f"Social Gestures: {features.get('socialGestures', {}).get('frequency_per_minute', 0):.1f}/min")
    print(f"Expression: {features.get('facialExpressionVariability', 0) * 100:.1f}%")
    print(f"Total Frames: {features.get('totalFrames', 0)}")
    print(f"Duration: {features.get('sessionDuration', 0):.1f}s")

print("\n" + "=" * 80)
