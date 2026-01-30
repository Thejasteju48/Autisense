"""
High-Risk Autism Test Case
Tests complete screening pipeline with video exhibiting:
- Hand stimming
- Head stimming  
- Low eye contact
- Limited gestures
- Limited expressions
"""

import requests
import json
import time
from pathlib import Path
import shutil

# Configuration
BACKEND_URL = "http://localhost:5001/api"
ML_SERVICE_URL = "http://localhost:8000"
VIDEO_SOURCE = r"C:\Users\Thejas\OneDrive\Pictures\Camera Roll\WIN_20260128_17_06_39_Pro.mp4"

# Test credentials
TEST_EMAIL = "test.highRisk@autism.test"
TEST_PASSWORD = "TestPass123!"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def register_and_login():
    """Register test user and get auth token"""
    print_section("STEP 1: Authentication")
    
    # Try to register
    response = requests.post(f"{BACKEND_URL}/auth/register", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "role": "parent",
        "parentFirstName": "Test",
        "parentLastName": "Parent"
    })
    
    if response.status_code == 201:
        print("✓ Test user registered successfully")
        data = response.json()
        # Registration might not return token, need to login
        response = requests.post(f"{BACKEND_URL}/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('data', {}).get('token') or data.get('token')
            user_data = data.get('data', {}).get('user') or data.get('user')
            user_id = user_data.get('_id')
            print(f"✓ Logged in after registration")
            print(f"  User ID: {user_id}")
            print(f"  Token: {token[:20]}...")
            return token, user_id
        else:
            print(f"✗ Login after registration failed")
            return None, None
    elif response.status_code == 400 and "already exists" in response.text.lower():
        print("ℹ Test user already exists, logging in...")
        # Login if already exists
        response = requests.post(f"{BACKEND_URL}/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('data', {}).get('token') or data.get('token')
            user_data = data.get('data', {}).get('user') or data.get('user')
            user_id = user_data.get('_id')
            print(f"✓ Logged in successfully")
            print(f"  User ID: {user_id}")
            print(f"  Token: {token[:20]}...")
            return token, user_id
        else:
            print(f"✗ Login failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return None, None
    else:
        print(f"✗ Registration failed: {response.status_code}")
        print(f"  Response: {response.text}")
        return None, None

def create_screening(token):
    """Create new screening session"""
    print_section("STEP 2: Create Child Profile & Screening")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # First create a child profile
    child_response = requests.post(
        f"{BACKEND_URL}/children",
        headers=headers,
        json={
            "name": "Test Child",
            "ageInMonths": 48,  # 4 years old
            "gender": "male"
        }
    )
    
    if child_response.status_code == 201:
        child_data = child_response.json()
        child = child_data.get('data', {}).get('child') or child_data
        child_id = child.get('_id')
        print(f"✓ Child profile created")
        print(f"  Child ID: {child_id}")
    else:
        print(f"✗ Child creation failed: {child_response.status_code}")
        print(f"  Response: {child_response.text}")
        # Try to get existing children
        children_response = requests.get(f"{BACKEND_URL}/children", headers=headers)
        if children_response.status_code == 200:
            children_data = children_response.json()
            children = children_data.get('data', {}).get('children', [])
            if len(children) > 0:
                child_id = children[0]['_id']
                print(f"ℹ Using existing child profile")
                print(f"  Child ID: {child_id}")
            else:
                print(f"✗ No child profiles found")
                return None
        else:
            print(f"✗ Failed to retrieve child profile")
            return None
    
    # Now create screening
    response = requests.post(
        f"{BACKEND_URL}/screenings/start",
        headers=headers,
        json={
            "childId": child_id,
            "videoSource": "pre-recorded"
        }
    )
    
    if response.status_code == 201:
        screening_data = response.json()
        screening = screening_data.get('data', {}).get('screening') or screening_data
        screening_id = screening.get('_id')
        print(f"✓ Screening created successfully")
        print(f"  Screening ID: {screening_id}")
        print(f"  Video Source: pre-recorded")
        return screening_id
    else:
        print(f"✗ Screening creation failed: {response.status_code}")
        print(f"  Response: {response.text}")
        return None

def upload_video(token, screening_id):
    """Upload video file to screening"""
    print_section("STEP 3: Upload Video")
    
    video_path = Path(VIDEO_SOURCE)
    if not video_path.exists():
        print(f"✗ Video file not found: {VIDEO_SOURCE}")
        return None
    
    print(f"📹 Video: {video_path.name}")
    print(f"📦 Size: {video_path.stat().st_size / (1024*1024):.2f} MB")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    with open(video_path, 'rb') as video_file:
        files = {'video': (video_path.name, video_file, 'video/mp4')}
        
        print("⏳ Uploading and processing video (this may take 30-60 seconds)...")
        start_time = time.time()
        
        response = requests.post(
            f"{BACKEND_URL}/screenings/{screening_id}/video",
            headers=headers,
            files=files,
            timeout=180  # 3 minutes timeout
        )
        
        elapsed = time.time() - start_time
        print(f"⏱️  Processing completed in {elapsed:.1f} seconds")
    
    if response.status_code == 200:
        data = response.json()
        features = data.get('videoData') or data.get('features')
        
        print(f"✓ Video processed successfully")
        print(f"\n📊 Extracted Features:")
        print(f"  • Eye Contact: {features.get('eye_contact_ratio', 0)*100:.1f}% ({features.get('eye_contact_level', 'unknown')})")
        print(f"  • Blink Rate: {features.get('blink_rate_per_minute', 0):.1f} blinks/min ({features.get('blink_level', 'unknown')})")
        print(f"  • Head Movement: {features.get('head_movement_avg_per_frame', 0):.4f} ({features.get('head_movement_level', 'unknown')})")
        
        head_stimming = features.get('head_movements', {})
        print(f"  • Head Stimming: {'PRESENT' if head_stimming.get('repetitive') else 'Absent'}")
        
        hand_stimming = features.get('hand_stimming', {})
        print(f"  • Hand Stimming: {hand_stimming.get('severity', 'ABSENT')}")
        
        gestures = features.get('social_gestures', {})
        print(f"  • Social Gestures: {gestures.get('frequency_per_minute', 0):.1f} per minute")
        
        print(f"  • Expression Variability: {features.get('facial_expression_variability', 0)*100:.1f}% ({features.get('expression_level', 'unknown')})")
        
        print(f"\n📈 Session Info:")
        print(f"  • Duration: {features.get('sessionDuration', 0):.1f} seconds")
        print(f"  • Frames Processed: {features.get('totalFrames', 0)}")
        
        return features
    else:
        print(f"✗ Video processing failed: {response.status_code}")
        print(f"  Response: {response.text}")
        return None

def submit_questionnaire(token, screening_id):
    """Submit questionnaire with all 'no' answers + family history 'yes'"""
    print_section("STEP 4: Submit Questionnaire")
    
    # All answers are "no" (indicating no symptoms) except family history
    # Note: Low scores indicate no symptoms, which will contrast with video findings
    answers = {
        "q1": "no",   # Social smile
        "q2": "no",   # Interest in other children
        "q3": "no",   # Pretend play
        "q4": "no",   # Pointing to show interest
        "q5": "no",   # Pointing to request
        "q6": "no",   # Following pointing
        "q7": "no",   # Bringing objects to show
        "q8": "no",   # Eye contact
        "q9": "no",   # Unusual finger movements
        "q10": "no",  # Unusual body movements
        "q11": "no",  # Staring at nothing
        "q12": "no",  # Response to name
        "q13": "no",  # Facial expressions match situation
        "q14": "no",  # Shows interest in activities
        "q15": "no",  # Response to emotions
        "q16": "no",  # Orienting to voice
        "q17": "no",  # Smile back
        "q18": "no",  # Everyday activities easily
        "q19": "no",  # Unusual interest in objects
        "q20": "no",  # Repetitive movements with objects
        "familyHistory": "yes"  # IMPORTANT: Family history of autism
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BACKEND_URL}/screenings/{screening_id}/questionnaire",
        headers=headers,
        json={"answers": answers}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Questionnaire submitted successfully")
        print(f"\n📋 Questionnaire Analysis:")
        print(f"  • All behavioral questions: NO (no parent-reported symptoms)")
        print(f"  • Family history of autism: YES")
        print(f"  • This creates interesting contrast with video findings")
        return data
    else:
        print(f"✗ Questionnaire submission failed: {response.status_code}")
        print(f"  Response: {response.text}")
        return None

def get_results(token, screening_id):
    """Retrieve final screening results"""
    print_section("STEP 5: Final Results")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{BACKEND_URL}/screenings/{screening_id}",
        headers=headers
    )
    
    if response.status_code == 200:
        screening = response.json()
        
        print(f"✓ Screening completed")
        print(f"\n🎯 RISK ASSESSMENT:")
        print(f"  • Status: {screening.get('status', 'unknown')}")
        print(f"  • Risk Level: {screening.get('riskLevel', 'unknown')}")
        print(f"  • Confidence: {screening.get('predictionConfidence', 0)*100:.1f}%")
        
        if screening.get('clinicalInsights'):
            insights = screening['clinicalInsights']
            print(f"\n💡 Clinical Insights:")
            print(f"  • Concerns Identified: {len(insights.get('concernsIdentified', []))}")
            for concern in insights.get('concernsIdentified', []):
                print(f"    - {concern}")
        
        # Check for discrepancy between questionnaire and video
        questionnaire_pred = screening.get('questionnairePrediction', {})
        video_pred = screening.get('videoBehaviorPrediction', {})
        
        print(f"\n📊 Detailed Predictions:")
        print(f"  • Questionnaire Score: {questionnaire_pred.get('probability', 0)*100:.1f}%")
        print(f"  • Video Behavior Score: {video_pred.get('autism_score', 0):.1f}")
        print(f"  • Combined Prediction: {screening.get('predictionConfidence', 0)*100:.1f}%")
        
        if screening.get('pdfReportPath'):
            print(f"\n📄 Report Generated: {screening['pdfReportPath']}")
        
        return screening
    else:
        print(f"✗ Failed to retrieve results: {response.status_code}")
        return None

def main():
    """Run complete high-risk test"""
    print("\n" + "="*60)
    print("  HIGH-RISK AUTISM SCREENING TEST")
    print("  Testing with video showing:")
    print("  ✓ Hand stimming")
    print("  ✓ Head stimming")
    print("  ✓ Low eye contact")
    print("  ✓ Limited gestures")
    print("  ✓ Limited expressions")
    print("="*60)
    
    # Step 1: Authenticate
    token, user_id = register_and_login()
    if not token:
        print("\n✗ Authentication failed. Exiting.")
        return
    
    # Step 2: Create screening
    screening_id = create_screening(token)
    if not screening_id:
        print("\n✗ Screening creation failed. Exiting.")
        return
    
    # Step 3: Upload video
    video_features = upload_video(token, screening_id)
    if not video_features:
        print("\n✗ Video processing failed. Exiting.")
        return
    
    # Step 4: Submit questionnaire
    questionnaire_result = submit_questionnaire(token, screening_id)
    if not questionnaire_result:
        print("\n✗ Questionnaire submission failed. Exiting.")
        return
    
    # Step 5: Get final results
    final_results = get_results(token, screening_id)
    
    if final_results:
        print("\n" + "="*60)
        print("  ✓ TEST COMPLETED SUCCESSFULLY")
        print("="*60)
        print(f"\nScreening ID: {screening_id}")
        print(f"Final Risk Level: {final_results.get('riskLevel', 'unknown')}")
        print(f"Confidence: {final_results.get('predictionConfidence', 0)*100:.1f}%")
    else:
        print("\n✗ Test completed with errors")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
