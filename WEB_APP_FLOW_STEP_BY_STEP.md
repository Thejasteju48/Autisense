# Web App Flow - Step by Step Guide

## Complete User Journey from Start to Finish

---

## Step 1: User Registration & Login
**Page:** `/login` or `/register`
**File:** [frontend/src/pages/Auth.jsx](frontend/src/pages/Auth.jsx)

```
User enters:
├─ Email
├─ Password
└─ Full Name (registration only)

↓
Backend validation (JWT token generation)
↓
Redirect to Dashboard
```

---

## Step 2: Dashboard - View Children & Previous Screenings
**Page:** `/dashboard`
**File:** [frontend/src/pages/Dashboard.jsx](frontend/src/pages/Dashboard.jsx)

**Options:**
1. **View existing children** from database
2. **Add new child** (name, age, gender, DOB)
3. **View screening history** (all previous screenings)
4. **View results** from past screenings

```
Dashboard displays:
├─ List of children
│  ├─ Name
│  ├─ Age
│  └─ Last screening date
├─ Previous screenings
│  ├─ Date
│  ├─ Risk Level
│  └─ [View Results] button
└─ [Start New Screening] button
```

---

## Step 3: Start Screening Session
**Page:** `/screening/start`
**Action Button:** "Start New Screening"

**Backend API Call:**
```
POST /api/screenings/start
Body: { childId }

Response: { screeningId, questionnaire }
```

**Database Entry:**
```
Screening Document Created:
├─ _id: screening ID (unique)
├─ child: reference to child
├─ user: reference to parent
├─ status: "started"
├─ createdAt: timestamp
└─ questions: 20-question list
```

---

## Step 4: Behavioral Assessment (Live Video/Recorded)
**Page:** `/screening/{screeningId}/video`
**File:** [frontend/src/pages/VideoScreening.jsx](frontend/src/pages/VideoScreening.jsx)

**Two Options:**

### Option A: Live Camera Recording
- **Duration:** 2-3 minutes
- **Actions:** Child looks at camera, reacts to stimuli, waves hand
- **Processing:** Real-time detection using MediaPipe
- **Output:** 6 behavioral markers captured

### Option B: Upload Pre-recorded Video
- **File:** MP4, MOV, or WebM
- **Duration:** 2-3 minutes
- **Processing:** MediaPipe analysis on uploaded file

**Behavioral Markers Extracted:**
```
1. Eye Contact - Normal/Low
2. Head Stimming - Present/Absent
3. Hand Stimming - Present/Absent
4. Hand Gesture - Present/Absent
5. Social Reciprocity - Low/Normal
6. Emotion Variation - Low/Normal
```

**ML Service Processing (Port 8000):**
```
Video → MediaPipe Detection → 6 markers → Store in DB
```

---

## Step 5: Questionnaire - 20 Questions
**Page:** `/screening/{screeningId}/questionnaire`
**File:** [frontend/src/pages/Questionnaire.jsx](frontend/src/pages/Questionnaire.jsx)

**Questions Format (Yes/No answers):**
```
1. Does the child make eye contact during conversations?
2. Does the child respond to their name when called?
3. Does the child show interest in other children?
4. Does the child engage in pretend play?
5. Does the child point to show interest in something?
... (15 more questions)
```

**Additional Questions:**
- Was the child born with jaundice? (Yes/No)
- Family history of autism? (Yes/No)
- Child's location (city, state, country)

**Backend API Call:**
```
POST /api/screenings/{screeningId}/questionnaire
Body: {
  responses: [{ question, answer }...],
  jaundice: "yes/no",
  family_asd: "yes/no",
  parentLocation: { city, state, country }
}

Response: { score, totalQuestions, yesCount }
```

---

## Step 6: Video Analysis & ML Processing
**Triggered After:** Video upload completes

**ML Service Workflow (Port 8000):**

```
Video File
  ↓
Frame Extraction (30 FPS)
  ↓
MediaPipe Analysis in Parallel:
├─ Eye Contact Detector → EAR (Eye Aspect Ratio)
├─ Hand Gesture Detector → Wave/Stimming detection
├─ Head Stimming Detector → Stability assessment
├─ Hand Stimming Detector → Movement patterns
└─ Social Reciprocity → Combined assessment

  ↓
Results Stored: { eye_contact, hand_gesture, head_stimming, etc. }
```

**Emotion Service Workflow (Port 8001):**

```
Video File
  ↓
Frame Extraction
  ↓
Face Detection (Haar Cascade) for each frame
  ↓
Crop & Resize to 64×64 pixels
  ↓
PyTorch CNN Classification
  ↓
6 Emotion Classes: Happy, Sad, Neutral, Angry, Surprised, Disgusted
  ↓
Entropy Calculation → Emotion Variation (Low/Normal)
```

---

## Step 7: Screening Completion & Final Score
**Page:** `/screening/{screeningId}/complete`

