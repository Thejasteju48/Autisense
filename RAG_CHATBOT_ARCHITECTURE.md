# RAG Chatbot Implementation - Complete Architecture Guide

## Overview
This autism screening project implements a sophisticated **Retrieval-Augmented Generation (RAG)** chatbot that provides context-aware guidance to parents. The system intelligently combines user screening data, uploaded medical reports, and LLM responses to deliver accurate, personalized guidance.

---

## 1. FRONTEND CHATBOT COMPONENT

### File: [frontend/src/pages/ChatAssistant.jsx](frontend/src/pages/ChatAssistant.jsx)

**Purpose**: Main React component for the chat interface

**Key Features**:
- **Language switching**: English (en), Hindi (hi), Kannada (kn)
- **Medical report upload**: Upload PDF reports for RAG context
- **Suggested questions**: Pre-defined suggestions for common queries
- **Chat history**: Load/display message history with user and assistant messages
- **Message formatting**: Parse assistant responses into structured sections
  - Explanation
  - What it means
  - Recommended actions
  - Suggested next steps

**Key State Management**:
```javascript
const [messages, setMessages] = useState([]);           // Chat history
const [question, setQuestion] = useState('');           // Current input
const [language, setLanguage] = useState('en');         // Selected language
const [sending, setSending] = useState(false);          // Message sending status
const [uploading, setUploading] = useState(false);      // Report upload status
```

**API Calls**:
```javascript
chatAPI.getHistory(screeningId)        // GET /chat/:screeningId/history
chatAPI.getSuggestions()               // GET /chat/suggestions
chatAPI.sendMessage(screeningId, {})   // POST /chat/:screeningId/message
chatAPI.uploadReport(screeningId, file)// POST /chat/:screeningId/upload-report
```

---

## 2. FRONTEND API SERVICE

### File: [frontend/src/services/api.js](frontend/src/services/api.js#L97-L104)

**Chat API endpoints**:
```javascript
export const chatAPI = {
  getSuggestions: () => api.get('/chat/suggestions'),
  getHistory: (screeningId) => api.get(`/chat/${screeningId}/history`),
  sendMessage: (screeningId, payload) => api.post(`/chat/${screeningId}/message`, payload),
  uploadReport: (screeningId, file) => {
    const formData = new FormData();
    formData.append('reportFile', file);
    return api.post(`/chat/${screeningId}/upload-report`, formData, {
      // multipart/form-data headers
    });
  }
};
```

---

## 3. BACKEND API ROUTES

### File: [backend/routes/chatRoutes.js](backend/routes/chatRoutes.js)

**Endpoints**:
1. `GET /chat/suggestions` → Get suggested questions
2. `GET /chat/:screeningId/history` → Fetch chat message history
3. `POST /chat/:screeningId/upload-report` → Upload medical report PDF
4. `POST /chat/:screeningId/message` → Send message and get assistant response

**Middleware**:
- `protect` middleware: Ensures user is authenticated
- `multer` upload middleware: Handles PDF file upload
  - Max file size: 15MB
  - Accepted type: application/pdf only
  - Storage: `backend/uploads/medical-reports/`

---

## 4. BACKEND CHAT CONTROLLER

### File: [backend/controllers/chatController.js](backend/controllers/chatController.js)

### 4.1 `sendMessage()` - Core Chat Logic

**Flow**:
1. Extract `screeningId` and `question` from request
2. Fetch screening data (child info, risk level, behavioral features)
3. Create/update ChatSession in MongoDB
4. Detect user intent (explanation, interpretation, recommendation, app_guidance, etc.)
5. Call RAG service at `http://localhost:8002/chat`
6. Save messages to ChatSession
7. Return answer with metadata

**Critical Variables**:
```javascript
const RAG_SERVICE_URL = 'http://localhost:8002';     // Python RAG service
const RAG_CHAT_TIMEOUT_MS = 180000;                  // 3 minutes
const RAG_INDEX_TIMEOUT_MS = 600000;                 // 10 minutes
```

