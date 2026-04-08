# RAG Chatbot (AI Assistant) - Technical Explanation

## Overview
The RAG (Retrieval-Augmented Generation) Chatbot is an intelligent virtual assistant that helps parents understand their child's autism screening results. It combines document retrieval from the medical report with advanced language models to provide personalized, contextual answers to parent questions. All conversations are stored and can be reviewed later.

---

## What is RAG?

**RAG (Retrieval-Augmented Generation)** is a technique that combines:
1. **Retrieval** - Find relevant information from documents
2. **Augmentation** - Enhance LLM prompts with retrieved context
3. **Generation** - Use LLM to generate intelligent responses

This approach ensures answers are:
- ✅ Grounded in actual screening data (not hallucinated)
- ✅ Relevant to the child's specific situation
- ✅ Accurate and contextual
- ✅ Based on latest screening insights

---

## How It Works

### Step-by-Step Flow

#### 1. **User Opens Chat Assistant Page**
- **File:** [frontend/src/pages/ChatAssistant.jsx](frontend/src/pages/ChatAssistant.jsx)
- Page loads screening results and initializes chat interface
- Supports 3 languages: English, Hindi, Kannada
- Shows previous chat history from database

#### 2. **Optionally Upload Medical Report**
- User can upload the PDF report generated from screening
- Triggers RAG indexing to make report searchable
- **API Call:** `POST /rag/index-upload` (RAG service)
- PDF is stored and processed

#### 3. **User Types a Question**
- Examples:
  - "What does it mean that my child has low eye contact?"
  - "What are the next steps?"
  - "How can I help my child at home?"
  - "Are there therapies that can help?"

#### 4. **Question is Sent to Backend**
**File:** [backend/controllers/chatController.js](backend/controllers/chatController.js)
**Function:** `sendMessage()`

- **API Call:** `POST /api/chat/{screeningId}/send`
- **Parameters:**
  - `screeningId` - ID of current screening
  - `message` - User question
  - `language` - Language preference (en, hi, kn)

#### 5. **Backend Processes Question**
**File:** [backend/routes/chatRoutes.js](backend/routes/chatRoutes.js)

The backend:
1. **Validates** screening ownership & request authenticity
2. **Extracts** screening data (risk level, behavioral features, etc.)
3. **Calls RAG Service** with question + context
4. **Stores** message in MongoDB ChatSession collection
5. **Returns** response to frontend

#### 6. **RAG Service Retrieves Context**
**Port:** 8002 (Python FastAPI service)
**File:** [rag-service/main.py](rag-service/main.py)
**Service File:** [rag-service/app/services/chat_service.py](rag-service/app/services/chat_service.py)

**RAG Pipeline:**

**Step 6a - Embed the Question:**
- Uses **Sentence Transformers** (all-MiniLM-L6-v2)
- Converts question text into 384-dimensional vector
- This vector represents semantic meaning

**Step 6b - Search Vector Database:**
- **Database:** ChromaDB (in-memory + persistent)
- **Location:** `rag-service/chroma_db/`
- Searches for documents most similar to question
- Uses **cosine similarity** to rank results
- Returns top 3 chunks (distance ≤ 0.6)

**Step 6c - Format Retrieved Context:**
- Takes relevant chunks from medical report
- Combines with screening data from MongoDB
- Creates context window for LLM

#### 7. **Generate Answer with Groq LLM**
**API:** Groq (fast LLM service)
**Model:** llama-3.3-70b-versatile

Prompt structure:
```
System: You are a compassionate autism support assistant...

Context from Report:
[Retrieved medical report chunks]

Screening Data:
- Risk Level: [from database]
- Child Age: [from database]
- Key Observations: [6 behavioral markers]

Conversation History:
[Previous messages for context]

Parent Question: [User's question]

Generate a helpful, accurate response...
```

Response includes:
- Direct answer to question
- Personalized context from report
- Actionable next steps
- Safety disclaimers

#### 8. **Format and Return Response**
- Response sent back to frontend
- Stored in MongoDB ChatSession
- Displayed to user with timestamps
- Support for markdown formatting

#### 9. **Display in Chat Interface**
- Message appears in chat bubble
- Shows who sent it (user/assistant)
- Includes timestamp
- Markdown formatting preserved (bullets, bold, etc.)
- Save message to history database

---

## Technologies Used

