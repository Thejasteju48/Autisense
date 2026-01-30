# Video Feature Format Verification Report

## Executive Summary

This document verifies the complete data format flow from ML Service → Backend → Database → PDF/Groq/Frontend across all 7 behavioral features.

**Status**: ✅ All format mappings are CORRECT and CONSISTENT

---

## 1. ML Service Output Format (Python - Snake Case)

**File**: `ml-service/services/features/video_orchestrator.py`

```python
{
    # Feature 1: Eye Contact
    "eye_contact_ratio": float,
    "eye_contact_level": str,
    "eye_contact_interpretation": str,
    
    # Feature 2: Blink Rate
    "blink_rate_per_minute": float,
    "blink_level": str,
    "blink_interpretation": str,
    
    # Feature 3: Head Movement
    "head_movement_avg_per_frame": float,
    "head_movement_level": str,
    "head_movement_interpretation": str,
    
    # Feature 4: Head Repetitive Movements
    "head_movements": {
        "present": bool,
        "repetitive": bool,
        "description": str
    },
    
    # Feature 5: Hand Stimming
    "hand_stimming": {
        "present": bool,
        "severity": str,
        "description": str
    },
    
    # Feature 6: Social Gestures
    "social_gestures": {
        "present": bool,
        "frequency_per_minute": float,
        "description": str
    },
    
    # Feature 7: Facial Expression
    "facial_expression_variability": float,
    "expression_level": str,
    "expression_interpretation": str,
    
    # Session Metadata
    "sessionDuration": float,
    "totalFrames": int,
    
    # Clinical Interpretation
    "clinical_interpretation": {
        "concerns": list,
        "riskScore": float,
        "risk_level": str,
        "summary": str,
        "total_concerns": int
    }
}
```

---

## 2. Backend Input Mapping (JavaScript - Camel Case)

### 2.1 uploadVideo Function
**File**: `backend/controllers/screeningController.js` (Lines 600-655)

```javascript
const videoData = mlResponse.data.features; // ML service output

screening.liveVideoFeatures = {
    // Feature 1: Eye Contact
    eyeContactRatio: videoData.eye_contact_ratio || 0,
    eyeContactLevel: videoData.eye_contact_level || 'unknown',
    eyeContactInterpretation: videoData.eye_contact_interpretation || '',
    
    // Feature 2: Blink Rate
    blinkRatePerMinute: videoData.blink_rate_per_minute || 0,
    blinkLevel: videoData.blink_level || 'unknown',
    blinkInterpretation: videoData.blink_interpretation || '',
    
    // Feature 3: Head Movement
    headMovementRate: videoData.head_movement_avg_per_frame || 0,
    headMovementLevel: videoData.head_movement_level || 'unknown',
    headMovementInterpretation: videoData.head_movement_interpretation || '',
    
    // Feature 4: Head Repetitive Movements
    headMovements: videoData.head_movements || {...},
    
    // Feature 5: Hand Stimming
    handStimming: videoData.hand_stimming || {...},
    
    // Feature 6: Social Gestures
    socialGestures: videoData.social_gestures || {...},
    
    // Feature 7: Facial Expression
    facialExpressionVariability: videoData.facial_expression_variability || 0,
    expressionLevel: videoData.expression_level || 'unknown',
    expressionInterpretation: videoData.expression_interpretation || '',
    
    // Session Metadata
    sessionDuration: videoData.sessionDuration || 0,
    totalFrames: videoData.totalFrames || 0,
    
    // Clinical Interpretation
    interpretation: videoData.clinical_interpretation || {...}
};

await screening.save(); // ✅ FIXED: Now saves to database
```

**Mapping**: ✅ Snake case → Camel case conversion correct

### 2.2 submitQuestionnaire Function
**File**: `backend/controllers/screeningController.js` (Lines 110-180)

```javascript
if (videoData && Object.keys(videoData).length > 0) {
    screening.liveVideoFeatures = {
        eyeContactRatio: videoData.eye_contact_ratio || 0,
        // ... same mapping as uploadVideo
    };
}
```

**Mapping**: ✅ Same correct mapping as uploadVideo

---

## 3. Database Schema (MongoDB)

**File**: `backend/models/Screening.js`