**RAG Service Request**:
```javascript
await postJsonWithRetry(`${RAG_SERVICE_URL}/chat`, {
  screening_id: String(screeningId),
  system_data: {
    age_months: ageMonths,
    risk_level: 'low/medium/high',
    indicators: ['Eye Contact: ...', 'Head Stimming: ...', ...]
  },
  question: String(question).trim(),
  history: [...],  // Last 5 messages
  n_results: 4     // Number of report chunks to retrieve
}, { timeout: RAG_CHAT_TIMEOUT_MS, retries: 1 });
```

### 4.2 `uploadMedicalReport()` - Report Upload & Indexing

**Flow**:
1. Validate PDF file
2. Save file to `backend/uploads/medical-reports/`
3. Store absolute path in Screening document
4. Call RAG service to index PDF: `POST /rag/index`
5. Return success/failure status

**Key Code**:
```javascript
const idxRes = await axios.post(
  `${RAG_SERVICE_URL}/rag/index`,
  {
    screening_id: String(screening._id),
    pdf_path: screening.uploadedReportPath  // Absolute Windows path
  },
  { timeout: RAG_INDEX_TIMEOUT_MS }
);
```

### 4.3 `getHistory()` - Fetch Chat History
- Retrieves ChatSession for user + screening
- Returns all messages with role, text, intent, language

### 4.4 `getSuggestions()` - Fetch Suggested Questions
- Returns predefined questions from chatAssistantService

---

## 5. CHAT SESSION - MESSAGE HISTORY STORAGE

### File: [backend/models/ChatSession.js](backend/models/ChatSession.js)

**MongoDB Schema**:
```javascript
ChatSession {
  user: ObjectId (ref: User),
  screening: ObjectId (ref: Screening),
  messages: [
    {
      role: 'user' | 'assistant',
      text: String,
      intent: 'explanation' | 'interpretation' | 'recommendation' | 'report' | 'general' | 'app_guidance' | 'other',
      language: 'en' | 'hi' | 'kn',
      createdAt: Date
    }
  ],
  timestamps: true
}
```

**Unique Index**: `{ user: 1, screening: 1 }` - One chat session per screening per user

---

## 6. BACKEND RAG SERVICE INTEGRATION

### File: [backend/services/reportRagService.js](backend/services/reportRagService.js)

**Purpose**: Local fallback PDF processing (when Python RAG service is unavailable)

**Key Functions**:
```javascript
exports.retrieveReportContext = async (reportPath, question, topK = 3) {
  // 1. Read PDF file
  const buffer = fs.readFileSync(reportPath);
  const parsed = await pdfParse(buffer);
  
  // 2. Extract text
  const text = normalize(parsed.text);
  
  // 3. Chunk text (800 chars, 120 char overlap)
  const chunks = chunkText(text, 800, 120);
  
  // 4. Rank chunks by keyword match
  const ranked = rankChunks(question, chunks);
  
  // 5. Return top K chunks
  return { context, found, reason };
}
```

**Algorithm**:
- Tokenize question and each chunk
- Calculate score = count of matching tokens
- Return top chunks with scores > 0

---

## 7. PYTHON RAG SERVICE (CORE SYSTEM)

### File: [rag-service/main.py](rag-service/main.py)

**Framework**: FastAPI + Uvicorn
**Port**: 8002

**Endpoints**:
1. `GET /` - Service info
2. `GET /health` - Health check with config status
3. `POST /rag/index` - Index PDF for a screening
4. `POST /rag/index-upload` - Index uploaded PDF
5. `POST /chat` - Chat endpoint (main RAG logic)

**Startup Checks**:
- Verify GROQ_API_KEY is set
- Warm up embedding model
- Initialize ChromaDB connection

---

## 8. VECTOR DATABASE & EMBEDDINGS

### File: [rag-service/app/rag/chroma_store.py](rag-service/app/rag/chroma_store.py)

**Vector Database**: ChromaDB (Persistent)
**Path**: `./chroma_db/` (or `RAG_CHROMA_PATH`)
**Collection**: `medical_reports` (or `RAG_COLLECTION_NAME`)