### **Frontend Stack**
| Technology | Purpose |
|-----------|---------|
| **React.js** | Chat UI component |
| **Axios** | HTTP client for API calls |
| **Markdown** | Format LLM responses |
| **Language Detection** | Support multiple languages |
| **Local Storage** | Cache language preference |

**Frontend File:** [frontend/src/pages/ChatAssistant.jsx](frontend/src/pages/ChatAssistant.jsx)

### **Backend Stack**
| Technology | Purpose |
|-----------|---------|
| **Node.js + Express** | HTTP API server |
| **MongoDB** | Store chat messages & sessions |
| **Axios** | Call RAG service |
| **JWT Auth** | Secure API access |

**Backend Files:**
- [backend/routes/chatRoutes.js](backend/routes/chatRoutes.js) - Route definitions
- [backend/controllers/chatController.js](backend/controllers/chatController.js) - Request handler
- [backend/models/ChatSession.js](backend/models/ChatSession.js) - Message storage schema

### **RAG Service Stack (Python)**
| Technology | Purpose |
|-----------|---------|
| **FastAPI** | REST API framework |
| **ChromaDB** | Vector database for document storage |
| **Sentence Transformers** | Text embedding (all-MiniLM-L6-v2) |
| **LangChain** | PDF parsing and text chunking |
| **PyPDF** | PDF document loading |
| **Groq SDK** | LLM API client |

**RAG Service Files:**
- [rag-service/main.py](rag-service/main.py) - FastAPI app & routes
- [rag-service/app/services/chat_service.py](rag-service/app/services/chat_service.py) - RAG logic
- [rag-service/app/rag/chromadb_client.py](rag-service/app/rag/chromadb_client.py) - Vector DB management