**Backend Processing:**
```
POST /api/screenings/{screeningId}/complete

Combines:
1. Video analysis (6 behavioral markers)
2. Questionnaire responses (20 questions)
3. Medical history (jaundice, family ASD)
4. Child demographics (age, gender)

Final Score Calculation:
├─ Behavioral score (from 6 markers)
├─ Questionnaire score (yes answers %)
├─ Risk prediction (ML model)
└─ Risk Level: Low / Moderate / High
```

**Database Update:**
```
Screening Document Updated:
├─ status: "completed"
├─ finalScore: 0-100
├─ riskLevel: "Low" | "Moderate" | "High"
├─ liveVideoFeatures: { all 6 markers }
├─ questionnaire: { all responses }
├─ interpretation: { summary, recommendations }
└─ completedAt: timestamp
```

---

## Step 8: Results Display
**Page:** `/screening/{screeningId}/results` or `/screening-results`
**File:** [frontend/src/pages/ScreeningResults.jsx](frontend/src/pages/ScreeningResults.jsx)

**Displays:**

### A. Risk Assessment Card
```
Risk Level: [Low/Moderate/High]
Final Score: [0-100]%
Interpretation: [AI-generated summary]
```

### B. Behavioral Assessment Table
```
| Indicator | Observation | Clinical Note |
|-----------|-------------|---------------|
| Eye Contact | Normal/Low | Maintains gaze |
| Hand Gestures | Present/Absent | Waving behavior |
| Head Movements | Present/Absent | Repetitive motion |
| Social Interaction | [Score] | Reciprocity level |
| Emotional Expression | Normal/Low | Variation range |
```

### C. Nearby Autism Support Centers
```
Fetches: Top 3 nearest centers
├─ Center Name
├─ Address
├─ Distance (km)
└─ Navigate button (Google Maps)
```

### D. Recommendations
```
Based on Risk Level:
├─ High: Immediate specialist evaluation
├─ Moderate: Developmental follow-up
└─ Low: Continue monitoring
```

### E. Action Buttons
```
[← View History] [Open AI Assistant] [Download Medical Report] [Start New Screening →]
```

---

## Step 9: Download Medical Report
**Button:** "Download Medical Report"
**Page:** `/screening/{screeningId}/results`

**Backend API Call:**
```
GET /api/screenings/{screeningId}/report

Processing (in parallel):
1. Groq LLM generates clinical analysis
2. Extract indicator explanations
3. Fetch nearby autism centers
4. Compile all data

Returns: PDF file (screening-report-{childName}-{date}.pdf)
```

**PDF Report Contents:**
```
├─ Patient & Guardian Details
├─ Behavioral Assessment Table
├─ Detailed Findings (all 6 markers)
├─ Assessment Summary
├─ Questionnaire Observations
├─ Clinical Impression
├─ AI Clinical Explanation
├─ Recommendations (dynamic by risk level)
├─ Nearby Support Centers
└─ Medical Disclaimer
```

---

## Step 10: AI Chatbot Assistant (RAG)
**Page:** `/screening/{screeningId}/chat`
**File:** [frontend/src/pages/ChatAssistant.jsx](frontend/src/pages/ChatAssistant.jsx)

**Features:**
```
Chat Interface:
├─ Previous messages display
├─ Question input box
├─ Language selector (EN/HI/KN)
├─ Optional: Upload report PDF
└─ [Send] button
```

**Backend RAG Pipeline:**

```
User Question
  ↓
POST /api/chat/{screeningId}/send

Backend Processing:
1. Extract screening data from MongoDB
2. Format system prompt
3. Call RAG Service (Port 8002)

RAG Service Processing:
1. Encode question → 384D vector (Sentence Transformers)
2. Search ChromaDB for relevant report sections
3. Retrieve top 3 chunks (cosine similarity)
4. Compile context:
   ├─ System prompt
   ├─ Retrieved report sections
   ├─ Screening data (risk, markers, age)
   ├─ Conversation history
   └─ Parent question
5. Call Groq LLM → Generate answer
6. Return response

Backend:
1. Store message in MongoDB ChatSession
2. Return response to frontend

Frontend:
1. Display answer in chat bubble
2. Add to conversation history
3. Ready for next question
```

**Conversation Storage:**
```
MongoDB ChatSession Document:
├─ screening: reference
├─ parent: reference
├─ language: "en/hi/kn"
├─ messages: [
│  ├─ { role: "user", content: "...", timestamp }
│  ├─ { role: "assistant", content: "...", timestamp }
│  └─ ...
│ ]
├─ reportUploaded: boolean
└─ createdAt, updatedAt
```

---

## Step 11: View Screening History
**Page:** `/dashboard`

**Options:**
```
All Screenings:
├─ Date
├─ Risk Level
├─ Child Name
├─ [View Results] → Opens /screening-results
├─ [Chat] → Opens ChatAssistant
└─ [Download Report] → PDF download

Compare Previous vs Current:
├─ Risk Level change
├─ Behavioral markers comparison
├─ Score progression
└─ Progress tracking
```

---

## Complete Web App Architecture