```javascript
liveVideoFeatures: {
    // Feature 1
    eyeContactRatio: Number,
    eyeContactLevel: String,
    eyeContactInterpretation: String,
    
    // Feature 2
    blinkRatePerMinute: Number,
    blinkLevel: String,
    blinkInterpretation: String,
    
    // Feature 3
    headMovementRate: Number,
    headMovementLevel: String,
    headMovementInterpretation: String,
    
    // Feature 4
    headMovements: {
        present: Boolean,
        repetitive: Boolean,
        description: String
    },
    
    // Feature 5
    handStimming: {
        present: Boolean,
        severity: String,
        description: String
    },
    
    // Feature 6
    socialGestures: {
        present: Boolean,
        frequency_per_minute: Number,
        description: String
    },
    
    // Feature 7
    facialExpressionVariability: Number,
    expressionLevel: String,
    expressionInterpretation: String,
    
    // Metadata
    sessionDuration: Number,
    totalFrames: Number,
    
    // Interpretation
    interpretation: Object,
    
    // Quality
    dataQuality: Object
}
```

**Format**: ✅ Camel case (matches backend mapping)

---

## 4. PDF Service (Report Generation)

**File**: `backend/services/pdfService.js` (Lines 130-190)

```javascript
const features = screening.liveVideoFeatures;

// Direct camelCase access (no conversion needed)
doc.text(`Eye Contact: ${features.eyeContactRatio * 100}% - ${features.eyeContactLevel}`);
doc.text(`Blink Rate: ${features.blinkRatePerMinute} blinks/min - ${features.blinkLevel}`);
doc.text(`Head Movement: ${features.headMovementRate} - ${features.headMovementLevel}`);
doc.text(`Head Stimming: ${features.headMovements?.repetitive ? 'Present' : 'Absent'}`);
doc.text(`Hand Stimming: ${features.handStimming?.present ? 'Present' : 'Absent'}`);
doc.text(`Social Gestures: ${features.socialGestures?.frequency_per_minute}/min`);
doc.text(`Facial Expression: ${features.facialExpressionVariability * 100}%`);
```

**Mapping**: ✅ Reads camelCase directly from database

---

## 5. Groq Service (AI Analysis)

**File**: `backend/services/groqService.js` (Lines 30-55)

```javascript
const { liveVideoFeatures } = screeningData;

// Direct camelCase access (no conversion needed)
`Eye Contact: ${liveVideoFeatures.eyeContactRatio * 100}% - ${liveVideoFeatures.eyeContactLevel}`
`Blink Rate: ${liveVideoFeatures.blinkRatePerMinute} blinks/min - ${liveVideoFeatures.blinkLevel}`
`Head Movement: ${liveVideoFeatures.headMovementRate} - ${liveVideoFeatures.headMovementLevel}`
`Head Stimming: ${liveVideoFeatures.headMovements?.repetitive ? 'Present' : 'Absent'}`
`Hand Stimming: ${liveVideoFeatures.handStimming?.present ? 'Present' : 'Absent'}`
`Social Gestures: ${liveVideoFeatures.socialGestures?.frequency_per_minute}/min`
`Facial Expression: ${liveVideoFeatures.facialExpressionVariability * 100}%`
```

**Mapping**: ✅ Reads camelCase directly from database

---

## 6. Frontend (React Components)

### 6.1 VideoUploader Component
**File**: `frontend/src/components/VideoUploader.jsx` (Line 178)

```javascript
onComplete({
    videoSource: 'pre-recorded',
    videoData: response.data.videoData || response.data.features
});
```

**Mapping**: ✅ Passes ML service features (snake_case) to parent

### 6.2 VideoRecorder Component
**File**: `frontend/src/components/VideoRecorder.jsx` (Line 215)

```javascript
onComplete({
    videoSource: 'live-recording',
    duration: timeElapsed,
    videoData: response.data.features || {}
});
```

**Mapping**: ✅ Passes ML service features (snake_case) to parent

### 6.3 ScreeningFlow Component
**File**: `frontend/src/pages/ScreeningFlow.jsx` (Lines 115-122)

```javascript
const videoFeaturesToSend = videoData?.videoData || {};

await screeningAPI.submitQuestionnaire(screeningId, {
    responses: questionnaireData.responses,
    jaundice: questionnaireData.jaundice,
    family_asd: questionnaireData.family_asd,
    videoData: videoFeaturesToSend,  // ML service format (snake_case)
    videoSource: videoData?.videoSource || 'pre-recorded'
});
```

**Mapping**: ✅ Sends ML service features (snake_case) to backend, which converts to camelCase

---