**Storage Strategy**:
```python
collection = chromadb.PersistentClient(
    path=chroma_path,
    settings=Settings(anonymized_telemetry=False)
)

collection = client.get_or_create_collection(
    name=collection_name,
    metadata={"hnsw:space": "cosine"}  # Cosine similarity
)
```

**Key Operations**:
- `upsert_report_chunks()`: Index text chunks with embeddings
  - Document IDs: `{screening_id}:{chunk_number}`
  - Metadata includes: `screening_id`, `page_number`, etc.
- `query_report_chunks()`: Semantic search
  - Input: screening_id, query_embedding, n_results
  - Output: documents, distances, metadatas

### File: [rag-service/app/rag/embeddings.py](rag-service/app/rag/embeddings.py)

**Embedding Model**: `all-MiniLM-L6-v2`
- Small, fast model (22MB)
- Generates 384-dimensional vectors
- Normalized embeddings for cosine similarity

**Class**: `EmbeddingModel`
```python
def embed_texts(texts: list[str]) -> list[list[float]]:
    vectors = self._model.encode(texts, normalize_embeddings=True)
    return vectors.tolist()

def embed_query(text: str) -> list[float]:
    vec = self._model.encode([text], normalize_embeddings=True)[0]
    return vec.tolist()
```

---

## 9. PDF PROCESSING & CHUNKING

### File: [rag-service/app/rag/pdf_processor.py](rag-service/app/rag/pdf_processor.py)

**Library**: LangChain + PyPDF

**Processing Pipeline**:
```python
def load_and_split_pdf(pdf_path: str, chunk_size: int = 500, chunk_overlap: int = 100):
    # 1. Load PDF
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()
    
    # 2. Split into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100,
        separators=["\n\n", "\n", ". ", " ", ""]  # Preserve structure
    )
    chunks = splitter.split_documents(docs)
    
    # 3. Extract text + metadata (page_number, etc.)
    return [(text, metadata), ...]
```

**Workflow in `chat_service.py`**:
```python
def index_pdf_for_screening(screening_id: str, pdf_path: str):
    # 1. Load & split PDF
    chunks = load_and_split_pdf(pdf_path, chunk_size=500, chunk_overlap=100)
    texts = [t for (t, _) in chunks]
    
    # 2. Generate embeddings
    embeddings = embedding_model.embed_texts(texts)
    
    # 3. Assign document IDs
    ids = [f"{screening_id}:{i}" for i in range(len(texts))]
    
    # 4. Store in ChromaDB
    count = upsert_report_chunks(
        screening_id=screening_id,
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids
    )
    
    return {"screening_id": screening_id, "chunks_indexed": count}
```

---

## 10. CHAT SERVICE - RAG PIPELINE

### File: [rag-service/app/services/chat_service.py](rag-service/app/services/chat_service.py)

### 10.1 `answer_question()` - Main RAG Logic

**Overview**: Takes question + system data, retrieves relevant report chunks, generates answer via Groq

**Step 1: Intent Detection**
```python
intent = detect_intent(question)
# Returns: 'explanation', 'interpretation', 'recommendation', 'app_guidance', 'general', 'other'
```

**Step 2: Semantic Retrieval**
```python
retrieved_context, chunks = retrieve_context(
    screening_id=screening_id,
    question=question,
    n_results=4
)
```

**Retrieval Logic**:
1. Embed question: `q_emb = embedding_model.embed_query(question)`
2. Query ChromaDB: `collection.query(query_embeddings=[q_emb], n_results=n_results, where={"screening_id": screening_id})`
3. Filter chunks:
   - Keep cosine distance ≤ 0.6 (closer is better)
   - Remove PDF headers/footers (page numbers, "Confidential")
   - Limit total context to 2500 characters
4. Return top chunks

**Step 3: Context Assembly**
```python
prompt = build_strict_prompt(
    system_data=system_data,           # Child age, risk level, behavioral indicators
    retrieved_context=retrieved_context,# Top chunks from report
    question=question_with_history,    # Question + last 5 messages
    intent=intent,                     # Question type
    has_report_context=has_report_context
)
```