```
FRONTEND (React)
├─ Login/Auth
├─ Dashboard (view children, history)
├─ Screening Flow
│  ├─ Start (select child)
│  ├─ Video (live/upload)
│  ├─ Questionnaire (20 questions)
│  └─ Complete
├─ Results Display
│  ├─ Risk assessment
│  ├─ Behavioral table
│  ├─ Download report
│  └─ View centers
├─ Chat Assistant (AI)
│  ├─ Message history
│  ├─ Report upload
│  └─ Language selection
└─ Settings/Profile

        ↓↑

BACKEND (Node.js + Express, Port 3000)
├─ Auth Routes (login, register)
├─ Screening Routes (CRUD)
├─ Chat Routes (send, history)
├─ Centers Routes (find nearby)
├─ Video Upload Routes
└─ Report Generation Routes

        ↓↑

MICROSERVICES
├─ ML Service (Port 8000)
│  ├─ Eye contact detection
│  ├─ Hand gesture detection
│  ├─ Head stimming detection
│  └─ Questionnaire prediction
├─ Emotion Service (Port 8001)
│  └─ Emotion variation analysis
└─ RAG Service (Port 8002)
   ├─ Document indexing
   ├─ Vector search (ChromaDB)
   └─ LLM response generation (Groq)

        ↓↑

DATABASES
├─ MongoDB (all data)
│  ├─ Users
│  ├─ Children
│  ├─ Screenings
│  └─ ChatSessions
└─ ChromaDB (vector embeddings)
   └─ Medical report chunks
```

---

## Data Flow Throughout Screening

```
New Screening
  ↓
1. SELECT CHILD
   └─ childId stored
  ↓
2. VIDEO ANALYSIS
   ├─ ML Service extracts 6 markers
   ├─ Emotion Service calculates variation
   └─ Results stored in screening.liveVideoFeatures
  ↓
3. QUESTIONNAIRE
   ├─ 20 responses collected
   ├─ Score calculated (yes %)
   ├─ Location info captured
   └─ Results stored in screening.questionnaire
  ↓
4. COMPLETION
   ├─ ML model predicts final score
   ├─ Risk level assigned (Low/Moderate/High)
   ├─ Groq LLM generates interpretation
   └─ Screening marked "completed"
  ↓
5. RESULTS DISPLAY
   ├─ All markers visible in dashboard
   ├─ Risk level highlighted
   ├─ Nearby centers fetched
   └─ Recommendations shown
  ↓
6. REPORT GENERATION
   ├─ Groq generates clinical analysis
   ├─ PDFKit assembles PDF
   └─ PDF downloaded by user
  ↓
7. RAG CHATBOT
   ├─ Questions answered
   ├─ Context from current screening
   ├─ Conversation history stored
   └─ Can reference report sections
  ↓
8. HISTORY TRACKING
   ├─ Next screening can compare
   ├─ Risk progression visible
   ├─ Previous answers accessible
   └─ Multiple screenings compared
```

---

## Key Locations in Code

| Feature | Frontend | Backend | API Port |
|---------|----------|---------|----------|
| **Auth** | Auth.jsx | authRoutes.js | 3000 |
| **Dashboard** | Dashboard.jsx | screeningRoutes.js | 3000 |
| **Video** | VideoScreening.jsx | videoProcessingRoutes.js | 3000 |
| **Questionnaire** | Questionnaire.jsx | screeningController.js | 3000 |
| **Results** | ScreeningResults.jsx | screeningController.js | 3000 |
| **Chat** | ChatAssistant.jsx | chatRoutes.js | 3000 + 8002 |
| **Report** | ScreeningResults.jsx | screeningController.js | 3000 |
| **ML Analysis** | (Backend) | main.py | 8000 |
| **Emotion** | (Backend) | main.py | 8001 |
| **RAG** | ChatAssistant.jsx | chat_service.py | 8002 |

---

## Typical User Timeline

```
Day 1: Parent registration + child setup
  └─ 10 minutes

Day 2: First screening
  ├─ Video capture: 3 minutes
  ├─ Questionnaire: 5 minutes
  ├─ Results display: 1 minute
  └─ Total: ~10 minutes

Day 2-4: Report generation & review
  └─ 5 minutes to download

Day 3-7: Chat with AI Assistant
  └─ 10-15 minutes asking questions

Week 2: Check progress
  └─ View screening history

Month 1: If concerns, repeat screening
  └─ Compare with first screening

Month 3+: Track development progress
  └─ Multiple screening comparisons
```

---

## Summary

The web app is a **comprehensive screening and support platform** that:

1. ✅ **Captures** video behavioral markers
2. ✅ **Collects** questionnaire responses
3. ✅ **Analyzes** using ML models
4. ✅ **Generates** risk assessment
5. ✅ **Creates** medical reports
6. ✅ **Provides** AI chatbot support
7. ✅ **Tracks** screening history
8. ✅ **Compares** previous vs current results
9. ✅ **Recommends** nearby support centers
10. ✅ **Stores** all data for future reference

All steps are connected and data flows seamlessly through the system.
