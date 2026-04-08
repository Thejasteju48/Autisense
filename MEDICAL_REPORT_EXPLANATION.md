# Medical Report Generation - Technical Explanation

## Overview
The application automatically generates a comprehensive, professional PDF medical report after a screening is completed. This report includes behavioral analysis, clinical interpretation, AI-generated explanations, and recommendations for further action, all compiled into a downloadable document suitable for sharing with healthcare professionals.

---

## How It Works

### Step-by-Step Flow

#### 1. **User Clicks "Download Medical Report" Button**
- Located on the Screening Results page
- Button shows loading spinner while report is being generated
- User receives confirmation toast message when complete

#### 2. **Frontend Initiates Report Download Request**
- **File:** [frontend/src/pages/ScreeningResults.jsx](frontend/src/pages/ScreeningResults.jsx#L99)
- **Function:** `handleDownloadReport()`
- **API Call:** `screeningAPI.downloadReport(screeningId)`
- **Request Type:** GET request with blob response type
- **Endpoint:** `GET /api/screenings/{screeningId}/report`

```javascript
const response = await screeningAPI.downloadReport(screeningId);
const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');
link.setAttribute('download', `autism-screening-report-${childName}-${dateStr}.pdf`);
link.click();
```

#### 3. **Backend Processes Report Request**
**File:** [backend/controllers/screeningController.js](backend/controllers/screeningController.js#L431)
**Function:** `generateReport()`

**Steps:**
1. **Authenticate user** - Verify JWT token and screening ownership
2. **Fetch screening data** - Load screening with populated child and user details
3. **Validate status** - Check if screening is "completed"
4. **Generate components (parallel processing):**
   - **AI Indicator Explanations** - Groq LLM analyzes each behavioral marker
   - **Nearby Centers** - Fetch autism support centers using placesService
   - **LLM Clinical Analysis** - Generate comprehensive clinical interpretation
5. **Build PDF** - Compile all data into professional document
6. **Save report path** - Store report location in MongoDB
7. **Send file** - Stream PDF to client for download

#### 4. **AI Analysis Generation (Groq LLM)**
**File:** [backend/services/groqService.js](backend/services/groqService.js)
**Function:** `generateScreeningAnalysis()`

Uses **Groq API** (fast LLM inference) to process:
- Child demographics (age, gender)
- Risk score and level
- Questionnaire responses (all 20 questions)
- Video behavioral observations (6 markers)
- Family history and medical information (jaundice)

**Generates structured clinical output:**
1. Executive Summary
2. Autism Indicators Identified
3. Risk Assessment Interpretation
4. Behavioral Domain Analysis
5. Strengths Observed
6. Areas of Concern
7. Parent Action Plan
8. Monitoring & Follow-Up Timeline
9. Support Resources
10. Medical Disclaimer

#### 5. **PDF Report Assembly**
**File:** [backend/services/pdfService.js](backend/services/pdfService.js#L1)
**Function:** `generateScreeningReport()`

Uses **PDFKit** library to construct report sections:

**Report Contents:**
- Header with title and generation date
- Patient & Guardian Details
- Behavioral Assessment (structured table)
- Detailed Behavioral Findings (6 markers with clinical notes)
- Assessment Summary with risk level
- Questionnaire Observations (top concerning questions)
- Clinical Impression
- Extended Clinical Explanation (from LLM)
- Recommendations (dynamic based on risk level)
- Nearby Autism Support Centers (location-based)
- Medical Disclaimer & Footer with page numbers

#### 6. **Styling & Formatting**
- **Page Size:** A4 (standard medical report format)
- **Margins:** 50px on all sides
- **Typography:** Professional medical fonts (Helvetica)
- **Color Scheme:**
  - Headings: Dark gray (#111827)
  - Text: Medium gray (#1F2937)
  - Borders: Light gray (#D1D5DB)
  - Headers: Light background (#F3F4F6)
- **Tables with multi-row wrapping** for complex data
- **Auto page breaks** when content exceeds page height
- **Page numbering:** "Page X of Y" with report ID and confidentiality notice

#### 7. **File Storage & Delivery**
- **Storage Location:** `backend/reports/` directory
- **File Naming:** `screening-report-{screeningId}.pdf`
- **Download Naming:** `autism-screening-report-{childName}-{date}.pdf`
- **Delivery Method:** HTTP file streaming with blob response

---

## Technologies Used

### **Frontend Technologies**
| Technology | Purpose |
|-----------|---------|
| **React.js** | UI component for download trigger |
| **Axios** | HTTP client for API communication |
| **Blob API** | Handle binary PDF data |
| **HTML5 Download** | Trigger file download mechanism |

**Frontend Files:**
- [frontend/src/pages/ScreeningResults.jsx](frontend/src/pages/ScreeningResults.jsx) - Report button & download handler
- [frontend/src/services/api.js](frontend/src/services/api.js) - API endpoint definition

### **Backend Technologies**
| Technology | Purpose |
|-----------|---------|
| **Node.js + Express.js** | HTTP server and routing |
| **PDFKit** | PDF document generation engine |
| **Groq SDK** | Fast LLM for clinical analysis |
| **MongoDB** | Store screening data and report metadata |
| **fs (File System)** | Save PDF files to disk |
| **Axios** | Call external APIs (Groq, Nominatim) |

**Backend Files:**
- [backend/routes/screeningRoutes.js](backend/routes/screeningRoutes.js) - Route: `GET /api/screenings/:id/report`
- [backend/controllers/screeningController.js](backend/controllers/screeningController.js) - Report generation logic
- [backend/services/pdfService.js](backend/services/pdfService.js) - PDF building
- [backend/services/groqService.js](backend/services/groqService.js) - LLM analysis

### **External APIs & Services**
| Service | Purpose | Cost |
|---------|---------|------|
| **Groq API** | Fast LLM inference for clinical analysis | Requires API key |
| **Nominatim (OpenStreetMap)** | Geocoding for autism center locations | **Free** |
| **MongoDB** | Database for screening storage | Requires setup |

### **Libraries & Dependencies**
```json
{
  "pdfkit": "Generate PDF documents",
  "groq-sdk": "Access Groq LLM API",
  "axios": "HTTP client",
  "express": "Web framework",
  "mongoose": "MongoDB ODM"
}
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                             │
│            ScreeningResults.jsx Component                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Screening Results Displayed                              │  │
│  │ [Download Medical Report] Button (with loading spinner)  │  │
│  │ onClick → handleDownloadReport()                        │  │
│  └────────────────────────┬─────────────────────────────────┘  │
└─────────────────────────────┼─────────────────────────────────────┘
                              │ 
                              │ HTTP GET /api/screenings/{id}/report
                              │ [Accept: application/pdf]
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                         │
│          screeningController.generateReport()                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Step 1: Authentication & Validation                     │  │
│  │   - Verify JWT token                                    │  │
│  │   - Fetch screening data from MongoDB                   │  │
│  │   - Check if status = "completed"                       │  │
│  │   - Populate child and user details                     │  │
│  └────────────────────────┬─────────────────────────────────┘  │
└─────────────────────────────┼─────────────────────────────────────┘
                              │
            ┌─────────────────┼──────────────────┐
            ↓                 ↓                  ↓
     ┌─────────────┐   ┌──────────────┐  ┌────────────────┐
     │ GROQ LLM    │   │ PLACES       │  │ GROQ LLM       │
     │ SERVICE     │   │ SERVICE      │  │ SERVICE        │
     ├─────────────┤   ├──────────────┤  ├────────────────┤
     │ Generate    │   │ Find nearby  │  │ Generate       │
     │ Indicator   │   │ autism       │  │ comprehensive  │
     │ Explanations│   │ centers      │  │ clinical       │
     │             │   │ (Nominatim   │  │ analysis       │
     │ For 6       │   │ + SerpAPI)   │  │ (LLM prompt)   │
     │ behavioral  │   │              │  │                │
     │ markers     │   │ Returns:     │  │ Returns:       │
     │             │   │ - Name       │  │ - Executive    │
     │ Returns:    │   │ - Address    │  │   Summary      │
     │ Eye Contact │   │ - Distance   │  │ - Indicators   │
     │ Hand/Head   │   │ - Maps URL   │  │ - Risk Assess  │
     │ Stimming    │   │              │  │ - Behavior     │
     │ etc.        │   │              │  │   Analysis     │
     └─────────────┘   └──────────────┘  │ - Action Plan  │
            │                 │          │ - Resources    │
            └─────────────────┴──────────→ etc.           │
                              │          └────────────────┘
                              │
                ┌─────────────┴────────────────┐
                ↓                              ↓
         [Indicator            [Centers List
          Explanations]         + Nearby Data]
         + [LLM Analysis]
                │
                ↓
     ┌──────────────────────────┐
     │  PDF SERVICE             │
     │  pdfService.             │
     │  generateScreeningReport()│
     ├──────────────────────────┤
     │ Build PDF using PDFKit:  │
     │ 1. Add Header            │
     │ 2. Patient Details       │
     │ 3. Guardian Info         │
     │ 4. Behavioral Table      │
     │ 5. Detailed Findings     │
     │ 6. Assessment Summary    │
     │ 7. Clinical Impression  │
     │ 8. LLM Analysis          │
     │ 9. Recommendations      │
     │ 10. Nearby Centers      │
     │ 11. Footer & Pages      │
     └────────────┬─────────────┘
                  │
                  ↓
     ┌──────────────────────────┐
     │ FILE SYSTEM              │
     │ /backend/reports/        │
     │ screening-report-{id}.pdf│
     └────────────┬─────────────┘
                  │
                  │ Update MongoDB
                  │ - Save report path
                  │ - Mark generated
                  │
                  ↓ HTTP 200 OK
             [PDF File] ← Stream to Client
                  │
                  ↓
        ┌──────────────────────┐
        │ FRONTEND             │
        │ Receive PDF (blob)   │
        │ Create Download Link │
        │ Trigger File Save    │
        │ "autism-screening-   │
        │  report-{name}-{date}│
        │  .pdf"              │
        └──────────────────────┘
```

---

## Report Structure & Content

### **1. Header Section**
```
═══════════════════════════════════════════════════════════════
                  AUTISM SCREENING REPORT
                Generated on [Date]
═══════════════════════════════════════════════════════════════
```

### **2. Patient Details**
| Field | Data Source |
|-------|-------------|
| Name | Child model (name/nickname) |
| Age | Child ageInMonths converted to years |
| Gender | Child gender |
| Screening Date | Created timestamp |

### **3. Guardian Details**
| Field | Data Source |
|-------|-------------|
| Parent Name | User model name |
| Location | City + State from screening data |

### **4. Behavioral Assessment Table**
Shows 4-indicator comparison:
- **Indicator** column: Eye Contact, Hand Movements, Social Interaction, Emotional Expression
- **Observation** column: From video analysis
- **Typical Development** column: Expected range
- **Autism-Related Pattern** column: Concerning indicators

### **5. Detailed Behavioral Findings Table**
6-row table (one per behavioral marker):
- **Indicator**: Name
- **Observed Status**: From liveVideoFeatures (e.g., "Low", "Present")
- **Clinical Note**: AI explanation from Groq
- **Priority**: "Needs Follow-up" or "Within Expected Range"

### **6. Assessment Summary**
Key metrics:
- Risk Level (High/Moderate/Low)
- Indicators Needing Follow-up (list of concern areas)
- Questionnaire Responses Reviewed (count)

### **7. Questionnaire Observations**
Top 6 questions answered "No" (concerning responses) with full question text

### **8. Clinical Impression**
Standard clinical statement about observable characteristics related to ASD

### **9. Extended Clinical Explanation**
1,200-character summary from LLM analysis (with markdown removed)

### **10. Recommendations Section**
**Dynamic recommendations based on risk level:**
- **High Risk:**
  - Arrange specialist evaluation ASAP
  - Initiate early intervention planning
  - Weekly progress tracking
- **Moderate Risk:**
  - Schedule developmental follow-up
  - Home-based communication routines
  - Progress review within timeframe
- **Low Risk:**
  - Continue monitoring during pediatric visits
  - Maintain home activities
  - Repeat screening if concerns observed

### **11. Nearby Autism Support Centers**
Table with up to 3 centers:
- Center Name
- Address
- Distance (km)
- Action (Navigate)

### **12. Disclaimer**
Medical/clinical disclaimer stating screening is not diagnosis

### **13. Footer**
On every page:
```
Page X of Y | Report ID: {screening_id} | AutiSense Confidential
```

---

## API Endpoint Details

### **Report Download Endpoint**

**URL:** `GET /api/screenings/:id/report`

**Authentication:** Required (Bearer JWT token)

**Query Parameters:** None

**Request Headers:**
```
Authorization: Bearer {jwt_token}
Accept: application/pdf
```

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** application/pdf
- **Body:** Binary PDF file (blob)
- **Header:** Content-Disposition with filename

**Error Responses:**
| Status | Message |
|--------|---------|
| 404 | Screening not found |
| 400 | Screening is not completed yet |
| 500 | Error generating report |
| 401 | Unauthorized (missing/invalid token) |

**Example Flow:**
```
GET /api/screenings/12345abcde/report
Authorization: Bearer eyJhbGc...

↓

200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="autism-screening-report-..."

[Binary PDF Data Stream]
```

---

## Key Features

### ✅ **Professional Medical Report**
- Hospital-grade formatting
- Structured sections following clinical standards
- Suitable for sharing with healthcare providers

### ✅ **AI-Powered Analysis**
- Groq LLM generates personalized clinical interpretation
- Explains each behavioral marker in medical context
- Provides risk assessment reasoning

### ✅ **Comprehensive Data Integration**
- Combines video analysis (6 behavioral markers)
- Questionnaire responses (20 questions)
- Family/medical history (jaundice, ASD history)
- Location-based support resources

### ✅ **Dynamic Content**
- Recommendations adjust based on risk level
- Clinical language matches assessment severity
- Includes only relevant clinical observations

### ✅ **Security & Privacy**
- Requires user authentication
- Verifies screening ownership
- PDF stored server-side with access control

### ✅ **Multi-Page Handling**
- Auto page breaks when content exceeds space
- Consistent headers/footers across pages
- Professional layout maintenance

### ✅ **Parallel Processing**
- Fetches AI analysis, LLM explanation, and centers simultaneously
- Reduces report generation time

---

## Data Flow

### **From Screening to Report**

```
1. SCREENING SESSION
   ├─ Live Video Analysis (6 behavioral features)
   │  ├─ Eye Contact
   │  ├─ Head Stimming
   │  ├─ Hand Stimming
   │  ├─ Hand Gesture
   │  ├─ Social Reciprocity
   │  └─ Emotion Variation
   │
   └─ Questionnaire (20 questions)
      ├─ Responses (Yes/No)
      ├─ Score calculation
      ├─ Family history
      └─ Medical history

2. COMPLETION & ML PROCESSING
   ├─ ML Service analyzes video
   ├─ Calculate final risk score
   ├─ Determine risk level (High/Moderate/Low)
   └─ Store in MongoDB

3. REPORT GENERATION
   ├─ Groq LLM:
   │  ├─ Analyze indicator patterns
   │  ├─ Generate explanations for each marker
   │  └─ Create comprehensive clinical analysis
   │
   ├─ Places Service:
   │  ├─ Geocode user location
   │  ├─ Search for nearby centers
   │  └─ Calculate distances
   │
   └─ PDF Service:
      ├─ Assemble all data
      ├─ Format as medical document
      ├─ Generate PDF
      └─ Save to disk

4. DELIVERY
   ├─ Stream PDF to client
   └─ Browser downloads file
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| **Report Generation Time** | 3-8 seconds (depends on LLM) |
| **PDF File Size** | 150-250 KB (typical) |
| **Max Pages** | Auto-scaling (usually 2-4 pages) |
| **Parallel Processing** | 3 concurrent operations (indicator, centers, analysis) |
| **LLM Response Time** | 2-5 seconds (Groq API) |
| **PDF Build Time** | < 1 second |

---

## Database Schema Integration

### **Screening Model - Report-Related Fields**
```javascript
{
  _id: ObjectId,
  child: ObjectId,
  user: ObjectId,
  
  // Report metadata
  reportGenerated: Boolean,
  reportPath: String, // "backend/reports/screening-report-{id}.pdf"
  
  // Screening data used in report
  status: String, // "completed", "in-progress", "started"
  riskLevel: String, // "High", "Moderate", "Low"
  finalScore: Number, // 0-100
  
  // Video analysis
  liveVideoFeatures: {
    eyeContact: String,
    headStimming: String,
    handStimming: String,
    handGesture: String,
    socialReciprocity: String,
    emotionVariation: String,
    sessionDuration: Number,
    totalFrames: Number
  },
  
  // Questionnaire
  questionnaire: {
    completed: Boolean,
    responses: [{ question, answer }],
    score: Number,
    jaundice: String,
    family_asd: String
  },
  
  // Location
  parentLocation: {
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  
  // AI Analysis
  interpretation: {
    llmAnalysis: String,
    summary: String
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| **Screening not completed** | Return 400 with message "Screening is not completed yet" |
| **Screening not found** | Return 404 with message "Screening not found" |
| **User unauthorized** | Return 401 / redirect to login |
| **Groq LLM fails** | Falls back to stored interpretation |
| **PDF generation fails** | Return 500 error, show user message |
| **File system error** | Return 500, log to console |

---

## Security Considerations

✅ **Authentication Required:** All report requests need valid JWT

✅ **Authorization Verified:** System checks screening belongs to user

✅ **Sensitive Data Protection:**
- PDF only available to screening owner
- File stored server-side (not in client cache)
- API keys stored in .env (not exposed)

✅ **GDPR Compliance:**
- User can download their own data
- No data shared without consent
- Disclaimer included in report

---

## Future Enhancements

1. **Export Formats:** Add Word (.docx), JPEG image versions
2. **Report Customization:** Allow parents to include/exclude sections
3. **Signature & Seal:** Add medical professional signature block
4. **Comparison Reports:** Show progress across multiple screenings
5. **Multilingual:** Generate reports in different languages
6. **Email Integration:** Send reports directly to email
7. **Historical Storage:** Archive old reports with version control
8. **Advanced Analytics:** Include visual charts/graphs
9. **Specialist Integration:** Send directly to healthcare providers
10. **Real-time Updates:** Live report preview while screening ongoing

---

## Summary

The medical report feature is a **comprehensive document generation system** that:

- ✅ **Retrieves** complete screening data from MongoDB
- ✅ **Analyzes** behavioral patterns using Groq LLM
- ✅ **Compiles** location-based recommendations
- ✅ **Generates** professional PDF using PDFKit
- ✅ **Delivers** downloadable file to user
- ✅ **Stores** report for future reference

**Technology Stack:**
- Frontend: React.js + Axios + Blob API
- Backend: Node.js + Express.js + PDFKit
- AI: Groq LLM for clinical analysis
- Database: MongoDB for data persistence
- External APIs: Nominatim (geocoding) + SerpAPI (center search)
