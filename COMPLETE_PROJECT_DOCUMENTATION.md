# Autism Screening Application - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Complete Project Flow](#complete-project-flow)
5. [Frontend Implementation](#frontend-implementation)
6. [Backend Implementation](#backend-implementation)
7. [Video Analysis Service](#video-analysis-service)
8. [Questions & Questionnaire](#questions--questionnaire)
9. [RAG Chatbot Service](#rag-chatbot-service)
10. [PDF Report Generation](#pdf-report-generation)
11. [Nearest Autism Centers](#nearest-autism-centers)
12. [Data Models](#data-models)
13. [API Endpoints](#api-endpoints)

---

## Project Overview

**Project Name:** Autism Spectrum Disorder (ASD) Screening Application

**Purpose:** 
Provide parents with an AI-powered, evidence-based autism screening tool that analyzes behavioral indicators through video analysis, questionnaire responses, and AI-powered chatbot guidance.

**Key Features:**
- ✅ Video-based behavioral analysis using MediaPipe
- ✅ Questionnaire-based screening (20 questions)
- ✅ Real-time emotion detection using CNN
- ✅ Risk scoring (combination of video + questionnaire)
- ✅ Medical report PDF generation
- ✅ RAG-based chatbot for parent guidance
- ✅ Multi-language support (English, Hindi, Kannada)
- ✅ Nearby autism center suggestions
- ✅ Screening history and progress tracking

**Target Users:**
- Parents with young children (16-36 months)
- Healthcare professionals

---

## System Architecture

### High-Level Microservices Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React.js)                          │
│                        Port: 3000                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Auth/Login   │→ │ Add Child    │→ │ Questionnaire│              │
│  │ Page         │  │ Profile      │  │ Form         │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                                      │                    │
│         │                                      ↓                    │
│         │                            ┌──────────────────┐          │
│         │                            │ Video Recording/ │          │
│         │                            │ Upload           │          │
│         │                            └──────────────────┘          │
│         │                                      │                    │
│         └───────────────────┬───────────────────┘                   │
│                             ↓                                       │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                    ┌─────────┴────────┬─────────────┐
                    ↓                  ↓             ↓
              ┌──────────┐        ┌──────────┐  ┌──────────┐
              │ ML       │        │Emotion   │  │Backend   │
              │Service   │        │Service   │  │Express   │
              │Port:8000 │        │Port:8001 │  │Port:3000 │
              └──────────┘        └──────────┘  └──────────┘
                   │                   │              │
                   │(Video Analysis)    │              │
                   │(Behavioral Markers)│              ├─→ MongoDB
                   │                    │              │
                   └────────┬───────────┘              │
                            ↓                         │
                   ┌─────────────────────┐        ┌────┴───┐
                   │ Risk Score          │        │RAG      │
                   │ Calculation         │        │Service  │
                   │ (0.4Q + 0.6Video)   │        │Port:8002│
                   └─────────────────────┘        └─────────┘
                            ↓
                   ┌─────────────────────┐
                   │ Screening Results   │
                   │ Display (Frontend)  │
                   └─────────────────────┘
                            │
              ┌─────────────┼────────────┐
              ↓             ↓            ↓
        ┌─────────┐  ┌────────────┐ ┌──────────┐
        │ Medical │  │ Chatbot    │ │Nearby    │
        │ Report  │  │ (RAG)      │ │Centers   │
        │ (PDF)   │  │            │ │Suggestion│
        └─────────┘  └────────────┘ └──────────┘
```

### Service Descriptions

| Service | Technology | Port | Purpose |
|---------|-----------|------|---------|
| **Frontend** | React.js, Axios, Tailwind CSS | 3000 | User interface & interactions |
| **Backend** | Node.js, Express.js, MongoDB | 3000 | REST API, authentication, data management |
| **ML Service** | FastAPI, MediaPipe, OpenCV | 8000 | Behavioral analysis (eye contact, gestures, stimming) |
| **Emotion Service** | FastAPI, PyTorch CNN | 8001 | Emotion detection & variation analysis |
| **RAG Service** | FastAPI, ChromaDB, Groq LLM | 8002 | Intelligent chatbot with RAG |
| **Database** | MongoDB | 27017 | Data persistence |

---

## Technology Stack

### Frontend
- **Framework:** React.js (Hooks-based)
- **HTTP Client:** Axios
- **Styling:** Tailwind CSS
- **Animation:** React Motion
- **State:** React Hooks (useState, useEffect)
- **Video Capture:** MediaRecorder API

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **PDF Generation:** PDFKit
- **File Upload:** Multer
- **Password Hashing:** bcryptjs

### ML & AI Services
- **Framework:** FastAPI (Python)
- **Vision:** MediaPipe (468-point FaceMesh, 21-point Hand tracking)
- **Video Processing:** OpenCV (cv2)
- **Math:** NumPy, SciPy
- **ML:** Scikit-learn, Random Forest, Gradient Boosting
- **Deep Learning:** PyTorch (CNN for emotion detection)

### RAG Service
- **Vector DB:** ChromaDB
- **Embeddings:** Sentence Transformers (all-MiniLM-L6-v2, 384-dim)
- **LLM:** Groq (llama-3.3-70b-versatile)
- **PDF Processing:** PyPDF, pdfplumber

### External APIs
- **Location Search:** SerpAPI
- **Geocoding:** Nominatim (OpenStreetMap)
- **Navigation:** Google Maps
- **LLM:** Groq API

---

## Complete Project Flow

### Phase 1: User Onboarding

```
START
  ↓
[Register/Login]
  ├─ Email & Password validated
  ├─ JWT token generated
  ├─ Stored in MongoDB Users collection
  │
  ↓
[Add Child Profile]
  ├─ Child Name, DOB, Age, Gender
  ├─ Parent/Guardian details
  ├─ Location (City, State, Country)
  ├─ Stored in MongoDB Children collection
  │
  ↓
[Dashboard - View Screenings]
  ├─ List all previous screenings
  ├─ Option to start new screening
```

### Phase 2: Questionnaire Assessment

```
[Questionnaire Page]
  ├─ 20 binary (Yes/No) screening questions
  ├─ Multi-language: English, Hindi, Kannada
  ├─ Questions assess:
  │   ├─ Eye contact
  │   ├─ Hand gestures  
  │   ├─ Social engagement
  │   ├─ Emotional expression
  │   ├─ Restricted behaviors
  │   └─ Communication skills
  │
  ├─ Real-time Scoring:
  │   └─ questionnaireScore = (yesCount / 20) × 100%
  │   └─ Range: 0-100%
  │
  ↓
[Submit Questionnaire]
  └─ Stored in MongoDB: screenings.questionnaireResponses[]
```

### Phase 3: Video Analysis

```
[Record/Upload Video]
  ├─ 60-second video recording
  ├─ Or upload existing MP4
  │
  ↓
[Backend: Video Upload]
  ├─ API: POST /api/screenings/:id/video
  ├─ Multer: Receive & store file
  ├─ Path: ./uploads/videos/{screeningId}.mp4
  │
  ↓
[ML Service - Behavioral Analysis] ─── FastAPI Port 8000 ───
  ├─ Extract frames (30 FPS)
  ├─ For each frame:
  │   ├─ Eye Contact Detection (MediaPipe FaceMesh)
  │   │   ├─ 468 facial landmarks
  │   │   ├─ Calculate Eye Aspect Ratio
  │   │   └─ Result: "Normal" or "Low Eye Contact"
  │   │
  │   ├─ Hand Gesture Detection (MediaPipe Hands)
  │   │   ├─ 21 landmarks per hand
  │   │   ├─ Detect wave vs stimming (direction reversals)
  │   │   └─ Result: "Present" or "Absent"
  │   │
  │   ├─ Head Stimming (Head stability analysis)
  │   │   └─ Result: "Present" or "Absent"
  │   │
  │   ├─ Hand Stimming (Repetitive motion)
  │   │   └─ Result: "Present" or "Absent"
  │   │
  │   └─ Social Reciprocity (Engagement patterns)
  │       └─ Result: "Low" or "Normal"
  │
  ↓
[Emotion Service - Emotion Analysis] ─── FastAPI Port 8001 ───
  ├─ For each frame:
  │   ├─ Face Detection (Haar Cascade)
  │   ├─ Crop face → Resize to 64×64
  │   ├─ CNN Model Inference (PyTorch)
  │   ├─ Output: 6 emotion probabilities
  │   │
  │   └─ Calculate Entropy:
  │       ├─ High entropy → "Normal Emotion Variation"
  │       └─ Low entropy → "Low Emotion Variation"
  │
  ↓
[Aggregate All Results]
  ├─ Eye Contact: score
  ├─ Hand Gestures: status
  ├─ Head Stimming: status
  ├─ Hand Stimming: status
  ├─ Social Reciprocity: status
  └─ Emotion Variation: status
```

### Phase 4: Risk Score Calculation

```
[Calculate Scores]
  ├─ Q_Score = Questionnaire Score (0-100%)
  ├─ V_Score = Video Analysis Score (0-100%)
  │
  ├─ Formula: Risk_Score = (0.4 × Q_Score) + (0.6 × V_Score)
  │
  ├─ Risk Level Classification:
  │   ├─ Score ≥ 70% → HIGH RISK
  │   ├─ 40-70% → MODERATE RISK
  │   └─ < 40% → LOW RISK
  │
  ↓
[Store in MongoDB]
  └─ screenings.riskLevel
  └─ screenings.finalScore
```

### Phase 5: Results Page

```
[Display Results]
  ├─ Risk Level badge (color-coded)
  ├─ Final Score percentage
  ├─ Behavioral indicators table
  ├─ Age-appropriate context
  │
  ↓
[Three Action Options]
  ├─ 📄 Download Medical Report (PDF)
  ├─ 💬 Chat with AI Assistant (RAG)
  └─ 📍 Find Nearby Autism Centers
```

### Phase 6a: PDF Report Generation

```
[PDF Generation Request]
  ├─ API: GET /api/screenings/:id/report
  │
  ↓
[Generate Report] ─── PDFKit (Node.js) ───
  ├─ Header: Logo, Title, Report ID, Disclaimer
  ├─ Patient Info: Name, Age, DOB, Date
  ├─ Behavioral Assessment Table: All 6 indicators
  ├─ Detailed Findings: Groq LLM-generated analysis for each indicator
  ├─ Clinical Impression: Overall assessment
  ├─ Recommendations: Risk-level specific actions
  ├─ Nearby Autism Centers: Top 3 closest (name, address, distance)
  ├─ Disclaimers & Footer
  └─ Page numbers
  │
  ↓
[Return PDF Blob]
  └─ User downloads as: screening_{childName}_{date}.pdf
```

### Phase 6b: RAG Chatbot

```
[User Asks Question]
  ├─ Example: "What does the report say?"
  ├─ API: POST /api/chat/:screeningId/send
  │
  ↓
[Backend: Smart Comparison Detection]
  ├─ Detect: Is this a progress/comparison question?
  │ ├─ Keywords: improve, progress, better, worse, compared, change
  │ ├─ If YES: Fetch most recent previous screening
  │ └─ If NO: Use only current screening
  │
  ↓
[RAG Service Processing]
  ├─ Step 1: Embed question (Sentence Transformers → 384-dim vector)
  ├─ Step 2: Search ChromaDB for similar report chunks (cosine similarity ≤ 0.6)
  ├─ Step 3: Build context (retrieved chunks + system data + comparison data)
  ├─ Step 4: Build prompt with:
  │   ├─ Developmental context (autism indicators by age)
  │   ├─ System instructions (be specific, not generic)
  │   ├─ Comparison instructions (if applicable)
  │   └─ Retrieved report context
  ├─ Step 5: Call Groq LLM (llama-3.3-70b, temperature 0.2, max 1024 tokens)
  ├─ Step 6: Post-process answer (format sections)
  │
  ↓
[Return to Frontend]
  ├─ Answer text (formatted)
  ├─ Used Report Context: Yes/No
  ├─ Retrieved Chunks
  │
  ├─ Store in MongoDB
  │   ├─ ChatSession.messages.push({ role: 'user', text, language, intent })
  │   └─ ChatSession.messages.push({ role: 'assistant', text, language, intent })
  │
  ↓
[Display Chat Response]
  └─ Formatted with sections (Explanation, What it means, Recommended actions)
```

### Phase 6c: Nearby Autism Centers

```
[Find Centers Request]
  ├─ API: GET /api/centers?city={city}&state={state}&country={country}
  │
  ↓
[Backend: Places Service]
  ├─ Step 1: Geocode user location (Nominatim)
  │   └─ Input: City, State, Country → Output: Latitude, Longitude
  │
  ├─ Step 2: Search for autism centers (SerpAPI)
  │   └─ Query: "autism assessment centers in {city}"
  │
  ├─ Step 3: For each center:
  │   ├─ Geocode address (Nominatim)
  │   ├─ Calculate Haversine distance
  │   │   └─ Formula: d = 2R×arcsin(√[sin²(Δϕ/2) + cos(ϕ₁)cos(ϕ₂)sin²(Δλ/2)])
  │   │   └─ R = 6,371 km (Earth radius)
  │
  ├─ Step 4: Sort by distance, return top 3
  │
  ├─ Step 5: Generate Google Maps URLs
  │   └─ https://maps.google.com/?q={lat},{lon}
  │
  ↓
[Return Centers to Frontend]
  └─ Array: [{ name, address, distance (km), mapsUrl }]
```

---

## Frontend Implementation

### Project Structure
```
frontend/
├── src/
│   ├── pages/
│   │   ├── WelcomeAndAuth.jsx       (Login/Register)
│   │   ├── Dashboard.jsx             (Child profiles, screening list)
│   │   ├── Questionnaire.jsx         (20 questions form)
│   │   ├── VideoRecording.jsx        (Video upload)
│   │   ├── ScreeningResults.jsx      (Risk results)
│   │   ├── ChatAssistant.jsx         (RAG chatbot)
│   │   └── Centers.jsx               (Nearby centers)
│   ├── components/
│   ├── services/
│   │   └── api.js                   (Axios HTTP client)
│   ├── styles/
│   │   └── tailwind.css
│   └── App.jsx
├── package.json
└── vite.config.js
```

### Key Pages Overview

#### 1. Questionnaire Page
- **Display:** 20 yes/no questions with language support
- **State:** Track answers, current question index, calculated score
- **Calculation:** Real-time: `score = (yesCount / 20) × 100`
- **Action:** Submit to backend via POST /api/screenings/:id/questionnaire

#### 2. Video Recording Page
- **Capture:** 60-second video using MediaRecorder API
- **Upload:** Send video file via FormData to backend
- **Feedback:** Show upload progress and status
- **Next:** Navigate to results page

#### 3. Screening Results Page
- **Display Components:**
  - Risk Level Badge (color-coded: red/yellow/green)
  - Final Score (0-100%)
  - Behavioral Indicators Table
  - Age-appropriate explanations
- **Actions:** Three buttons for PDF, Chat, Centers

#### 4. Chat Assistant Page
- **Features:**
  - Chat history loading
  - Multi-language support (EN/HI/KN)
  - Upload medical report PDF button
  - Message input & display
- **API:** POST /api/chat/:screeningId/send for each message

#### 5. Centers Page
- **Display:** Table of 3 nearest autism centers
- **Columns:** Name, Address, Distance (km), Navigate button
- **Action:** Navigate button opens Google Maps

---

## Backend Implementation

### Project Structure
```
backend/
├── controllers/
│   ├── authController.js
│   ├── screeningController.js
│   ├── chatController.js
│   ├── centersController.js
│   └── childController.js
├── models/
│   ├── User.js
│   ├── Child.js
│   ├── Screening.js
│   └── ChatSession.js
├── routes/
│   ├── authRoutes.js
│   ├── screeningRoutes.js
│   ├── chatRoutes.js
│   ├── centersRoutes.js
│   └── childRoutes.js
├── services/
│   ├── pdfService.js
│   ├── placesService.js
│   ├── chatAssistantService.js
│   └── groqService.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
├── uploads/
│   ├── videos/
│   └── reports/
├── .env
├── config.js
└── server.js
```

### Key Controllers

#### Authentication Controller
- **register():** Create user account, hash password, generate JWT
- **login():** Verify credentials, generate JWT token

#### Screening Controller
- **createScreening():** Initialize new screening document
- **submitQuestionnaire():** Store 20 answers, calculate Q_Score
- **uploadVideo():** Receive video, call ML/Emotion services
- **completeScreening():** Calculate final risk score
- **generateReport():** Create PDF report with Groq analysis
- **getScreening():** Fetch screening data

#### Chat Controller
- **sendMessage():** 
  - Detect if comparison query (improve, progress, etc.)
  - Fetch previous screening if comparison detected
  - Send to RAG Service with comparison_data
  - Return answer
- **getHistory():** Fetch chat messages for screening
- **uploadMedicalReport():** Receive PDF, index in ChromaDB

#### Centers Controller
- **getNearbyAutismCenters():** Call placesService, return results

### Key Services

#### PDF Service
```javascript
generateScreeningReport(screening, nearbycenters, groqAnalysis)
  - Step 1: Create PDF document
  - Step 2: Add header (logo, title, disclaimer)
  - Step 3: Add patient info section
  - Step 4: Add behavioral assessment table
  - Step 5: Add detailed findings (LLM analysis for each indicator)
  - Step 6: Add clinical impression
  - Step 7: Add recommendations (risk-level specific)
  - Step 8: Add nearby centers table
  - Step 9: Add disclaimers & footer
  
  Output: PDF buffer (downloadable)
```

#### Places Service
```javascript
getNearbyAutismCenters(city, state, country)
  - Step 1: Geocode location (Nominatim API)
  - Step 2: Search autism centers (SerpAPI)
  - Step 3: For each center:
    - Geocode address
    - Calculate Haversine distance
  - Step 4: Sort by distance
  - Step 5: Return top 3 with Google Maps URLs
```

---

## Video Analysis Service

### Technology
- **Framework:** FastAPI (Python)
- **Port:** 8000
- **Vision Library:** MediaPipe
- **Video Processing:** OpenCV
- **Mathematics:** NumPy, SciPy

### End-to-End Methodology (Step-by-Step)

The production flow for screening is:
1. **Pre-recorded video upload**
2. **Video feature extraction (this service)**
3. **Questionnaire completion**
4. **Risk fusion + interpretation**

Within this service, the processing pipeline is:

#### Step 1: Input Validation and Session Setup
- Validate video format, resolution, and duration.
- Create a per-screening analysis session (`screening_id`).
- Initialize frame counters and detector state buffers.

#### Step 2: Frame Decoding and Quality Filtering
- Decode video frame-by-frame using OpenCV.
- Reject unusable frames (very low brightness, heavy blur, detector confidence failure).
- Keep timestamps for each valid frame to support temporal-window analysis.

#### Step 3: Landmark Extraction
- **Face landmarks:** MediaPipe FaceMesh (468 points).
- **Hand landmarks:** MediaPipe Hands (21 points per hand).
- **Pose landmarks (if available):** body orientation and upper-body context.
- Persist confidence scores per frame for robustness filtering.

#### Step 4: Temporal Smoothing and Signal Construction
- Smooth raw coordinate traces to reduce jitter.
- Build derived motion signals:
  - Head pose signals (yaw/pitch/roll over time).
  - Hand trajectory velocity and acceleration.
  - Gaze/face orientation proxy toward camera.
  - Interaction windows for reciprocity and gesture intent.

#### Step 5: Six Feature Algorithms
- Run each feature detector independently.
- Each detector returns:
  - categorical label,
  - confidence/score,
  - evidence metrics.

#### Step 6: Session-Level Aggregation
- Aggregate frame-level evidence across full video duration.
- Enforce minimum-observation constraints to avoid unstable short-segment decisions.
- Handle missing-data windows gracefully (occlusion, face out-of-frame).

#### Step 7: Output Packaging
- Return JSON with all six feature labels + scores.
- Send result to backend for risk calculation and report generation.

### Behavioral Indicators Detected

#### 1. Eye Contact Detection
- **Input:** face landmarks, head orientation, per-frame confidence.
- **Method:** face-facing and gaze proxy estimation.
- **Detailed Algorithm:**
  - Detect valid face frames.
  - Estimate whether face direction and eye-region geometry indicate camera-facing engagement.
  - Compute `eye_contact_ratio = engaged_frames / valid_face_frames`.
  - Apply minimum-duration rule to suppress accidental short looks.
- **Output Rule:**
  - `Normal Eye Contact` if ratio is above configured threshold.
  - `Low Eye Contact` otherwise.
- **Why It Matters:** sustained eye engagement supports joint attention and social learning.

#### 2. Hand Gesture Detection  
- **Input:** hand landmarks + upper-body context.
- **Method:** communicative gesture primitive detection (pointing, showing, waving, reaching).
- **Detailed Algorithm:**
  - Build hand trajectory vectors and orientation features.
  - Score windows for communicative intent (directed, socially meaningful movement).
  - Penalize repetitive self-directed cycles to avoid stimming confusion.
  - Aggregate to session-level gesture score.
- **Output Rule:**
  - `Present` if communicative evidence crosses threshold.
  - `Absent` otherwise.
- **Why It Matters:** gestures are a primary pre-verbal communication channel.

#### 3. Head Stimming Detection
- **Input:** time-series head pose (yaw, pitch, roll).
- **Method:** rhythmic head-movement periodicity detection.
- **Detailed Algorithm:**
  - Estimate pose per frame and smooth traces.
  - Remove baseline drift to isolate repetitive oscillations.
  - Identify periodic cycles using windowed frequency/peak consistency checks.
  - Validate persistence across multiple windows.
- **Output Rule:**
  - `Present` if sustained rhythmic repetitive pattern is detected.
  - `Absent` otherwise.
- **Why It Matters:** frequent repetitive head movement may indicate regulation/stereotypy concerns.

#### 4. Hand Stimming Detection
- **Input:** left/right hand keypoint trajectories over time.
- **Method:** repetitive non-goal-directed motion burden analysis.
- **Detailed Algorithm:**
  - Compute motion energy (velocity + acceleration) from hand trajectories.
  - Detect high-frequency oscillatory windows.
  - Merge adjacent repetitive windows into episodes.
  - Compute `stimming_burden = repetitive_episode_duration / observed_hand_duration`.
- **Output Rule:**
  - `Present` if burden and periodicity exceed thresholds.
  - `Absent` otherwise.
- **Why It Matters:** repetitive self-directed hand motion is an important behavioral screening marker.

#### 5. Social Reciprocity Assessment
- **Input:** face orientation, body orientation, interaction-response windows.
- **Method:** engagement continuity and response-likelihood scoring.
- **Detailed Algorithm:**
  - Measure orientation toward social target/camera.
  - Segment into interaction windows.
  - Score each window for sustained engagement and response continuity.
  - Aggregate to session reciprocity score with stability checks.
- **Output Rule:**
  - `Normal` if score meets threshold.
  - `Low` otherwise.
- **Why It Matters:** social reciprocity underlies early communication and relationship development.

#### 6. Emotion Variation Detection
- **Input:** valid face crops and per-frame emotion probabilities.
- **Method:** temporal emotion diversity analysis.
- **Detailed Algorithm:**
  - Predict emotion distribution per frame.
  - Build temporal histogram of dominant emotions.
  - Compute diversity/entropy-like score and transition richness.
  - Suppress single-frame noisy spikes using temporal consistency rules.
- **Output Rule:**
  - `Normal` if diversity and transitions are sufficient.
  - `Low` otherwise.
- **Why It Matters:** limited emotion variation can reflect reduced social-emotional expressiveness.

### Robustness and Quality Controls
- Confidence gating for face/hand detections.
- Temporal smoothing against landmark jitter.
- Missing-data tolerance for brief occlusions.
- Minimum valid-frame constraints before final labeling.
- Session-level aggregation to avoid decisions from short artifacts.

### Score Normalization and Label Mapping
- Each detector computes an internal numeric score in `[0, 1]`.
- Scores are thresholded into categorical labels used by backend/reporting.
- Backend stores both:
  - **label** (human-readable clinical style),
  - **score** (machine-friendly confidence/evidence strength).

### Service Output
```json
{
  "screening_id": "63a1d4c8...",
  "analysis": {
    "eye_contact": { "result": "Normal Eye Contact", "score": 0.78 },
    "hand_gesture": { "result": "Absent", "score": 0.15 },
    "head_stimming": { "result": "Absent", "score": 0.92 },
    "hand_stimming": { "result": "Absent", "score": 0.88 },
    "social_reciprocity": { "result": "Low", "score": 0.42 },
    "emotion_variation": { "result": "Normal", "score": 0.75 }
  }
}
```

---

## Questions & Questionnaire

### Structure
- **Total Questions:** 20 (binary: Yes/No)
- **Assessment Areas:**
  - Social communication
  - Eye contact behavior
  - Gesture usage
  - Social engagement
  - Emotional expression
  - Restricted/repetitive behaviors

### Scoring
```
questionnaireScore = (Number of "Yes" answers / 20) × 100%

Examples:
- 12 YES out of 20 = 60% score
- 8 YES out of 20 = 40% score
- 18 YES out of 20 = 90% score
```

### Integration
- **Frontend:** Questionnaire.jsx component
- **Backend:** POST /api/screenings/:id/questionnaire
- **Storage:** MongoDB screenings.questionnaireResponses (array of 20 booleans)

---

## RAG Chatbot Service

### Technology Stack
- **Framework:** FastAPI (Python)
- **Port:** 8002
- **Vector Database:** ChromaDB (persistent storage)
- **Embeddings:** Sentence Transformers (all-MiniLM-L6-v2, 384-dimensional)
- **LLM:** Groq (llama-3.3-70b-versatile model)
- **PDF Processing:** PyPDF, pdfplumber

### RAG Pipeline

```
User Question
    ↓
[Embedding]
  └─ Sentence Transformers: question → 384-dim vector
    
    ↓
[Semantic Search]
  └─ ChromaDB: Find top 4 similar report chunks (cosine ≤ 0.6)
    
    ↓
[Context Building]
  ├─ Retrieved report chunks (max 2500 chars)
  ├─ Current screening data (indicators, risk level, age)
  ├─ Comparison data (if progress question)
  ├─ Chat history (last 5 messages)
    
    ↓
[Prompt Construction]
  ├─ Developmental context (typical vs concerning behaviors)
  ├─ System instructions (educate, specific answers, no diagnosis)
  ├─ Retrieved report context (if available)
  ├─ Comparison instructions (if applicable)
  ├─ Response format (Explanation, What it means, Recommended actions)
    
    ↓
[LLM Generation]
  └─ Groq: Generate answer
    - Model: llama-3.3-70b-versatile
    - Temperature: 0.2 (factual, not creative)
    - Max tokens: 1024
    
    ↓
[Post-Processing]
  ├─ Validate format
  ├─ Remove report references if no context
  ├─ Format for display
    
    ↓
Response to Frontend
  ├─ answer (formatted string)
  ├─ used_report_context (boolean)
  └─ retrieved_chunks (list)
```

### Smart Comparison Detection

**Triggers comparison query if question contains:**
- Keywords: improve, progress, better, worse, change, compared, comparison
- Result: Fetch previous screening & include in prompt

**Example Flows:**

*Non-Comparison Query:*
```
User: "What does the report say?"
  → Returns: Current screening analysis only
  → Answer: Specific interpretation of current results
```

*Comparison Query:*
```
User: "Did my child improve?"
  → Fetches: Previous screening data
  → Returns: Both screenings for comparison
  → Answer: Specific comparison explaining changes
```

### PDF Indexing Flow

```
Upload Medical Report (PDF)
    ↓
[Backend stores file]
    ↓
[Backend calls RAG Service: POST /rag/index]
    ↓
[RAG Service: Extract & Split PDF]
  ├─ Load PDF text
  ├─ Split into chunks (500 chars, overlap 100)
    ↓
[Generate Embeddings]
  ├─ SentenceTransformers: Each chunk → 384-dim vector
    ↓
[Store in ChromaDB]
  ├─ id: "{screening_id}:{chunk_index}"
  ├─ document: chunk text
  ├─ embedding: vector
  ├─ metadata: { screening_id, page_num }
    ↓
[User can now ask questions]
  └─ Chatbot retrieves relevant chunks for context-aware answers
```

---

## PDF Report Generation

### Technology
- **Library:** PDFKit (Node.js)
- **Format:** PDF/A (archival format)
- **Typical Length:** 12-15 pages

### Report Structure

**Page 1: Cover & Header**
- App logo
- Title: "Autism Spectrum Disorder Screening Medical Report"
- Report ID, Generation date
- Child name & age
- Disclaimer box

**Page 2: Patient Information**
- Child: Name, DOB, Age, Gender
- Guardian: Name, Address, Contact
- Screening date & duration

**Page 3: Behavioral Assessment Table**
```
┌─────────────────┬────────────┬───────┐
│ Indicator       │ Result     │ Score │
├─────────────────┼────────────┼───────┤
│ Eye Contact     │ Normal     │ 85%   │
│ Hand Gestures   │ Absent     │ 20%   │
│ Head Stimming   │ Absent     │ 90%   │
│ Hand Stimming   │ Absent     │ 85%   │
│ Social Recip.   │ Low        │ 35%   │
│ Emotion Var.    │ Normal     │ 75%   │
└─────────────────┴────────────┴───────┘

Overall Risk Level: LOW
Final Score: 38%
```

**Pages 4-8: Detailed Findings**
- For each of 6 behavioral indicators
- Result + Groq LLM-generated explanation
- Why each indicator matters for autism screening
- Questionnaire summary (20 questions, score %)

**Page 9: Clinical Impression**
- Overall risk assessment
- Developmental context
- Key strengths & areas for monitoring

**Page 10: Recommendations**
- Risk-level specific actions
- Monitoring guidelines
- Follow-up schedule

**Page 11: Nearby Autism Centers**
```
┌──────────┬──────────────┬─────────┐
│ Name     │ Address      │ Distance│
├──────────┼──────────────┼─────────┤
│ Center A │ 123 Main St  │ 2.5 km  │
│ Center B │ 456 Oak Ave  │ 5.1 km  │
│ Center C │ 789 Pine Rd  │ 8.3 km  │
└──────────┴──────────────┴─────────┘
```

**Pages 12-15: Disclaimers & Footer**
- "Not a medical diagnosis"
- "For educational purposes only"
- "Consult healthcare professional"
- Page numbers

---

## Nearest Autism Centers

### Process Flow

**Step 1: Geocode User Location**
- API: Nominatim (OpenStreetMap)
- Input: City, State, Country
- Output: Latitude, Longitude

**Step 2: Search for Centers**
- API: SerpAPI (Google Search)
- Query: "autism assessment centers in {city}"
- Extracts: Center name, address, website

**Step 3: Calculate Distances**
- API: Nominatim (geocode each center address)
- Formula: Haversine distance
```
d = 2R × arcsin(√[sin²(Δϕ/2) + cos(ϕ₁)cos(ϕ₂)sin²(Δλ/2)])
  where R = 6,371 km (Earth radius)
```

**Step 4: Sort & Return**
- Sort by distance (ascending)
- Return top 3 closest centers
- Include: Name, address, distance (km), Google Maps URL

### Data Returned
```json
[
  {
    "name": "Center A",
    "address": "123 Main Street, City",
    "distance": 2.5,
    "website": "example.com",
    "mapsUrl": "https://maps.google.com/?q=12.96,77.59"
  },
  ...
]
```

---

## Data Models

### User
```javascript
{
  _id: ObjectId,
  email: String (unique),
  passwordHash: String (bcrypted),
  name: String,
  city: String,
  state: String,
  country: String,
  phoneNumber: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Child
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  name: String,
  nickname: String,
  dateOfBirth: Date,
  ageInMonths: Number,
  gender: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Screening
```javascript
{
  _id: ObjectId,
  user: ObjectId,
  child: ObjectId,
  
  // Questionnaire
  questionnaireResponses: [Boolean],  // 20 answers
  questionnaireScore: Number (0-100),
  
  // Video
  videoPath: String,
  liveVideoFeatures: {
    eyeContact: String,
    handGesture: String,
    headStimming: String,
    handStimming: String,
    socialReciprocity: String,
    emotionVariation: String
  },
  
  // Risk
  riskLevel: String,  // "LOW", "MODERATE", "HIGH"
  finalScore: Number (0-100),
  videoScore: Number (0-100),
  
  // Report
  uploadedReportPath: String,
  reportIndexed: Boolean,
  
  createdAt: Date,
  updatedAt: Date,
  status: String
}
```

### ChatSession
```javascript
{
  _id: ObjectId,
  user: ObjectId,
  screening: ObjectId,
  
  messages: [{
    role: String,        // "user" or "assistant"
    text: String,
    language: String,    // "en", "hi", "kn"
    intent: String,
    createdAt: Date
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### Authentication
```
POST /api/auth/register
  Body: { email, password, name, city, state, country }
  Response: { success, token, user }

POST /api/auth/login
  Body: { email, password }
  Response: { success, token, user }
```

### Screening
```
POST /api/screenings
  Body: { childId }
  Response: { screening }

PATCH /api/screenings/:id/questionnaire
  Body: { answers (array of 20 booleans) }
  Response: { success, questionnaireScore }

POST /api/screenings/:id/video
  Body: FormData with video file
  Response: { success, liveVideoFeatures }

PATCH /api/screenings/:id/complete
  Response: { success, riskLevel, finalScore }

GET /api/screenings/:id
  Response: { screening }

GET /api/screenings/:id/report
  Response: PDF binary
```

### Chat
```
POST /api/chat/:screeningId/send
  Body: { question, language }
  Response: { answer, intent, reportContextUsed }

GET /api/chat/:screeningId/history
  Response: { messages }

POST /api/chat/:screeningId/upload-report
  Body: FormData with PDF
  Response: { success, uploadedReportPath }
```

### Centers
```
GET /api/centers?city={city}&state={state}&country={country}
  Response: { centers: [{ name, address, distance, mapsUrl }] }
```

---

## Complete Workflow Summary

```
1. REGISTRATION/LOGIN
   ├─ User creates account or logs in
   └─ JWT token generated

2. ADD CHILD PROFILE
   └─ Store child demographics

3. START SCREENING
   ├─ 20-Question Questionnaire (Calculate Q_Score: 0-100%)
   ├─ Record/Upload 60-Sec Video
   │   ├─ ML Service: Behavioral analysis
   │   └─ Emotion Service: Emotion variation
   ├─ Calculate Risk: (0.4 × Q_Score) + (0.6 × V_Score)
   └─ Display Results

4. POST-SCREENING OPTIONS
   ├─ A. DOWNLOAD REPORT
   │   └─ Generate 12-15 page PDF with Groq analysis
   │
   ├─ B. CHAT WITH AI
   │   ├─ Smart comparison detection
   │   ├─ RAG retrieval from uploaded report
   │   └─ LLM generates specific answers
   │
   └─ C. FIND NEAREST CENTERS
       ├─ Geolocation-based search
       ├─ Haversine distance calculation
       └─ Google Maps integration
```

---

## Summary

This comprehensive documentation covers:

✅ **Complete architecture:** 6 integrated services working together
✅ **Frontend:** React-based interactive UI with video recording
✅ **Backend:** Express.js REST API with complete business logic
✅ **Video analysis:** MediaPipe-based 6-indicator behavioral detection
✅ **Emotion detection:** PyTorch CNN for emotion variation analysis
✅ **Questionnaire:** 20 evidence-based screening questions
✅ **RAG Chatbot:** Smart comparison-aware AI assistant
✅ **PDF Reports:** Professional medical-grade reports
✅ **Location Services:** Distance-based autism center finder
✅ **Multi-language:** English, Hindi, Kannada support

The system provides parents with a comprehensive, AI-powered autism screening tool that combines behavioral video analysis, questionnaire assessment, and intelligent chatbot guidance, all in an easy-to-use web application.

