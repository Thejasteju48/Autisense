"""
Complete the high-risk screening test - submit questionnaire and get results
"""
import requests

BACKEND_URL = "http://localhost:5001/api"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NzlmZDlkNDBhMmUzMjNlYWZiY2UyZSIsImlhdCI6MTc2OTYwMjQ5NCwiZXhwIjoxNzcwMjA3Mjk0fQ.i1qOGcBZa0LqgSm5b6edBfUyyDYxQ0UeP8GGCZK6UgM"
SCREENING_ID = "6979fe7f40a2e323eafbce64"

print("="*60)
print("  COMPLETING HIGH-RISK SCREENING")
print("="*60)

# Submit questionnaire
print("\n1. Submitting questionnaire...")
headers = {"Authorization": f"Bearer {TOKEN}"}

# All "no" answers (no symptoms reported) + family history "yes"
# Format: array of {question, answer} objects
responses = [
    {"question": f"Q{i}", "answer": False} for i in range(1, 21)
]

payload = {
    "responses": responses,
    "jaundice": "no",
    "family_asd": "yes"  # YES - family history of autism
}

response = requests.post(
    f"{BACKEND_URL}/screenings/{SCREENING_ID}/questionnaire",
    headers=headers,
    json=payload
)

if response.status_code == 200:
    print("✓ Questionnaire submitted")
else:
    print(f"✗ Questionnaire failed: {response.status_code}")
    print(response.text)
    exit(1)

# Get final results
print("\n2. Retrieving final results...")
response = requests.get(
    f"{BACKEND_URL}/screenings/{SCREENING_ID}",
    headers=headers
)

if response.status_code == 200:
    result = response.json()
    screening = result.get('data', {}).get('screening') or result
    
    print("\n" + "="*60)
    print("  RESULTS")
    print("="*60)
    
    print(f"\nScreening ID: {screening.get('_id', SCREENING_ID)}")
    print(f"Status: {screening.get('status', 'unknown')}")
    print(f"Risk Level: {screening.get('riskLevel', 'N/A')}")
    print(f"Confidence: {screening.get('predictionConfidence', 0)*100:.1f}%")
    
    # Video features
    if screening.get('liveVideoFeatures'):
        features = screening['liveVideoFeatures']
        print("\n📹 VIDEO ANALYSIS:")
        print(f"  • Eye Contact: {features.get('eyeContactRatio', 0)*100:.1f}% ({features.get('eyeContactLevel', 'unknown')})")
        print(f"  • Blink Rate: {features.get('blinkRatePerMinute', 0):.1f} blinks/min ({features.get('blinkLevel', 'unknown')})")
        print(f"  • Head Movement: {features.get('headMovementRate', 0):.4f} ({features.get('headMovementLevel', 'unknown')})")
        
        head_mv = features.get('headMovements', {})
        print(f"  • Head Stimming: {'PRESENT' if head_mv.get('repetitive') else 'Absent'}")
        
        hand = features.get('handStimming', {})
        print(f"  • Hand Stimming: {hand.get('severity', 'ABSENT')}")
        
        gestures = features.get('socialGestures', {})
        print(f"  • Social Gestures: {gestures.get('frequency_per_minute', 0):.1f}/min")
        
        print(f"  • Expression Variability: {features.get('facialExpressionVariability', 0)*100:.1f}% ({features.get('expressionLevel', 'unknown')})")
    
    # Predictions
    if screening.get('questionnairePrediction'):
        qp = screening['questionnairePrediction']
        print(f"\n📋 QUESTIONNAIRE: {qp.get('probability', 0)*100:.1f}% autism probability")
        print(f"   Classification: {qp.get('classification', 'N/A')}")
    
    if screening.get('videoBehaviorPrediction'):
        vp = screening['videoBehaviorPrediction']
        print(f"\n🎥 VIDEO BEHAVIOR: {vp.get('autism_score', 0):.1f} autism score")
        print(f"   Risk Level: {vp.get('risk_level', 'N/A')}")
    
    # Clinical insights
    if screening.get('clinicalInsights'):
        ci = screening['clinicalInsights']
        concerns = ci.get('concernsIdentified', [])
        print(f"\n⚠️  CONCERNS IDENTIFIED ({len(concerns)}):")
        for concern in concerns:
            print(f"   • {concern}")
        
        recommendations = ci.get('recommendations', [])
        if recommendations:
            print(f"\n💡 RECOMMENDATIONS:")
            for rec in recommendations:
                print(f"   • {rec}")
    
    if screening.get('pdfReportPath'):
        print(f"\n📄 PDF Report: {screening['pdfReportPath']}")
    
    print("\n" + "="*60)
    print("  TEST COMPLETE")
    print("="*60)
else:
    print(f"✗ Failed to get results: {response.status_code}")
    print(response.text)