**Step 4: LLM Generation**
```python
raw = groq_chat_completion(prompt=prompt)
answer = ensure_response(raw, intent)
```

**Step 5: Answer Formatting**
- For recommendations: Format as weekly activity plan
- For interpretations: Add risk disclaimers
- Strip report mentions if no report was indexed

**Return**:
```python
{
    "answer": str,
    "used_report_context": bool,
    "retrieved_chunks": list[str]
}
```

### 10.2 Retrieval Strategies

**`retrieve_context()` - Strict Search**
- Uses semantic similarity with distance threshold (≤ 0.6)
- Good for specific questions about report content

**`retrieve_context_relaxed()` - Generic Summaries**
- Used for generic questions like "summarize the report"
- No distance threshold, just top N chunks
- Prevents false "no context" responses

---

## 11. LLM INTEGRATION

### File: [rag-service/app/services/groq_client.py](rag-service/app/services/groq_client.py)

**LLM Provider**: Groq (Fast inference)
**Model**: `llama-3.3-70b-versatile` (or configured)

**Configuration**:
```python
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

completion = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": prompt}],
    temperature=0.2,          # Low temperature for consistency
    max_tokens=1800
)
```

**Environment Variables**:
- `GROQ_API_KEY` - API key (required)
- `GROQ_MODEL` - Model name (default: llama-3.3-70b-versatile)
- `GROQ_TEMPERATURE` - Response creativity (default: 0.2)
- `GROQ_MAX_TOKENS` - Max output length (default: 1800)

---

## 12. PROMPT ENGINEERING

### File: [rag-service/app/services/prompting.py](rag-service/app/services/prompting.py)

**Key Functions**:

**`build_question_with_history()`**
- Prepends last 5 messages for context
- Formats as conversation history

**`build_strict_prompt()`**
- Constructs system message with system_data
- Includes retrieved report chunks
- Adds intent-specific instructions
- Appends question + history

**`ensure_response()`**
- Validates response format
- Adds safety disclaimers for diagnosis questions
- Reformats based on intent

**Example Prompt Structure**:
```
You are an Autism Support Assistant for parents. Help with screening results, reports, 
next steps, and app guidance.

SYSTEM DATA:
- Child Age: 24 months
- Risk Level: MEDIUM
- Behavioral Indicators: Eye Contact: Low, Head Stimming: Present, ...

UPLOADED REPORT CONTEXT:
[Top 4 retrieved chunks from PDF, max 2500 chars]

MESSAGE HISTORY:
User: What does the report say about eye contact?
Assistant: [Previous response]
User: [New question]

Instructions:
- Answer based on screening data + report if available
- For "MEDIUM" risk: Explain indicators clearly, recommend professional evaluation
- If asked about diagnosis: Include disclaimer that only specialists can diagnose
- Format response with sections: Explanation, What it means, Recommended actions

Answer:
```

---

## 13. SUGGESTED QUESTIONS

### File: [backend/services/chatAssistantService.js](backend/services/chatAssistantService.js#L60)

**Predefined suggestions** covering:
- Behavior interpretation
- Recommendation guidance
- App usage help
- Report explanation

---

## 14. END-TO-END RAG FLOW