### **External APIs**
| Service | Purpose | Free |
|---------|---------|------|
| **Groq** | Fast LLM inference | Requires API key |
| **Sentence Transformers** | Text embeddings | **Free** (local) |
| **ChromaDB** | Vector DB | **Free & Open Source** |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
│                   ChatAssistant.jsx Page                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ┌─ Previous Messages Display                                  │ │
│  │ └─ Chat Input Box                                           │ │
│  │    ├─ Type Question                                         │ │
│  │    ├─ Optional: Upload Report PDF                          │ │
│  │    ├─ Language Selector (EN/HI/KN)                         │ │
│  │    └─ [Send] Button                                        │ │
│  │       │                                                     │ │
│  │       └─ POST /api/chat/{screeningId}/send                 │ │
│  │          {message, language, history}                      │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┼─────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
   ┌─────────┐   ┌────────────────┐  ┌──────────────┐
   │ MongoDB │   │ Node.js Backend│  │ RAG Service  │
   │ Stores: │   │ Express.js     │  │ (Python)     │
   │ • Chat  │   │                │  │ Port: 8002   │
   │   Session   │ Routes:        │  │              │
   │ • Message   │ /chat/*        │  │              │
   │   History   │                │  │              │
   └─────────────┘ Controllers:   │  │              │
                   chatController │  │              │
                   │              │  │              │
                   │ POST /chat   │  │              │
                   │               │  │              │
                   │               ↓  │              │
                   │        ┌──────────────────────┐ │
                   │        │ Prepare RAG Request: │ │
                   │        │ - screening_id       │ │
                   │        │ - question (embed)   │ │
                   │        │ - system_data        │ │
                   │        │ - history            │ │
                   │        │ - language           │ │
                   │        └────────┬─────────────┘ │
                   │                 │               │
                   └─────────────────┼───────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │  RAG SERVICE (FastAPI)          │
                    │  Port: 8002                     │
                    ├────────────────────────────────┤
    ┌───────────────┤                                │
    │               │ POST /chat (chat_service.py)  │
    │               │                                │
    │   ┌───────────┴─────────────────────────────┐ │
    │   │ RAG PIPELINE                           │ │
    │   ├─────────────────────────────────────────┤ │
    │   │                                         │ │
    │   │ 1. PARSE REQUEST                       │ │
    │   │    ├─ Extract screening_id              │ │
    │   │    ├─ Extract question                  │ │
    │   │    └─ Extract history                   │ │
    │   │                                         │ │
    │   └────────────┬────────────────────────────┘ │
    │               │                               │
    │   ┌───────────▼────────────────────────────┐ │
    │   │ 2. ENCODE QUESTION TO VECTOR           │ │
    │   │    └─ Sentence Transformers            │ │
    │   │       (all-MiniLM-L6-v2)               │ │
    │   │    └─ 384-dimensional vector           │ │
    │   │                                         │ │
    │   └────────────┬────────────────────────────┘ │
    │               │                               │
    │   ┌───────────▼────────────────────────────┐ │
    │   │ 3. SEARCH VECTOR DATABASE              │ │
    │   │    ├─ Query ChromaDB                   │ │
    │   │    ├─ Find top 3 similar chunks        │ │
    │   │    ├─ Apply distance filter (≤ 0.6)    │ │
    │   │    └─ Return medical report excerpts   │ │
    │   │                                         │ │
    │   └────────────┬────────────────────────────┘ │
    │               │                               │
    │       ┌───────┴────────┐                      │
    │       │                │                      │
    │       ↓                ↓                      │
    │  ┌─────────────┐  ┌──────────────┐           │
    │  │ ChromaDB    │  │ Retrieved    │           │
    │  │ Vector DB   │  │ Chunks from  │           │
    │  │             │  │ Medical      │           │
    │  │ Persistent: │  │ Report       │           │
    │  │ chroma_db/  │  │              │           │
    │  │ collection: │  │ Top 3        │           │
    │  │medical_     │  │ relevant     │           │
    │  │reports      │  │ sections     │           │
    │  │             │  │              │           │
    │  │ Indexed     │  │ + Screening  │           │
    │  │ when PDF    │  │ data from    │           │
    │  │ uploaded    │  │ MongoDB      │           │
    │  └─────────────┘  │              │           │
    │                   └──────┬───────┘           │
    │                          │                   │
    │     ┌────────────────────┴──────────────────┘
    │     │
    │   ┌─▼──────────────────────────────────────┐ │
    │   │ 4. PREPARE CONTEXT FOR LLM             │ │
    │   │    ├─ System prompt (helpful asst)     │ │
    │   │    ├─ Retrieved chunks                 │ │
    │   │    ├─ Screening data (risk level,      │ │
    │   │    │  behavioral markers, age, etc.)   │ │
    │   │    ├─ Conversation history             │ │
    │   │    └─ Parent question                  │ │
    │   │                                         │ │
    │   └────────────┬────────────────────────────┘ │
    │               │                               │
    │   ┌───────────▼────────────────────────────┐ │
    │   │ 5. CALL GROQ LLM                       │ │
    │   │    ├─ Model: llama-3.3-70b             │ │
    │   │    ├─ Temp: 0.2 (factual)              │ │
    │   │    ├─ Max tokens: 1024                 │ │
    │   │    └─ Returns natural language answer  │ │
    │   │                                         │ │
    │   └────────────┬────────────────────────────┘ │
    │               │                               │
    │   ┌───────────▼────────────────────────────┐ │
    │   │ 6. FORMAT RESPONSE                      │ │
    │   │    ├─ Clean markdown                    │ │
    │   │    ├─ Add disclaimers                   │ │
    │   │    ├─ Add action items                  │ │
    │   │    └─ Prepare JSON response             │
    │   │                                         │ │
    │   └────────────┬────────────────────────────┘ │
    │               │                               │
    └───────────────┼───────────────────────────────┘
                    │
                    │ HTTP 200 OK
                    │ {
                    │   "answer": "...",
                    │   "retrieved_chunks": [...],
                    │   "sources": [...],
                    │   "fallback_used": false
                    │ }
                    ↓
          ┌──────────────────────┐
          │ BACKEND (Express)   │
          │ Store message in     │
          │ MongoDB ChatSession  │
          │ Return to Frontend   │
          └────────┬─────────────┘
                   │
                   │ JSON response with answer
                   ↓
          ┌──────────────────────┐
          │ FRONTEND (React)     │
          │ Display response in  │
          │ chat bubble          │
          │ Update message list  │
          │ User sees answer     │
          └──────────────────────┘
```

---

## RAG Pipeline Details

### **1. Document Indexing (When PDF Uploaded)**

**Endpoint:** `POST /rag/index-upload`

**Process:**
```
PDF File
   ↓
[Load PDF with LangChain]
   ↓
[Split into Chunks]
   • Size: 500 characters
   • Overlap: 100 characters
   • Keeps context between chunks
   ↓
[Generate Embeddings]
   • Model: all-MiniLM-L6-v2
   • 384-dimensional vectors
   ↓
[Store in ChromaDB]
   • Collection: medical_reports
   • Indexed by screening_id
   ↓
[Ready for Search]
```

### **2. Question Embedding**

**Process:**
```
Question Text: "What does low eye contact mean?"
   ↓
[Sentence Transformer]
   • Model: all-MiniLM-L6-v2
   • Encodes semantic meaning
   ↓
384-dimensional Vector
   • Ready for similarity search
```

### **3. Vector Similarity Search**

**ChromaDB Query:**
```python
results = collection.query(
    query_embeddings=[question_vector],
    n_results=3,  # Top 3 chunks
    where={"screening_id": screening_id},
    distance_threshold=0.6  # Cosine similarity
)
```

**Why ChromaDB?**
- ✅ Fast cosine similarity search
- ✅ Persistent storage (survives restarts)
- ✅ Simple API, no database management
- ✅ Supports metadata filtering

### **4. LLM Prompt Construction**

**Groq Prompt Template:**
```
System: You are a compassionate, knowledgeable autism support assistant...

Medical Report Context:
{retrieved_chunks}

Screening Data:
- Risk Level: {risk_level}
- Child Age: {age_months} months
- Eye Contact: {eye_contact}
- Hand Stimming: {hand_stimming}
- Social Reciprocity: {social_reciprocity}
- Emotion Variation: {emotion_variation}

Conversation History:
{previous_messages}

Parent Question: {question}

Provide an accurate, compassionate answer...
```

### **5. Response Generation**

**Groq Configuration:**
- **Model:** llama-3.3-70b-versatile
- **Temperature:** 0.2 (factual, not creative)
- **Max Tokens:** 1024 (enough for detailed answer)
- **Timeout:** 30 seconds

**Response Includes:**
- Direct answer to parent question
- Evidence from medical report
- Practical recommendations
- Disclaimer about not replacing professional diagnosis

---

## Chat Message Storage

### **MongoDB ChatSession Schema**

**File:** [backend/models/ChatSession.js](backend/models/ChatSession.js)

```javascript
{
  _id: ObjectId,
  screening: ObjectId,      // Reference to Screening
  parent: ObjectId,         // Reference to User
  language: String,         // 'en', 'hi', 'kn'
  messages: [{
    id: String,            // Unique message ID
    role: String,          // 'user' or 'assistant'
    content: String,       // Message text
    timestamp: Date,       // When sent
    language: String,      // Message language
    sourceChunks: [String] // Retrieved document chunks
  }],
  reportUploaded: Boolean, // Did parent upload PDF?
  reportPath: String,      // Path to uploaded PDF
  createdAt: Date,
  updatedAt: Date
}
```

### **Conversation History**

- All messages stored persistently
- Parents can review past conversations
- Used as context for follow-up questions
- Allows AI to remember previous discussions

---

## Multilingual Support

### **Supported Languages**
| Code | Language |
|------|----------|
| `en` | English |
| `hi` | Hindi |
| `kn` | Kannada |

### **How It Works**
1. User selects language in UI
2. Question sent with `language` parameter
3. Groq LLM responds in selected language
4. Response stored with language tag
5. Previous messages shown in same language

---

## Error Handling & Fallbacks

### **If ChromaDB Search Fails**
→ Uses screening data only (structured summary)

### **If Groq API Times Out**
→ Returns generic helpful response based on risk level

### **If PDF Not Indexed**
→ Uses only structured screening data (still helpful)

### **If Vector DB Empty**
→ Still provides assessment summary from MongoDB

**All fallbacks maintain quality while gracefully degrading functionality.**

---

## Security Features

✅ **Authentication Required:** All chat endpoints require JWT token

✅ **Ownership Verification:** Users can only access their own screening chats

✅ **API Key Protection:** Groq API key stored in environment variables

✅ **No Data Leakage:** RAG service isolated from other services

✅ **CORS Protection:** Only allowed origins can access APIs

✅ **Request Validation:** Input sanitization on questions and file uploads

---

## Performance Optimization

| Optimization | Impact |
|-------------|--------|
| **Embedding Cache** | Reuse for same questions |
| **ChromaDB Persistence** | No re-indexing on restart |
| **Connection Pooling** | Faster API calls |
| **Request Timeout Limits** | Prevent hanging requests |
| **Top-K Results** | Only 3 chunks (faster search) |

---

## API Endpoints

### **Chat Endpoints**

#### **Send Message**
```
POST /api/chat/{screeningId}/send
Authorization: Bearer {jwt_token}

Request Body:
{
  "message": "What should I do next?",
  "language": "en"
}

Response:
{
  "success": true,
  "data": {
    "response": "Based on your screening...",
    "sources": ["chunk1", "chunk2"],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### **Get Chat History**
```
GET /api/chat/{screeningId}/history
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "data": {
    "messages": [
      { "role": "user", "content": "...", "timestamp": "..." },
      { "role": "assistant", "content": "...", "timestamp": "..." }
    ]
  }
}
```

#### **Upload Report for RAG**
```
POST /rag/index-upload?screening_id={screeningId}
Content-Type: multipart/form-data

File: report.pdf

Response:
{
  "success": true,
  "data": {
    "screening_id": "...",
    "indexed": true,
    "chunks_count": 12,
    "pdf_path": "..."
  }
}
```

#### **RAG Chat Query**
```
POST /chat (RAG Service Port 8002)

Request:
{
  "screening_id": "...",
  "question": "What indicators need follow-up?",
  "system_data": {...},
  "history": [...]
}

Response:
{
  "answer": "Based on the assessment...",
  "retrieved_chunks": 3,
  "using_fallback": false
}
```

---

## Key Features

### ✅ **Personalized Answers**
- Based on specific screening data
- Not generic robotic responses
- Considers child's age, observations, risk level

### ✅ **Evidence-Based**
- Answers grounded in medical report
- Shows source chunks
- Explains reasoning

### ✅ **Conversation Memory**
- Remembers previous questions
- Builds on prior discussions
- Stores entire chat history

### ✅ **Multilingual**
- English, Hindi, Kannada
- Consistent quality across languages
- Language-aware formatting

### ✅ **Professional Tone**
- Compassionate and supportive
- Medical accuracy
- Includes appropriate disclaimers
- Avoids over-promising

### ✅ **Fast & Reliable**
- ChromaDB provides sub-second search
- Groq provides 2-5 second responses
- Graceful fallbacks if components fail

---

## Typical Q&A Examples

**Parent Q:** "My child scored 72% on the risk scale. What does that mean?"

**AI Response:**
```
A score of 72% indicates a MODERATE-TO-HIGH risk for autism 
spectrum characteristics. This means:

1. Your child showed several behaviors that align with autism patterns
2. The screening found meaningful developmental differences
3. Professional evaluation is recommended

Key observations from your assessment:
- Reduced eye contact during interaction
- Limited hand gestures
- Decreased social reciprocity

Next Steps:
- Schedule an appointment with a pediatric developmental specialist
- Consider early intervention services
- Start recommended home activities...
```

**Parent Q:** "Are my child's hand movements something to worry about?"

**AI Response:**
```
The hand movements observed during screening (labeled as "frequent stimming")
are repetitive self-soothing behaviors. Context:

IMPORTANT: This alone doesn't indicate a disorder. Many children stim.

HOWEVER: Combined with other observations (reduced eye contact, 
limited social response), this pattern suggests...

What you can do:
- Provide safe stimming alternatives (fidget toys, music)
- Create predictable routines to reduce anxiety
- Engage in guided play activities that build social skills
...
```

---

## Integration with Screening

```
SCREENING WORKFLOW
├─ 1. Live Video Analysis
│  └─ 6 behavioral markers captured
├─ 2. Questionnaire
│  └─ 20 questions answered
├─ 3. ML Processing
│  └─ Risk score calculated
├─ 4. Report Generation
│  └─ PDF created with analysis
└─ 5. RAG CHATBOT ← YOU ARE HERE
   ├─ Parent can ask questions
   ├─ PDF indexed for search
   ├─ LLM provides personalized answers
   └─ History stored for future reference
```

---

## Summary

The RAG Chatbot is a **context-aware conversational AI** that:

- ✅ **Retrieves** relevant information from medical reports
- ✅ **Augments** LLM prompts with screening data
- ✅ **Generates** personalized responses using Groq
- ✅ **Stores** conversations in MongoDB
- ✅ **Supports** multiple languages
- ✅ **Provides** evidence-based recommendations

**Technology Stack:**
- Frontend: React.js + Axios
- Backend: Node.js + Express + MongoDB
- RAG Service: Python + FastAPI + ChromaDB
- Embeddings: Sentence Transformers (all-MiniLM-L6-v2)
- LLM: Groq (llama-3.3-70b)
- Vector DB: ChromaDB (persistent)

The chatbot allows parents to better understand their child's screening results through natural conversation, making the assessment process educational and supportive.
