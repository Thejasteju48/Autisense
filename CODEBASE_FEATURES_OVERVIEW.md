# AutiSense Codebase Features Overview

## Complete Feature Architecture & Integration

---

## ⚕️ 1. REPORT GENERATION & PDF FUNCTIONALITY

### Overview
The system generates professional medical screening reports that combine behavioral analysis, video findings, and AI clinical insights into downloadable PDF documents.

### Key Files & Functions

#### **Backend Services** 

**[backend/services/pdfService.js](backend/services/pdfService.js#L1-L382)**
- **Main Function**: `generateScreeningReport(screening, llmAnalysis, indicatorExplanations, nearbyCenters)`
- **Purpose**: Creates hospital-standard PDF reports with multi-page layouts
- **Features**:
  - Patient demographics & guardian details
  - Behavioral assessment tables with clinical indicators
  - Per-indicator AI explanations
  - Risk level assessment with recommendations
  - Nearby autism centers (distance calculated)
  - Legal disclaimers and page numbering
  - Dynamic page breaks for content overflow

**[backend/utils/pdfGenerator.js](backend/utils/pdfGenerator.js#L1-L100)**
- Simplified PDF generation wrapper
- Backup utility for basic report generation
- Uses pdfkit library for PDF creation

**[backend/services/reportRagService.js](backend/services/reportRagService.js#L1-L75)**
- **Main Function**: `retrieveReportContext(reportPath, question, topK)`
- **Purpose**: Extracts text from generated PDF reports for RAG chatbot context
- Text chunking (800 char chunks with 120 char overlap)
- Keyword-based ranking for question-relevant chunks
- Fallback handling for missing or corrupted PDFs

#### **Database Model**

**[backend/models/Screening.js](backend/models/Screening.js#L146-L152)**
```
reportGenerated: Boolean (default: false)
reportPath: String (file system path to PDF)
uploadedReportPath: String (path to user-uploaded medical report)
```

#### **Controller Endpoint**

**[backend/controllers/screeningController.js](backend/controllers/screeningController.js#L428-L510)** 
- **Endpoint**: `GET /api/screenings/:id/report`
- **Workflow**:
  1. Fetch screening data + populate child & user info
  2. Generate per-indicator AI explanations (via Groq)
  3. Fetch nearby autism centers (via places service)
  4. Generate fresh LLM analysis for standardized formatting
  5. Build PDF using pdfService
  6. Save report path to database
  7. Send file as download response

#### **Frontend Implementation**

**[frontend/src/pages/ScreeningResults.jsx](frontend/src/pages/ScreeningResults.jsx#L54-L118)**
- `handleDownloadReport()` function
- Calls `screeningAPI.downloadReport(screeningId)`
- Creates blob URL and triggers browser download
- Constructs filename: `autism-screening-report-{childName}-{date}.pdf`

**[frontend/src/services/api.js](frontend/src/services/api.js#L88-L104)**
```javascript
downloadReport: (screeningId) => 
  api.get(`/screenings/${screeningId}/report`, { responseType: 'blob' })
```

### PDF Report Structure
1. **Header** - Title, generation date, report ID
2. **Patient Details** - Name, age, gender, screening date
3. **Guardian Details** - Parent name, location
4. **Behavioral Assessment** - Table comparing observations vs typical development
5. **Detailed Behavioral Findings** - Per-indicator status with clinical notes
6. **Assessment Summary** - Risk level, indicators requiring follow-up
7. **Questionnaire Observations** - Concerning parent-reported signs
8. **Clinical Impression** - Professional interpretation
9. **Extended Clinical Explanation** - Full AI analysis (if available)
10. **Recommendations** - Action plan based on risk level
11. **Nearby Centers** - Top 3 autism support centers with distances
12. **Disclaimer** - Legal notice about screening vs diagnosis

### Report Generation Flow
```
POST /api/screenings/:id/report
    ↓
screeningController.generateReport()
    ├─→ groqService.generateIndicatorExplanations() [parallel]
    ├─→ placesService.getNearbyAutismCenters()        [parallel]
    ├─→ groqService.generateScreeningAnalysis()
    ├─→ pdfService.generateScreeningReport()
    ├─→ Save reportPath to Screening model
    └─→ Response: Download file stream
```

---

## 🗺️  2. NEAREST AUTISM CENTERS / LOCATION FEATURES

### Overview
The system identifies and displays nearby autism support centers using geolocation and third-party APIs, with distance calculations and navigation integration.

### Key Files & Functions

#### **Backend Service** - Place & Location Lookup

**[backend/services/placesService.js](backend/services/placesService.js#L1-L181)**
- **Primary Function**: `getNearbyAutismCenters(city, state, country, limit)`
- **Provider**: SerpAPI + Nominatim (free OpenStreetMap geocoder)
- **Process Flow**:
  1. **Geocode User Location**: `geocodeCity()` → Get lat/lon of city
  2. **Search Autism Centers**: `fetchSerpApiCenters(city)` → Query via SerpAPI
  3. **Extract Center Data**: Parse title, address, coordinates
  4. **Fallback Geocoding**: For centers without GPS coords, use `geocodeAddress()`
  5. **Distance Calculation**: Haversine formula for km conversion
  6. **Deduplication**: Remove duplicates by name+address key
  7. **Sort & Limit**: Sort by distance, return top N centers

**Helper Functions**:
- `geocodeCity(city, state, country)` → Returns {latitude, longitude}
- `geocodeAddress(addressText)` → Geocodes individual addresses
- `fetchSerpApiCenters(city)` → Queries SerpAPI for places
- `haversineKm(lat1, lon1, lat2, lon2)` → Calculate distance in kilometers
- `buildGoogleNavigateUrl(lat, lng)` → Generate Google Maps navigation URL

**Center Object Structure**:
```json
{
  "name": "Autism Support Center Name",
  "address": "Full address",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "distanceKm": 2.5,
  "distanceText": "2.5 km",
  "mapsUrl": "https://www.google.com/maps/dir/?api=1&destination=12.9716,77.5946"
}
```

#### **Controller Endpoint**

**[backend/controllers/centersController.js](backend/controllers/centersController.js#L1-L41)**
- **Endpoint**: `GET /api/centers?city=Bangalore&state=Karnataka&country=India`
- **Access**: Protected (requires authentication)
- **Response**: Returns array of nearby centers with metadata

#### **API Routes**

**[backend/routes/centersRoutes.js](backend/routes/centersRoutes.js#L1-L9)**
```
GET /api/centers (protected)
```

#### **Frontend Implementation**

**[frontend/src/pages/ScreeningResults.jsx](frontend/src/pages/ScreeningResults.jsx#L355-L410)**
- Loads nearby centers on results page load
- Uses `centersAPI.getNearby({ city, state, country })`
- **Display Components**:
  - Highlighted "Nearest Autism Center" box (top result)
  - Table showing all centers with:
    - Center name
    - Address
    - Distance
    - "Navigate" button (opens Google Maps)

**[frontend/src/services/api.js](frontend/src/services/api.js#L88-L104)**
```javascript
centersAPI = {
  getNearby: ({ city, state, country }) =>
    api.get('/centers', { params: { city, state, country } })
}
```

### Centers Integration with Report

In [backend/controllers/screeningController.js](backend/controllers/screeningController.js#L428-L510), the report generation:
1. Calls `placesService.getNearbyAutismCenters()` in parallel with AI analysis
2. Passes `nearbyCenters` array to `pdfService.generateScreeningReport()`
3. Generates a "Nearby Autism Support Centers" section in the PDF with top 3 centers

### Location Data Flow
```
User in ScreeningResults.jsx
    ↓
useEffect → fetchResults()
    ├─→ Get screening data (includes city, state, country)
    ├─→ Call centersAPI.getNearby()
    │   └─→ GET /api/centers?city=...&state=...&country=...
    │       └─→ centersController.getCenters()
    │           └─→ placesService.getNearbyAutismCenters()
    │               ├─→ Geocode city via Nominatim
    │               ├─→ Fetch places via SerpAPI
    │               ├─→ Calculate distances
    │               └─→ Return top centers
    └─→ Display in Results page table + "Navigate" buttons
```

**External Services Used**:
- **SerpAPI** (`https://serpapi.com/search.json`) - Local search results
- **Nominatim** (`https://nominatim.openstreetmap.org/search`) - Free geocoding

---

## 🤖 3. RAG CHATBOT SYSTEM

### Overview
A Retrieval-Augmented Generation (RAG) chatbot that answers parent questions about screening results, uploaded medical reports, and autism support guidance. Uses vector embeddings, semantic search, and Groq LLM for contextual responses.

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend: Chat Interface (React)                       │
│  - Send message                                         │
│  - Upload medical report (PDF)                          │
└────────────────┬────────────────────────────────────────┘
                 │
      ┌──────────┴──────────┐
      ↓                     ↓
POST /api/chat/:id/message  POST /api/chat/:id/upload-report
      │                     │
┌─────┴─────────────────────┴────────────────────────────┐
│  Backend (Node.js)                                      │
│  - chatController.sendMessage()                         │
│  - chatController.uploadMedicalReport()                 │
│  - ChatSession model (message history)                  │
└─────┬─────────────────────────────────────────────────┘
      │
      ├─────────────────────────────────────────┐
      ↓                                         ↓
  HTTP POST to RAG Service              RAG Service processes:
  (Python FastAPI)                      - Index PDFs into Chroma
                                       - Generate embeddings
                                       - Retrieve relevant chunks
                                       - Feed to Groq LLM
```

### Key Files & Functions

#### **Frontend Components**

**[frontend/src/pages/ChatAssistant.jsx](frontend/src/pages/ChatAssistant.jsx#L109-L163)**
- `handleUploadReport(event)` - Upload medical report PDF
  - Validates file type (PDF only)
  - Sends to backend via `chatAPI.uploadReport()`
  - Shows success/error toasts
- Chat message interface with suggested questions
- Real-time message display with streaming support

**[frontend/src/services/api.js](frontend/src/services/api.js#L88-L104)**
```javascript
chatAPI = {
  getSuggestions: () => api.get('/chat/suggestions'),
  getHistory: (screeningId) => api.get(`/chat/${screeningId}/history`),
  sendMessage: (screeningId, payload) => api.post(`/chat/${screeningId}/message`, payload),
  uploadReport: (screeningId, file) => {
    const formData = new FormData();
    formData.append('reportFile', file);
    return api.post(`/chat/${screeningId}/upload-report`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
}
```

#### **Backend Controller**

**[backend/controllers/chatController.js](backend/controllers/chatController.js#L1-L250)**

**`sendMessage(req, res)` Endpoint**: `POST /api/chat/:screeningId/message`
- **Receives**: `{ question: string, language: 'en'|'hi'|'kn' }`
- **Process Flow**:
  1. Validate screening exists
  2. Load/create ChatSession (stores message history)
  3. Detect user intent (explanation, interpretation, recommendation, app_guidance, etc.)
  4. Convert screening data to system format
  5. Call RAG service: `POST {RAG_SERVICE_URL}/chat`
  6. Save message + response to ChatSession
  7. Return response with intent and metadata

**Helper Functions**:
- `detectIntent(question)` - Classify question type
- `toSystemData(screening)` - Convert screening to structured format for LLM
- `isRetryableAxiosError(e)` - Handle transient network errors
- `postJsonWithRetry()` - Retry failed requests up to N times

**`uploadMedicalReport(req, res)` Endpoint**: `POST /api/chat/:screeningId/upload-report`
- **Receives**: Multipart form with PDF file
- **Process**:
  1. Validate PDF file type
  2. Store file in `backend/uploads/medical-reports/`
  3. Save absolute path to `Screening.uploadedReportPath`
  4. **Async indexing**: POST to RAG service `/rag/index` endpoint
  5. Return upload status + indexing result
- **Indexing**: Best-effort (doesn't block if RAG service fails)

#### **Backend Models**

**[backend/models/ChatSession.js](backend/models/ChatSession.js#L1-L50)**
```javascript
{
  user: ObjectId (ref: 'User'),
  screening: ObjectId (ref: 'Screening'),
  messages: [
    {
      role: 'user' | 'assistant',
      text: string,
      intent: 'explanation' | 'interpretation' | 'recommendation' | 'report' | 'general' | 'app_guidance' | 'other',
      language: 'en' | 'hi' | 'kn',
      createdAt: Date
    }
  ],
  timestamps: true
}
```

**[backend/models/Screening.js](backend/models/Screening.js#L146-L152)**
```
uploadedReportPath: String (path to user-uploaded PDF for RAG context)
```

#### **Backend Services**

**[backend/services/chatAssistantService.js](backend/services/chatAssistantService.js#L1-L100)**
- `getSuggestedQuestions()` - Generate context-aware suggested questions
- Intent detection helpers
- System data formatting
- Diagnosis safety message protection

**[backend/services/groqService.js](backend/services/groqService.js#L1-L100)**
- `generateScreeningAnalysis(screeningData)` - Create detailed clinical analysis
- Uses Groq LLM with structured prompt for standardized format
- Returns analysis text for PDF reports & chat contexts

#### **Backend Routes**

**[backend/routes/chatRoutes.js](backend/routes/chatRoutes.js#L1-L39)**
```javascript
POST   /chat/suggestions              → getSuggestions()
GET    /chat/:screeningId/history     → getHistory()
POST   /chat/:screeningId/upload-report → uploadMedicalReport()
POST   /chat/:screeningId/message     → sendMessage()

(All routes protected with auth middleware)
```

#### **RAG Service (Python FastAPI)**

**[rag-service/main.py](rag-service/main.py#L1-L100)**
- **FastAPI application** serving RAG endpoints
- **Endpoints**:
  - `POST /rag/index` - Index PDF from file path
  - `POST /rag/index-upload` - Index uploaded PDF
  - `POST /chat` - Chat with RAG context

**PDF Processing**: [rag-service/app/rag/pdf_processor.py](rag-service/app/rag/pdf_processor.py#L1-L28)
- `load_and_split_pdf(pdf_path, chunk_size=500, chunk_overlap=100)`
- Uses LangChain PyPDFLoader
- RecursiveCharacterTextSplitter for semantic-aware chunking
- Returns list of (text, metadata) tuples

**Vector Database**: [rag-service/app/rag/chroma_store.py](rag-service/app/rag/chroma_store.py#L1-L80)
- **ChromaDB** persistent vector database
- **Functions**:
  - `upsert_report_chunks(screening_id, documents, embeddings, metadatas, ids)` - Index chunks
  - `query_report_chunks(screening_id, query_embedding, n_results)` - Semantic search
- **Distance Metric**: Cosine similarity (optimal for sentence-transformer embeddings)
- **Re-indexing**: Automatically deletes old chunks for same screening before adding new ones

**Chat Service**: [rag-service/app/services/chat_service.py](rag-service/app/services/chat_service.py#L1-L260)

**Key Functions**:
- `index_pdf_for_screening()` - Index PDF for a screening
  1. Load PDF chunks (500 chars, 100 overlap)
  2. Generate embeddings using MiniLM-L6-v2
  3. Upsert to ChromaDB with screening_id metadata
  4. Return count of indexed chunks

- `retrieve_context(screening_id, question, n_results=4)` - Retrieve relevant chunks
  1. Embed question
  2. Query ChromaDB with cosine distance
  3. Filter headers/footers (distance > 0.6)
  4. Keep cumulative context ≤ 2500 chars
  5. Return concatenated chunks

- `retrieve_context_relaxed()` - Fallback for generic "summarize" questions
  1. Uses canonical query for broad "findings" sections
  2. No strict distance threshold (avoids false "no context" on generic queries)
  3. Same context size limits

- `answer_question()` - Main chat logic
  1. Build question with conversation history (last 5 messages)
  2. Detect intent (app_guidance, interpretation, recommendation, explanation, etc.)
  3. Attempt strict retrieval; fallback to relaxed for summary questions
  4. If user asks about report but no chunks found → explicit "report not uploaded" message
  5. Build strict prompt with system data + retrieved context
  6. Call Groq LLM
  7. Normalize formatting (for recommendation questions: time blocks, day headers)
  8. Strip misleading report claims if no report context used
  9. Return answer + metadata (used_report_context, retrieved_chunks)

**Embedding Model**: [rag-service/app/rag/embeddings.py](rag-service/app/rag/embeddings.py)
- Model: `all-MiniLM-L6-v2` (sentence-transformers)
- Small, fast, good for medical text
- 384-dimensional embeddings

**Groq Integration**: [rag-service/app/services/groq_client.py](rag-service/app/services/groq_client.py)
- LLM: Groq (ultra-fast LLM inference)
- Model: Selected via `GROQ_MODEL_NAME` env var
- Methods:
  - `groq_chat_completion(prompt)` - Single turn
  - `build_strict_prompt()` - Format context + question for LLM
  - `ensure_response()` - Fallback for failed LLM calls
  - `detect_intent()` - Python-side intent classification
  - `build_question_with_history()` - Inject conversation memory

### Chat Message Flow

```
User asks question in ChatAssistant.jsx
    ↓
handleSendMessage() → chatAPI.sendMessage()
    ↓
POST /api/chat/:screeningId/message
    ├─→ Load screening + create/load ChatSession
    ├─→ detectIntent(question)
    ├─→ toSystemData(screening)
    ├─→ postJsonWithRetry() to RAG service
    │   └─→ POST {RAG_SERVICE_URL}/chat
    │       └─→ rag.answer_question()
    │           ├─→ retrieve_context(screening_id, question)
    │           ├─→ build_strict_prompt(system_data, context, question, intent)
    │           ├─→ groq_chat_completion(prompt)
    │           └─→ Normalize & return answer
    ├─→ Save message to ChatSession
    ├─→ Return response { answer, metadata }
    └─→ Display in UI
```

### Report Upload Flow

```
User uploads PDF in ChatAssistant.jsx
    ↓
handleUploadReport() → chatAPI.uploadReport(file)
    ↓
POST /api/chat/:screeningId/upload-report
    ├─→ Validate PDF file type
    ├─→ Save to backend/uploads/medical-reports/{filename}.pdf
    ├─→ Update Screening.uploadedReportPath
    ├─→ AsyncQueue: postJsonWithRetry() to RAG service
    │   └─→ POST {RAG_SERVICE_URL}/rag/index
    │       └─→ load_and_split_pdf(pdf_path)
    │       ├─→ embed_texts(chunks)
    │       └─→ upsert_report_chunks() to ChromaDB
    └─→ Return { success, indexing_status }
```

### Intent Classification

The system classifies questions into:
- **`app_guidance`**: How to use features, upload, navigation
- **`interpretation`**: What does result mean, risk level, score
- **`recommendation`**: What to do next, therapy, support
- **`explanation`**: Why eye contact matters, behavior explanation
- **`report`**: Questions about uploaded PDF content
- **`general`**: What is autism, definitions
- **`other`**: Unclassified

### Safety Features

1. **Diagnosis Protection**: If question asks "Is my child autistic?", responds with disclaimer that screening ≠ diagnosis
2. **Report Context Honesty**: If no report uploaded, explicitly states this rather than implying access
3. **Transient Error Retry**: Automatic retry for network issues
4. **Graceful Degradation**: Falls back to empty context if RAG unavailable (still answers from system data)
5. **Intent-Based Response**: Formats answers appropriately (lists vs. paragraphs vs. time-blocks)

### Environment Configuration

Required environment variables:
```
GROQ_API_KEY              # Groq LLM API key
RAG_SERVICE_URL          # http://localhost:8002 (Python RAG service)
RAG_CHAT_TIMEOUT_MS      # 180000 (3 min timeout for /chat)
RAG_INDEX_TIMEOUT_MS     # 600000 (10 min timeout for /rag/index)
RAG_CHROMA_PATH          # ./chroma_db (vector DB location)
RAG_COLLECTION_NAME      # medical_reports (Chroma collection)
GROQ_MODEL_NAME          # mixtral-8x7b-32768 (or other Groq model)
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend Chat | React + Framer Motion | User interface |
| Backend API | Node.js/Express | REST endpoints |
| Chat Messages | MongoDB ChatSession | History persistence |
| RAG Service | Python FastAPI | Vector search + LLM inference |
| Embeddings | sentence-transformers | Text → vectors |
| Vector DB | ChromaDB | Semantic search |
| LLM | Groq | Fast response generation |
| PDF Processing | LangChain + PyPDF | Text extraction |

---

## 🔌 Integration Points

### Data Flow Summary

```
Screening Created/Completed
    ├─→ Results Page
    │   ├─→ Generate Report (PDF + Nearby Centers)
    │   ├─→ Download Report
    │   └─→ View Nearby Centers (Geocode + SerpAPI)
    │
    └─→ Chat Assistant
        ├─→ Send Messages (RAG-enhanced)
        │   ├─→ Retrieve system data
        │   ├─→ Query uploaded report (if available)
        │   └─→ Groq LLM response
        │
        └─→ Upload Medical Report
            ├─→ Store PDF
            └─→ Index to ChromaDB (for future chat queries)
```

### Key Shared Data

- **Screening Model**: Central data structure used by reports, centers, and chat
- **screening.liveVideoFeatures**: Behavioral indicators for PDF + chat context
- **screening.questionnaire**: Parent responses for PDF + chat context
- **screening.child**: Demographics for PDF + chat context
- **screening.user**: Location for centers lookup
- **screening.uploadedReportPath**: Medical report for RAG retrieval

---

## 📊 Summary Statistics

| Feature | Files | Endpoints | Models | Services |
|---------|-------|-----------|--------|----------|
| PDF Reports | 4 | 1 | 1 | 3 |
| Autism Centers | 3 | 1 | 0 | 1 |
| RAG Chatbot | 12+ | 4 | 1 | 5 |
| **Total** | **19+** | **6** | **2** | **9** |

---

## 🔍 File Directory Reference

```
backend/
├── controllers/
│   ├── chatController.js          ← Chat message & report upload
│   ├── centersController.js       ← Nearby centers lookup
│   └── screeningController.js     ← Report generation endpoint
├── services/
│   ├── pdfService.js              ← PDF generation
│   ├── placesService.js           ← Geolocation & SerpAPI
│   ├── chatAssistantService.js    ← Chat suggestions & intent
│   ├── groqService.js             ← LLM analysis
│   └── reportRagService.js        ← PDF text extraction
├── models/
│   ├── ChatSession.js             ← Message history
│   ├── Screening.js               ← Report & upload paths
│   └── (others)
├── routes/
│   ├── chatRoutes.js              ← /chat endpoints + multer
│   ├── centersRoutes.js           ← /centers endpoints
│   └── screeningRoutes.js         ← /screenings endpoints
├── uploads/
│   └── medical-reports/           ← Uploaded PDFs
└── reports/                       ← Generated PDFs

frontend/src/
├── pages/
│   ├── ScreeningResults.jsx       ← Results + download + centers
│   └── ChatAssistant.jsx          ← Chat UI + upload
└── services/
    └── api.js                     ← screeningAPI, centersAPI, chatAPI

rag-service/
├── main.py                        ← FastAPI app & routes
├── app/
│   ├── rag/
│   │   ├── pdf_processor.py       ← PDF → chunks
│   │   ├── embeddings.py          ← MiniLM embedding model
│   │   └── chroma_store.py        ← ChromaDB operations
│   └── services/
│       ├── chat_service.py        ← RAG + LLM logic
│       ├── groq_client.py         ← Groq integration
│       └── prompting.py           ← Prompt builders
└── chroma_db/                     ← Vector DB storage
```