```
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (React)                           │
│                                                             │
│  ChatAssistant.jsx                                          │
│  ├─ Loads chat history (getHistory)                        │
│  ├─ Displays suggested questions (getSuggestions)          │
│  ├─ User uploads PDF report (uploadReport)                 │
│  └─ User sends message (sendMessage)                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP Request
                 ▼
┌─────────────────────────────────────────────────────────────┐
│            BACKEND (Node.js + Express)                      │
│                                                             │
│  chatRoutes.js                                              │
│      ▼ POST /chat/:screeningId/message                      │
│  chatController.js::sendMessage()                           │
│      ├─ Fetch screening data + behavioral features          │
│      ├─ Create/update ChatSession                           │
│      ├─ Detect intent (explanation/recommendation/etc.)     │
│      └─ Call RAG Service at localhost:8002                  │
│          ▼ POST /chat                                       │
│          └─ Report file stored in:                          │
│              backend/uploads/medical-reports/               │
│                                                             │
│      ├─ Fallback: reportRagService.js (simple ranking)      │
│      └─ Save messages to MongoDB ChatSession                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP POST /chat (JSON payload)
                 │ {
                 │   screening_id: "..."
                 │   system_data: {...}
                 │   question: "..."
                 │   history: [...]
                 │   n_results: 4
                 │ }
                 ▼
┌─────────────────────────────────────────────────────────────┐
│         RAG SERVICE (Python + FastAPI)                      │
│         localhost:8002                                      │
│                                                             │
│  main.py::@app.post("/rag/index")                           │
│      ├─ PDF Upload Flow:                                    │
│      │   ├─ Read PDF file                                   │
│      │   ├─ Call index_pdf_for_screening()                  │
│      │   └─ Return chunks count                             │
│      │                                                     │
│      └─ chat_service.py::index_pdf_for_screening()          │
│          ├─ load_and_split_pdf() [LangChain PyPDF]          │
│          │   └─ Chunk: 500 chars, 100 char overlap          │
│          ├─ embedding_model.embed_texts() [MiniLM]          │
│          │   └─ Generate 384-dim vectors                    │
│          └─ upsert_report_chunks() [ChromaDB]               │
│              └─ Store {id, text, embedding, metadata}       │
│                                                             │
│  main.py::@app.post("/chat")                                │
│      │                                                     │
│      └─ chat_service.py::answer_question()                 │
│          │                                                 │
│          ├─ detect_intent(question)                         │
│          │   └─ Return intent type                          │
│          │                                                 │
│          ├─ retrieve_context() or retrieve_context_relaxed()
│          │   ├─ embedding_model.embed_query(question)       │
│          │   ├─ query_report_chunks()                       │
│          │   │   └─ ChromaDB cosine similarity search       │
│          │   ├─ Filter by distance ≤ 0.6                    │
│          │   ├─ Remove headers/footers                      │
│          │   └─ Return top chunks (max 2500 chars)          │
│          │                                                 │
│          ├─ build_strict_prompt()                          │
│          │   ├─ Add system_data (age, risk, indicators)     │
│          │   ├─ Add retrieved context                       │
│          │   ├─ Add conversation history                    │
│          │   └─ Add intent-specific instructions            │
│          │                                                 │
│          ├─ groq_chat_completion(prompt)                    │
│          │   └─ Groq API: llama-3.3-70b-versatile           │
│          │       (temperature: 0.2, max_tokens: 1800)       │
│          │                                                 │
│          ├─ ensure_response() [format]                      │
│          │   ├─ Add safety disclaimers                      │
│          │   ├─ Format based on intent                      │
│          │   └─ Strip misleading report mentions            │
│          │                                                 │
│          └─ Return ChatResponse:                           │
│              {                                             │
│                answer: str,                                │
│                used_report_context: bool,                  │
│                retrieved_chunks: [...]                     │
│              }                                             │
│                                                             │
│  ChromaDB Storage:                                          │
│  └─ ./chroma_db/ [persistent]                              │
│      └─ medical_reports collection                         │
│          └─ Documents: {id, text, embedding, metadata}     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP Response (JSON)
                 │ {
                 │   "answer": "...",
                 │   "used_report_context": true,
                 │   "retrieved_chunks": [...]
                 │ }
                 ▼
┌─────────────────────────────────────────────────────────────┐
│            BACKEND (Node.js + Express)                      │
│                                                             │
│  chatController.js::sendMessage()                           │
│      ├─ Save assistant message to ChatSession               │
│      └─ Return response to client                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP Response
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (React)                           │
│                                                             │
│  ChatAssistant.jsx                                          │
│      ├─ Display assistant message                           │
│      ├─ Format response (Explanation, What it means, etc.)  │
│      └─ Update chat history                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 15. TECHNOLOGIES & STACK

### Frontend
- **Framework**: React + Vite
- **UI Library**: Tailwind CSS
- **Animation**: Framer Motion
- **Notifications**: react-hot-toast
- **HTTP Client**: Axios

### Backend (Node.js)
- **Framework**: Express.js
- **Database**: MongoDB
- **PDF Parsing**: pdf-parse
- **HTTP Client**: Axios
- **Multer**: File upload middleware
- **Groq SDK**: groq-sdk

### RAG Service (Python)
- **Framework**: FastAPI + Uvicorn
- **Vector DB**: ChromaDB (persistent)
- **Embeddings**: Sentence-Transformers (all-MiniLM-L6-v2)
- **PDF Processing**: LangChain + PyPDF
- **LLM**: Groq SDK
- **Tokenization**: Transformers, Tokenizers

---

## 16. KEY CONFIGURATION

### Environment Variables (Backend)
```env
RAG_SERVICE_URL=http://localhost:8002
RAG_CHAT_TIMEOUT_MS=180000      # 3 minutes
RAG_INDEX_TIMEOUT_MS=600000     # 10 minutes
GROQ_API_KEY=...
```

### Environment Variables (RAG Service)
```env
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_TEMPERATURE=0.2
GROQ_MAX_TOKENS=1800
RAG_CHROMA_PATH=./chroma_db
RAG_COLLECTION_NAME=medical_reports
RAG_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 17. FAILURE HANDLING & FALLBACKS

