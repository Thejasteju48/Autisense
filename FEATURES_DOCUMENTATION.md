# Autisense - New Features Documentation

**Comprehensive Guide to Report Generation, Autism Centers Locator, and RAG Chatbot System**

---

## Table of Contents

1. [📄 Report Generation & PDF Export](#report-generation--pdf-export)
2. [🗺️ Nearest Autism Centers Locator](#nearest-autism-centers-locator)
3. [🤖 RAG Chatbot System](#rag-chatbot-system)
4. [📊 Integration & Data Flow](#integration--data-flow)

---

## 📄 Report Generation & PDF Export

### Overview

Autisense generates professional, hospital-grade PDF reports after screening completion. Reports include:
- Risk assessment and interpretation
- Detailed behavioral analysis (6 markers)
- Questionnaire responses summary
- Nearby autism diagnostic centers with contact info
- Clinical recommendations and next steps

### Architecture

#### Backend Components

**File: `backend/services/pdfService.js`**
```
Purpose: Generate professional PDF documents with screening results
Key Functions:
  - generateReport(screening) - Main PDF generation
  - formatBehavioralTable() - Create 6-marker evaluation table
  - addCentersList() - Embed nearby centers
```

**File: `backend/utils/pdfGenerator.js`**
```
Purpose: Low-level PDF creation using PDFKit library
Features:
  - Header with logo/branding
  - Color-coded risk indicators
  - Professional typography
  - Charts and visualizations
```

**File: `backend/controllers/screeningController.js`**
```
Endpoint: POST /api/screenings/:id/generate-report
Process:
  1. Fetch screening data
  2. Generate Groq interpretation (clinical summary)
  3. Create PDF document
  4. Save to backend/reports/ folder
  5. Return download URL
```

### Report Contents

#### 1. **Header Section**
```
├── Autisense Logo
├── Report Title: "Autism Screening Assessment Report"
├── Report Date & Assessment Duration
├── Child Name, Age, Parents' Names
└── Report ID (unique identifier)
```

#### 2. **Risk Assessment Section**
```
┌─────────────────────────────────────┐
│   Risk Level: [LOW/MODERATE/HIGH]   │ ← Color-coded (green/yellow/red)
├─────────────────────────────────────┤
│   Final Score: 75.0%                │
│   Risk Classification: HIGH ≥60%    │
│   Assessment Date: [Date]           │
│   Examiner: System                  │
└─────────────────────────────────────┘
```

#### 3. **Behavioral Analysis Table**
```
╔════════════════════════════════════════════════════════════╗
║              BEHAVIORAL MARKERS ASSESSMENT                 ║
╠════════════════════════════════════════════════════════════╣
║ Eye Contact          │ Low Eye Contact        │ ⚠️ CONCERN ║
║ Head Stimming        │ Absent                 │ ✓ Normal  ║
║ Hand Stimming        │ Present                │ ⚠️ CONCERN ║
║ Hand Gestures        │ Absent/Limited         │ ⚠️ CONCERN ║
║ Social Reciprocity   │ Low                    │ ⚠️ CONCERN ║
║ Emotion Variation    │ Low                    │ ⚠️ CONCERN ║
╚════════════════════════════════════════════════════════════╝
```

#### 4. **Questionnaire Summary**
```
Questionnaire Score (M-CHAT-R):
├── Total Questions: 20
├── Yes Responses: 16 (concerns)
├── No Responses: 4 (typical)
├── Reverse-Coded Adjustments: Applied
└── ML-Predicted Risk Probability: 83%

Top Concerns Detected:
  • Lack of interest in other children
  • Limited pointing behavior
  • Unusual sensory sensitivities
  • Restricted play patterns
```

#### 5. **Clinical Interpretation**
```
Generated using Groq LLM:
"The assessment indicates a 75% autism likelihood based on:
- Questionnaire responses showing 16 developmental concerns
- Video analysis detecting 4 of 6 behavioral markers requiring follow-up
- Combination suggests moderate-to-high risk of autism spectrum characteristics

The child shows particular challenges in:
✓ Social communication and interaction
✓ Repetitive behaviors and restricted interests
✓ Emotion expression variability
```

#### 6. **Recommendations Section**
```
IMMEDIATE NEXT STEPS:
1. Schedule professional developmental evaluation
   - Recommend: Developmental Pediatrician or Child Psychologist
   - Timeframe: Within 2-4 weeks

2. Early Intervention Assessment
   - Contact your local early intervention program
   - Services available for children under 3 years

3. Parent Support Resources
   - Parent-child interaction therapy
   - Speech-language screening
   - Occupational therapy evaluation

4. Monitoring Plan
   - Track developmental progress over next month
   - Document behavioral changes
   - Record video samples for specialist review

SCREENING LIMITATIONS:
⚠️ This screening assists in identifying children who may need further evaluation
⚠️ Only a qualified healthcare provider can diagnose autism
⚠️ Early intervention services typically don't require a diagnosis
```

#### 7. **Nearby Diagnostic Centers**
```
(See section 2 for details on how centers are retrieved and displayed)

RECOMMENDED AUTISM DIAGNOSTIC CENTERS NEAR YOU:

1. Children's Hospital Developmental Medicine
   📍 Distance: 2.3 km away
   ☎️ Phone: (555) 123-4567
   🔗 Navigate: [Click to open in maps]
   ⭐ Specialties: ADHD, Autism, Developmental Delays
   
2. Pediatric Neurodevelopmental Clinic
   📍 Distance: 5.1 km away
   ☎️ Phone: (555) 234-5678
   🔗 Navigate: [Click to open in maps]
   ⭐ Specialties: Autism Diagnosis, Speech Therapy
```

#### 8. **Footer Section**
```
Generated: [Date & Time]
Report ID: [Unique ID]
System: Autisense v1.0
Validity: Valid for 6-12 months
Contact: support@autisense.app
Disclaimer: See www.autisense.app/disclaimer
```

### PDF Generation Code Flow

```javascript
// 1. POST /api/screenings/:id/generate-report
exports.generateReport = async (req, res) => {
  // Fetch screening with all details
  const screening = await Screening.findById(id)
    .populate('child')
    .populate('user');
  
  // 2. Generate Clinical Interpretation (Groq LLM)
  const interpretation = await groqService.generateInterpretation(screening);
  
  // 3. Get Nearby Centers
  const centers = await placesService.getNearbyDiagnosticCenters(
    screening.parentLocation,
    5  // top 5 centers
  );
  
  // 4. Create PDF
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(`backend/reports/${screening._id}.pdf`));
  
  // Add sections
  addHeader(doc, screening);
  addRiskAssessment(doc, screening);
  addBehavioralTable(doc, screening);
  addQuestionnaireSummary(doc, screening);
  addInterpretation(doc, interpretation);
  addRecommendations(doc, screening);
  addCenters(doc, centers);
  addFooter(doc);
  
  doc.end();
  
  // 5. Return download URL
  res.json({
    success: true,
    reportPath: `/reports/${screening._id}.pdf`,
    downloadUrl: `${baseURL}/api/screenings/${screening._id}/report`
  });
};

// 3. Download report
app.get('/api/screenings/:id/report', (req, res) => {
  const filePath = path.join(__dirname, 'reports', `${req.params.id}.pdf`);
  res.download(filePath);
});
```

### Environment Variables for Reports

```env
# Reports
REPORTS_DIR=./backend/reports
REPORT_EXPIRY_DAYS=180  # Reports expire after 6 months
PDF_MAX_SIZE=10  # MB
GROQ_REPORT_TIMEOUT=30000  # 30 seconds for Groq interpretation

# Report generation
COMPANY_NAME=Autisense
COMPANY_LOGO_PATH=./assets/logo.png
CONTACT_EMAIL=support@autisense.app
CONTACT_PHONE=1-800-AUTISM-1
```

---

## 🗺️ Nearest Autism Centers Locator

### Overview

After screening completion, Autisense automatically identifies and displays the nearest autism diagnostic and intervention centers based on the parent's location. This feature:
- Searches for autism specialists, diagnostic centers, and early intervention programs
- Calculates distances using coordinates
- Provides contact information and navigation links
- Integrates with PDF reports

### Architecture

#### Backend Components

**File: `backend/services/placesService.js`**
```
Purpose: Search for autism diagnostic centers using external APIs
Functions:
  - getNearbyDiagnosticCenters(location, limit)
  - searchAutismSpecialists(city, radius)
  - geocodeCityToCoordinates(city)
  - calculateDistance(lat1, lon1, lat2, lon2) - Haversine formula
```

**File: `backend/controllers/centersController.js`**
```
Endpoints:
  GET /api/centers/search?location=city&radius=10
  GET /api/centers/nearby?lat=40.7128&lon=-74.0060
  POST /api/centers/favorites (save favorite centers)
  GET /api/centers/favorites (retrieve saved centers)
```

**Frontend: `frontend/src/pages/ScreeningResults.jsx`**
```
Components:
  - <NearbyCenter /> Card component
  - <CentersList /> Container
  - "Navigate" button integration with Google Maps
```

### Data Flow: Finding Nearest Centers

```
STEP 1: User completes screening
  └─ Screening saved with parentLocation {city, state, country}

STEP 2: Backend receives location
  Input: {"city": "San Francisco", "state": "CA", "country": "USA"}

STEP 3: Geocoding (Nominatim/OpenStreetMap)
  ├─ Convert city → latitude/longitude
  ├─ API: https://nominatim.openstreetmap.org/search
  └─ Output: {lat: 37.7749, lon: -122.4194}

STEP 4: Search autism centers (SerpAPI)
  ├─ Query: "autism diagnostic centers near San Francisco"
  ├─ Radius: 15 km
  ├─ API: https://serpapi.com/search
  └─ Output: List of centers with addresses, phones, ratings

STEP 5: Calculate distances (Haversine formula)
  ├─ For each center:
  │  - lat/lon of center
  │  - parent's lat/lon
  │  - distance = √((Δlat)² + (Δlon)²) * 111 km
  └─ Sort by distance (nearest first)

STEP 6: Display in UI
  ├─ Show top 5-10 nearest centers
  ├─ Display distance, phone, address
  ├─ Add "Navigate" button (Google Maps link)
  └─ Option to save as favorite

STEP 7: Include in PDF report
  └─ Centers list embedded in generated report
```

### Center Search API Integration

#### **SerpAPI Integration** (Primary)

```javascript
// backend/services/placesService.js

const searchAutismSpecialists = async (city, radius = 15) => {
  const query = `autism diagnostic centers ${city}`;
  
  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        q: query,
        api_key: process.env.SERP_API_KEY,
        engine: 'google',
        type: 'place',
        num: 10
      },
      timeout: 10000
    });
    
    // Parse results
    const centers = response.data.place_results?.map(result => ({
      name: result.title,
      address: result.address,
      phone: result.phone,
      website: result.website,
      rating: result.rating,
      reviews: result.review_count,
      types: result.types,  // e.g., ["Diagnostic Center", "Pediatrician"]
      coordinates: result.coordinates  // {lat, lon}
    }));
    
    return centers || [];
  } catch (error) {
    console.error('SerpAPI error:', error.message);
    return [];
  }
};
```

#### **Geocoding** (Nominatim/OpenStreetMap)

```javascript
const geocodeCityToCoordinates = async (city, state, country) => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        city: city,
        state: state,
        country: country,
        format: 'json',
        limit: 1
      },
      timeout: 5000,
      headers: {
        'User-Agent': 'Autisense/1.0 (support@autisense.app)'
      }
    });
    
    if (response.data.length > 0) {
      const location = response.data[0];
      return {
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lon),
        displayName: location.display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
};
```

#### **Distance Calculation** (Haversine Formula)

```javascript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  return parseFloat(distance.toFixed(2));
};
```

### API Endpoint Examples

#### **Search Centers by Location**
```http
GET /api/centers/search?location=San%20Francisco&radius=15&limit=10

Response:
{
  "success": true,
  "data": {
    "centers": [
      {
        "id": "center_1",
        "name": "UCSF Child Development Center",
        "address": "3333 California St, San Francisco, CA 94118",
        "phone": "(415) 476-1037",
        "website": "https://ucsf.edu/...",
        "distance": 2.3,  // km
        "rating": 4.8,
        "reviews": 127,
        "specialties": ["Autism Diagnosis", "Speech Therapy", "Developmental Pediatrics"],
        "navigateUrl": "https://maps.google.com/?q=3333+California+St..."
      },
      {...more centers}
    ],
    "searchLocation": {
      "city": "San Francisco",
      "lat": 37.7749,
      "lon": -122.4194
    },
    "timestamp": "2026-03-25T10:30:00Z"
  }
}
```

#### **Get Nearby Centers**
```http
GET /api/centers/nearby?lat=37.7749&lon=-122.4194&radius=20&limit=5

Response:
{
  "success": true,
  "data": {
    "centerCount": 5,
    "centers": [
      {
        "rank": 1,
        "name": "Children's Hospital Developmental Medicine",
        "distance": 1.8,
        "phone": "(415) 353-1800",
        "address": "1975 4th St, San Francisco, CA 94158",
        "navigateUrl": "https://maps.google.com/..."
      },
      {...}
    ]
  }
}
```

### Environment Variables for Centers Search

```env
# Centers & Places
SERP_API_KEY=your_serp_api_key_here
CENTERS_SEARCH_RADIUS=15  # km
MAX_CENTERS_TO_DISPLAY=10

# Nomination/OpenStreetMap (free, no key needed)
NOMINATIM_TIMEOUT=5000  # milliseconds
```

---

## 🤖 RAG Chatbot System

### Overview

Autisense includes an intelligent **RAG (Retrieval-Augmented Generation) Chatbot** that:
- Answers parent questions about screening results
- Provides guidance on app usage
- Explains behavioral markers and their significance
- Retrieves context from uploaded medical reports
- Uses Groq LLM for fast, accurate answers
- Maintains conversation history

### Complete Architecture

#### **System Components**

```
┌─────────────────────────────────────────────────────────────┐
│                   REACT FRONTEND (5173)                     │
│  - ChatAssistant.jsx (chat UI)                              │
│  - Report upload form                                       │
│  - Message display with structured formatting               │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST (Axios)
                       │ POST /api/chat/message
                       │ POST /api/chat/upload-report
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            NODE.JS/EXPRESS BACKEND (5000)                   │
│  - chatController.js (orchestration)                        │
│  - Multi-file upload handling (multer)                      │
│  - RAG service communication                                │
│  - Session management (MongoDB)                             │
│  - PDF absolute path handling                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP
                       │ POST /chat (question + context)
                       │ POST /rag/index (PDF path)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         FASTAPI RAG SERVICE (PORT 8002, Python)             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ PDF Processing (app/rag/pdf_processor.py)              │ │
│  │  - LangChain PyPDFLoader                               │ │
│  │  - RecursiveCharacterTextSplitter (800 char chunks)    │ │
│  │  - Overlap: 120 chars (for context continuity)         │ │
│  └────────────────────────────────────────────────────────┘ │
│                       │                                      │
│  ┌────────────────────▼────────────────────────────────────┐ │
│  │ Embeddings Engine (app/rag/embeddings.py)              │ │
│  │  - sentence-transformers: all-MiniLM-L6-v2            │ │
│  │  - Output: 384-dimensional vectors                     │ │
│  │  - Cosine similarity search                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                       │                                      │
│  ┌────────────────────▼────────────────────────────────────┐ │
│  │ Vector Database (app/rag/chroma_store.py)              │ │
│  │  - ChromaDB persistent storage (chroma_db/)            │ │
│  │  - Collections per screening_id                        │ │
│  │  - Metadata: chunk index, source page                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                       │                                      │
│  ┌────────────────────▼────────────────────────────────────┐ │
│  │ Chat Service (app/services/chat_service.py)            │ │
│  │  - Intent detection                                    │ │
│  │  - Chunk retrieval (top-k semantic search)             │ │
│  │  - Prompt construction                                 │ │
│  │  - Anti-hallucination rules                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                       │                                      │
│  ┌────────────────────▼────────────────────────────────────┐ │
│  │ Groq LLM Client (app/services/groq_client.py)          │ │
│  │  - Model: Meta Llama 3.3 70B Versatile                │ │
│  │  - Ultra-low latency inference                        │ │
│  │  - Token limit: 900 (configurable)                     │ │
│  │  - Temperature: 0.2 (low randomness)                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                       │                                      │
│  ┌────────────────────▼────────────────────────────────────┐ │
│  │ Response Formatting (app/services/prompting.py)        │ │
│  │  - Structured sections (Explanation, What it means,    │ │
│  │    Suggested next steps)                               │ │
│  │  - Rule-based responses for app guidance               │ │
│  │  - Safety guardrails                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │ JSON Response
                       │ {answer, used_report_context, intent}
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         MONGODB (Persistent Data Storage)                   │
│  - ChatSession collection (conversation history)            │
│  - User messages, assistant responses, intents              │
│  - Screening reference, timestamps                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│         CHROMADB (Persistent Vector Storage)                │
│  - Disk-based at: rag-service/chroma_db/                    │
│  - Collections: {screening_id}_chunks                       │
│  - Content: Embedded PDF text chunks                        │
│  - Metadata: chunk index, page numbers, content preview     │
└─────────────────────────────────────────────────────────────┘
```

### Report Upload & Indexing Flow

```
1. USER UPLOADS REPORT
   ┌─────────────────────────────────────┐
   │ Frontend: ChatAssistant.jsx         │
   │ - File input accepts PDF only       │
   │ - Shows upload progress bar         │
   │ - Max file size: 15 MB              │
   └────────────┬────────────────────────┘
                │ FormData with PDF
                ▼
   ┌─────────────────────────────────────┐
   │ Backend: POST /api/chat/upload-report
   │ - Multer handles multipart upload   │
   │ - Saves to uploads/medical-reports/ │
   │ - Generates absolute path           │
   │ - Returns path to RAG service       │
   └────────────┬────────────────────────┘
                │ Absolute path
                ▼
   ┌─────────────────────────────────────┐
   │ RAG Service: POST /rag/index        │
   │ - Receives: screening_id + pdf_path │
   │ - Loads PDF with LangChain          │
   │ - Splits into chunks (800 chars)    │
   │ - Embeds with sentence-transformers │
   │ - Stores in ChromaDB               │
   └────────────┬────────────────────────┘
                │
   ┌────────────▼──────────────┐
   │ ChromaDB Storage          │
   │ Collection: screening_{id}│
   │ Chunks: [                 │
   │  {                        │
   │    text: "...",          │
   │    embedding: [...],     │
   │    metadata: {           │
   │      chunk_idx: 0,       │
   │      page: 1             │
   │    }                      │
   │  },                       │
   │  ...                      │
   │ ]                         │
   └──────────────────────────┘
                │
                ▼
   ┌──────────────────────────────┐
   │ Frontend receives:            │
   │ {                             │
   │   success: true,              │
   │   indexing: {                 │
   │     success: true,            │
   │     message: "127 chunks...", │
   │     chunkCount: 127           │
   │   }                           │
   │ }                             │
   └──────────────────────────────┘
```

### Chat Message Processing Flow

```
1. USER ASKS QUESTION
   Input: "What does 'low eye contact' mean in the results?"
   ┌────────────────────────────────────────┐
   │ Intent Detection (chatController.js)   │
   │ Patterns:                              │
   │ - "explain|meaning" → 'explanation'    │
   │ - "what do i do|next steps" → 'rec...' │
   │ - "how do i use|navigate" → 'app_...'  │
   │ - Detected: 'explanation'              │
   └────────────┬─────────────────────────┘
                │
2. BUILD SYSTEM DATA
   ├─ Child age (age_months)
   ├─ Risk level from screening
   ├─ 6 behavioral indicators
   └─ Questionnaire concerns
                │
3. RETRIEVE REPORT CONTEXT
   ┌─────────────────────────────────────┐
   │ RAG Service: /chat endpoint         │
   │ - Query: "eye contact meaning"      │
   │ - Search ChromaDB for top-4 chunks  │
   │ - Cosine similarity scoring         │
   │ - Return most relevant text         │
   └────────────┬──────────────────────┘
                │
   ┌────────────▼────────────────────────┐
   │ Retrieved Chunks                    │
   │ [                                   │
   │   "Low eye contact is indicated     │
   │   by reduced gaze direction toward  │
   │   communication partner...",        │
   │   "Eye contact development follows  │
   │   typical milestones at 6 months...",
   │   ...                               │
   │ ]                                   │
   │ used_report_context: true           │
   └──────────────────────────────────────┘
                │
4. CONSTRUCT PROMPT
   ┌─────────────────────────────────────┐
   │ Groq Prompt:                        │
   │ "You are an autism support asst.    │
   │ System Data: {age, risk, markers}   │
   │ Report Context: {chunks}            │
   │ Question: {user_question}           │
   │ Intent: explanation                 │
   │                                     │
   │ Structure response as:              │
   │ Explanation: ...                    │
   │ What it means: ...                  │
   │ Suggested next steps: ..."          │
   └────────────┬────────────────────────┘
                │ Send to Groq
                ▼
5. GENERATE RESPONSE
   ┌─────────────────────────────────────┐
   │ Groq LLM Processing                 │
   │ Model: Meta Llama 3.3 70B           │
   │ Temperature: 0.2 (low randomness)   │
   │ Max tokens: 900                     │
   │ Latency: ~200-500ms                 │
   └────────────┬────────────────────────┘
                │ Structured output
                ▼
   Answer:
   "Explanation:
    Eye contact is a key social communication skill. In this 
    screening, 'Low Eye Contact' means your child spent <30% 
    of the video with their gaze directed toward the camera 
    or interacting person.
    
    What it means:
    This pattern may suggest challenges in joint attention 
    or social engagement. However, it can vary by age, 
    temperament, and context.
    
    Suggested next steps:
    • During daily activities, comment on what your child 
      looks at to build attention to faces
    • Play face-to-face games that encourage eye contact
    • Share observations with the specialist during evaluation
    • Track changes over the next 2-4 weeks"

6. SAVE CONVERSATION
   ┌─────────────────────────────────────┐
   │ MongoDB: ChatSession                │
   │ {                                   │
   │   _id: ObjectId(...),               │
   │   user: ObjectId(...),              │
   │   screening: ObjectId(...),         │
   │   messages: [                       │
   │     {                               │
   │       role: "user",                 │
   │       text: "What does...",         │
   │       intent: "explanation",        │
   │       timestamp: ISODate            │
   │     },                              │
   │     {                               │
   │       role: "assistant",            │
   │       text: "Explanation:...",      │
   │       intent: "explanation",        │
   │       timestamp: ISODate            │
   │     }                               │
   │   ]                                 │
   │ }                                   │
   └─────────────────────────────────────┘
                │
7. RETURN TO FRONTEND
   ┌────────────────────────────────────┐
   │ Response JSON:                     │
   │ {                                  │
   │   success: true,                   │
   │   answer: "Explanation:...",       │
   │   intent: "explanation",           │
   │   reportContextUsed: true,         │
   │   reportContextReason: "Retrieved" │
   │ }                                  │
   └────────────────────────────────────┘
```

### Intent Detection & Response Type

The RAG system detects user intent to provide appropriate responses:

```javascript
// app/services/prompting.py

INTENT_PATTERNS = {
    'app_guidance': {
        'patterns': ['how do i', 'how to use', 'navigate app', 'where to click'],
        'response_type': 'step-by-step instructions',
        'examples': [
            'How do I upload a report?',
            'Where can I find my child\'s screening history?'
        ]
    },
    
    'interpretation': {
        'patterns': ['what does', 'meaning', 'interpret', 'what does result mean'],
        'response_type': 'explanation + implications',
        'examples': [
            'What does "hand stimming" mean?',
            'What does the 75% score mean?'
        ]
    },
    
    'recommendation': {
        'patterns': ['what should i do', 'next steps', 'what can i do', 'recommend'],
        'response_type': 'actionable advice',
        'examples': [
            'What should we do if the risk is high?',
            'What can we do to help?'
        ]
    },
    
    'explanation': {
        'patterns': ['explain', 'eye contact', 'stimming', 'emotion'],
        'response_type': 'educational explanation',
        'examples': [
            'Can you explain social reciprocity?',
            'What is emotion variation?'
        ]
    },
    
    'general': {
        'patterns': ['what is autism', 'general questions'],
        'response_type': 'informational',
        'examples': [
            'What is autism spectrum disorder?'
        ]
    }
}
```

### Anti-Hallucination Guardrails

The RAG system includes strict rules to prevent hallucinating report content:

```javascript
// app/services/prompting.py

// Rule 1: Report Attribution
if (intent === 'report' && !used_report_context) {
    // Add to prompt:
    "If the user asks about 'the report says...' but no 
     report context was retrieved, explicitly state:
     'This information is not present in the uploaded report.'"
}

// Rule 2: System Data Primacy
"Never invent System Data facts. Use only verified screening data:
 - age_months (from child profile)
 - risk_level (from ML prediction)
 - indicators (from 6 behavioral markers)
 - questionnaire_concerns (from M-CHAT-R responses)"

// Rule 3: Chunk Validation
"Before using retrieved chunks:
 - Verify chunks are relevant to the question
 - Filter out header/footer-only chunks
 - Ensure consistency with System Data facts"

// Rule 4: No Diagnosis Claims
"NEVER claim diagnostic conclusions. Always include:
 - 'An expert evaluation is needed for diagnosis'
 - 'This screening is NOT diagnostic'
 - 'Consult a professional for definitive answers'"

// Rule 5: Report Absence Handling
"If no report was uploaded:
 - Use System Data facts exclusively
 - Don't say 'the report says...'
 - Offer to index a report for more context"
```

### Environment Configuration

```env
# RAG Service (rag-service/.env)
PORT=8002
HOST=0.0.0.0

# Groq LLM
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_MAX_TOKENS=900
GROQ_TEMPERATURE=0.2
GROQ_TIMEOUT=30000

# ChromaDB Storage
RAG_CHROMA_PATH=./chroma_db
RAG_COLLECTION_NAME=medical_reports

# PDF Processing
RAG_CHUNK_SIZE=800
RAG_CHUNK_OVERLAP=120
RAG_MAX_SEARCH_RESULTS=4

# Embeddings
RAG_EMBEDDING_MODEL=all-MiniLM-L6-v2
RAG_EMBEDDING_DIMENSION=384

# CORS
RAG_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000

# Backend Integration
RAG_SERVICE_URL=http://localhost:8002
RAG_CHAT_TIMEOUT_MS=180000
RAG_INDEX_TIMEOUT_MS=600000
```

### API Endpoints

#### **Chat Endpoint**
```http
POST /chat

Request Body:
{
  "screening_id": "60d5ec49c1234567890abcde",
  "question": "What does low eye contact mean?",
  "system_data": {
    "age_months": 28,
    "risk_level": "High",
    "indicators": ["Low Eye Contact", "Hand Stimming", "Low Social Reciprocity"]
  },
  "history": [
    {
      "role": "user",
      "text": "What does the 75% score mean?"
    },
    {
      "role": "assistant",
      "text": "The 75% indicates a high risk..."
    }
  ],
  "n_results": 4
}

Response:
{
  "success": true,
  "answer": "Explanation:\nEye contact is...\n\nWhat it means:\nLow eye contact...\n\nSuggested next steps:\n- Track changes...",
  "used_report_context": true,
  "report_context_reason": "Retrieved top chunks from indexed report",
  "intent": "explanation"
}
```

#### **PDF Indexing Endpoint**
```http
POST /rag/index

Request Body:
{
  "screening_id": "60d5ec49c1234567890abcde",
  "pdf_path": "D:\\AutismProject\\backend\\uploads\\medical-reports\\medical-report-123456.pdf"
}

Response:
{
  "success": true,
  "data": {
    "screening_id": "60d5ec49c1234567890abcde",
    "pdf_path": "D:\\AutismProject\\backend\\uploads\\...",
    "chunk_count": 127,
    "tokens_indexed": 4356,
    "collection_name": "60d5ec49c1234567890abcde_chunks"
  }
}
```

---

## 📊 Integration & Data Flow

All three features work together in a cohesive system:

```
User Completes Screening
         │
         ▼
┌─────────────────────────────┐
│ Backend Processing          │
├─────────────────────────────┤
│ 1. Calculate scores         │
│ 2. Generate interpretation  │
│ 3. Fetch nearby centers     │
│ 4. Create PDF report        │
└──────────┬──────────────────┘
           │
    ┌──────┴──────┬──────────┐
    │             │          │
    ▼             ▼          ▼
┌────────┐  ┌────────┐  ┌──────────────┐
│ Report │  │Centers │  │ Store in DB  │
│ PDF    │  │List    │  │ + Frontend   │
└────────┘  └────────┘  └──────────────┘
    │             │              │
    └─────────────┴──────────────┘
           │
           ▼
    ┌─────────────────────────┐
    │ Display in Results page │
    │ - Risk badge            │
    │ - Centers nearby        │
    │ - Chat button           │
    └────────┬────────────────┘
             │
      ┌──────▼───────┐
      │ User clicks  │
      │ "Chat" or    │
      │ "Upload PDF" │
      └──────┬───────┘
             │
      ┌──────▼────────────────┐
      │ RAG Chatbot opens     │
      │ - Can ask questions   │
      │ - Upload report       │
      │ - Chat gets indexed   │
      │ - Context retrieved   │
      └──────────────────────┘
```

---

## Summary

| Feature | Purpose | Tech Stack | Port |
|---------|---------|-----------|------|
| **Report Generation** | Professional PDF with screening results, centers, recommendations | PDFKit, Groq LLM | 5000 (Backend) |
| **Centers Locator** | Find nearby autism diagnostic centers with distances | SerpAPI, Nominatim, Haversine formula | 5000 (Backend) |
| **RAG Chatbot** | Answer questions about results using report context | ChromaDB, sentence-transformers, Groq, FastAPI | 8002 (RAG Service) |

All features are production-ready and documented for deployment.