## 7. Complete Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  ML SERVICE (Python)                                         │
│  Output: snake_case                                          │
│  - eye_contact_ratio                                         │
│  - blink_rate_per_minute                                     │
│  - head_movement_avg_per_frame                               │
│  - hand_stimming                                             │
│  - social_gestures                                           │
│  - facial_expression_variability                             │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP Response
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND (Node.js)                                           │
│  Receives: snake_case                                        │
│  Converts: snake_case → camelCase                            │
│  Saves: camelCase                                            │
│  - eyeContactRatio                                           │
│  - blinkRatePerMinute                                        │
│  - headMovementRate                                          │
│  - handStimming                                              │
│  - socialGestures                                            │
│  - facialExpressionVariability                               │
└─────────────────┬───────────────────────────────────────────┘
                  │ MongoDB Save
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  DATABASE (MongoDB)                                          │
│  Stored: camelCase                                           │
│  Schema: liveVideoFeatures object                            │
└─────────────────┬───────────────────────────────────────────┘
                  │ Direct Read (no conversion)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  PDF SERVICE, GROQ SERVICE, FRONTEND                         │
│  Reads: camelCase (directly from database)                   │
│  - features.eyeContactRatio                                  │
│  - liveVideoFeatures.blinkRatePerMinute                      │
│  - liveVideoFeatures.handStimming                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Issues Found and Fixed

### ❌ Previous Issues (Before Fix)

1. **Video Features Not Saved**: The `uploadVideo` function returned features to frontend but never saved to database
   - Result: All features showed as 0/absent in results
   - Impact: Video analysis ignored in final risk calculation

### ✅ Current Status (After Fix)

1. **Video Features Saved**: Added `screening.liveVideoFeatures = {...}` and `await screening.save()`
2. **Format Mappings**: All verified correct across all services
3. **Backend Running**: Server started successfully on port 5001

---

## 9. Verification Checklist

| Component | Format | Mapping | Status |
|-----------|--------|---------|--------|
| ML Service Output | snake_case | N/A | ✅ |
| Backend uploadVideo | snake→camel | ✅ Correct | ✅ |
| Backend submitQuestionnaire | snake→camel | ✅ Correct | ✅ |
| Database Schema | camelCase | N/A | ✅ |
| PDF Service | camelCase | ✅ Direct read | ✅ |
| Groq Service | camelCase | ✅ Direct read | ✅ |
| Frontend VideoUploader | snake_case | ✅ Pass-through | ✅ |
| Frontend VideoRecorder | snake_case | ✅ Pass-through | ✅ |
| Frontend ScreeningFlow | snake_case | ✅ Pass-through | ✅ |

---

## 10. Test Plan

### Test Script Created: `retest_fixed_features.py`

**Purpose**: Verify video features are now saved to database

**Steps**:
1. Login with test credentials
2. Upload high-risk autism video
3. Retrieve screening from database
4. Verify all 7 features are populated (not zeros)

**Expected Results**:
- Eye Contact Ratio > 0%
- Blink Rate > 0/min
- Total Frames > 0
- Hand Stimming detected with severity level
- All interpretation fields populated

**Run Command**:
```bash
cd D:\AutismProject
python retest_fixed_features.py
```

---

## 11. Conclusion

✅ **All format mappings are correct and consistent across the entire stack**

The only issue was video features not being saved to the database. This has been fixed by adding the save logic to the `uploadVideo` function.

**Next Steps**:
1. Run `retest_fixed_features.py` to verify fix works
2. Ensure backend is running (`node server.js`)
3. Upload test video and verify features saved
4. Generate PDF report with video data
5. Verify Groq analysis includes video features (after fixing API key)

---

## 12. Code Changes Summary

**File**: `backend/controllers/screeningController.js`

**Change**: Added video feature save logic at lines 600-655

**Before**:
```javascript
// Return features to frontend only
res.json({
    success: true,
    videoData: mlResponse.data.features,
    // ...
});
```

**After**:
```javascript
// Save features to database FIRST
screening.liveVideoFeatures = {
    eyeContactRatio: videoData.eye_contact_ratio || 0,
    // ... all 7 features + metadata
};
await screening.save();

// THEN return to frontend
res.json({
    success: true,
    videoData: mlResponse.data.features,
    // ...
});
```

**Impact**: Video features now persist in database and are available for PDF, Groq, and result display.

---

**Document Generated**: January 29, 2026
**Status**: Backend Running ✅ | Format Verified ✅ | Ready for Testing