### Timeout Handling
- **RAG Service unavailable**: Return "Information not available (RAG service is warming up)"
- **GROQ API key missing**: Fallback response with system data only
- **Report not indexed**: Gracefully handle missing report context

### Retry Logic
- Network errors: Retry with exponential backoff
- Non-retryable HTTP errors: Fail immediately

### Report Context Fallback
- If strict semantic search fails, try relaxed retrieval
- If no report indexed, answer from system_data only
- Strip misleading report mentions if context unavailable

---

## 18. SECURITY CONSIDERATIONS

1. **Authentication**: All chat endpoints require `protect` middleware
2. **File Upload**: Validate PDF type + size (15MB max)
3. **Path Traversal**: Normalize uploaded file paths
4. **API Keys**: Store GROQ_API_KEY in `.env` file (not committed)
5. **User Isolation**: Filter by `req.user._id` in all queries

---

## 19. DATA FLOW SUMMARY

| Component | Purpose | Key Files |
|-----------|---------|-----------|
| **Frontend** | Chat UI, report upload | `ChatAssistant.jsx`, `api.js` |
| **Backend Routes** | HTTP endpoints | `chatRoutes.js` |
| **Backend Controller** | Business logic, RAG integration | `chatController.js` |
| **Chat Sessions** | Message history storage | `ChatSession.js` (MongoDB) |
| **RAG Service** | Embedding, retrieval, generation | Python FastAPI service |
| **Vector DB** | Document storage + search | ChromaDB (persistent) |
| **Embeddings** | Text-to-vector conversion | all-MiniLM-L6-v2 |
| **LLM** | Answer generation | Groq (llama-3.3-70b) |

---

## 20. USAGE EXAMPLE

**User Flow**:
1. Parent opens ChatAssistant page after screening
2. Uploads medical report PDF → Indexed in ChromaDB
3. Selects language (English/Hindi/Kannada)
4. Clicks suggested question or types custom question
5. Question + screening data sent to RAG service
6. RAG service retrieves relevant report chunks
7. Groq LLM generates contextual answer using report + system data
8. Answer displayed with formatting (Explanation, Recommended actions, etc.)
9. Chat history persisted in MongoDB

---

## Summary

The RAG chatbot is a sophisticated system that:
- **Retrieves** relevant medical report chunks using semantic search
- **Augments** user questions with behavioral screening data
- **Generates** personalized guidance using Groq LLM
- **Stores** conversation history in MongoDB
- **Supports** multiple languages and report uploads
- **Gracefully handles** service failures with fallbacks
