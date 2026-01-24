# Groq API Integration Setup Guide

## Overview
This guide will help you set up the Groq API integration for LLM-enhanced screening reports with PDF generation.

## Prerequisites
- Groq SDK installed (✓ already installed)
- PDFKit installed (✓ already installed)
- Active Groq API account

## Step 1: Get Your Groq API Key

1. Visit [Groq Cloud Console](https://console.groq.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create API Key**
5. Copy your API key (it will look like: `gsk_xxxxxxxxxxxxxxxxxxxx`)

## Step 2: Configure Environment Variables

1. Open or create `backend/.env` file (copy from `.env.example` if needed):
   ```bash
   cd D:\AutismProject\backend
   copy .env.example .env
   ```

2. Add your Groq API key to `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/autism_screening
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d
   ML_SERVICE_URL=http://localhost:8000
   GROQ_API_KEY=gsk_your_actual_groq_api_key_here
   NODE_ENV=development
   ```

3. Save the file.

## Step 3: Restart Backend Server

Stop the current backend server (Ctrl+C) and restart it:
```bash
cd D:\AutismProject\backend
node server.js
```

## What's Been Implemented

### 1. Groq Service (`backend/services/groqService.js`)
- **generateScreeningAnalysis()**: Sends screening data to Groq LLM for comprehensive analysis
- **generateQuickSummary()**: Creates a brief parent-friendly summary
- Uses `llama-3.3-70b-versatile` model for high-quality clinical analysis
- Structured prompts for consistent, professional output

### 2. PDF Service (`backend/services/pdfService.js`)
- **generateScreeningReport()**: Creates professional PDF reports with:
  - Child information
  - Risk assessment visualization
  - Questionnaire summary
  - Video behavioral observations
  - LLM-generated clinical analysis
  - Recommendations
  - Important disclaimers

### 3. Updated Controller (`backend/controllers/screeningController.js`)
- **completeScreening()**: Now includes:
  1. ML prediction (existing)
  2. Groq LLM analysis (new)
  3. Saves LLM analysis to database
- **generateReport()**: Updated to use new PDF service with LLM content

### 4. Updated Model (`backend/models/Screening.js`)
- Added `interpretation.llmAnalysis` field to store LLM-generated content

### 5. Frontend Enhancement (`frontend/src/pages/ScreeningResults.jsx`)
- Displays LLM analysis in a highlighted section
- "Download PDF Report" button already functional

## How It Works - Complete Flow

```
User completes screening
    ↓
Submit questionnaire → ML Service prediction
    ↓
Backend receives ML results
    ↓
Groq LLM analyzes results → Generates comprehensive report
    ↓
Save to database (interpretation.llmAnalysis)
    ↓
Frontend displays results + LLM analysis
    ↓
User clicks "Download PDF Report"
    ↓
PDF generated with all data + LLM insights
    ↓
User downloads professional report
```

## Testing the Integration

### Test 1: Complete a Screening
1. Start all services (frontend, backend, ML service)
2. Create a new screening
3. Complete video capture
4. Submit questionnaire
5. Check backend logs for: `✓ Generated LLM analysis using Groq API`

### Test 2: View LLM Analysis
1. Navigate to screening results page
2. Look for "AI-Enhanced Clinical Analysis" section
3. Should display detailed, structured analysis

### Test 3: Download PDF Report
1. Click "Download PDF Report" button
2. PDF should download with:
   - Professional layout
   - Child information
   - Risk score visualization
   - LLM-generated analysis
   - Recommendations

## Error Handling

The system is designed to be resilient:
- **If Groq API fails**: Screening still completes with ML predictions only
- **If LLM analysis unavailable**: PDF still generates with ML data
- All errors are logged to console for debugging

## API Usage & Costs

### Groq Pricing (as of 2024)
- **Free Tier**: 14,400 requests/day (extremely generous)
- **Model**: llama-3.3-70b-versatile
- **Average tokens per analysis**: ~1,500-2,000 tokens
- **Cost**: Free for most use cases

### Rate Limits
- Default: 30 requests per minute
- Should be sufficient for screening application

## Customization Options

### Modify LLM Analysis Prompt
Edit `backend/services/groqService.js`:
```javascript
const prompt = `Your custom prompt here...`;
```

### Change LLM Model
Available models:
- `llama-3.3-70b-versatile` (best quality)
- `llama-3.1-8b-instant` (faster, cheaper)
- `mixtral-8x7b-32768` (alternative high-quality model)

### Adjust Temperature
```javascript
temperature: 0.3, // 0.0 = deterministic, 1.0 = creative
```

### PDF Layout Customization
Edit `backend/services/pdfService.js` to modify:
- Colors
- Fonts
- Section layout
- Report structure

## Troubleshooting

### Issue: "Failed to generate LLM analysis"
**Solution**: Check:
1. GROQ_API_KEY is set correctly in `.env`
2. API key is valid (test at console.groq.com)
3. Internet connection is active
4. No rate limits exceeded

### Issue: PDF download fails
**Solution**: Check:
1. `backend/reports/` directory exists (created automatically)
2. Write permissions on server
3. Screening is marked as "completed"

### Issue: LLM analysis not showing on frontend
**Solution**: Check:
1. Screening was completed AFTER Groq integration
2. Backend logs show `✓ Generated LLM analysis using Groq API`
3. `screening.interpretation.llmAnalysis` is populated in database

## Database Schema Update

The Screening model now includes:
```javascript
interpretation: {
  summary: String,
  confidence: Number,
  liveVideoSummary: String,
  recommendations: [String],
  llmAnalysis: String  // NEW: LLM-generated analysis
}
```

Existing screenings will continue to work; new field is optional.

## Security Considerations

1. **Never commit `.env` file** - Keep API keys private
2. **Use environment variables** - Already configured
3. **Rate limiting** - Consider adding rate limiting to prevent abuse
4. **API key rotation** - Periodically rotate Groq API keys

## Next Steps

1. ✅ Install dependencies (completed)
2. ✅ Create Groq service (completed)
3. ✅ Create PDF service (completed)
4. ✅ Update controller (completed)
5. ✅ Update model (completed)
6. ✅ Update frontend (completed)
7. ⏳ **Get Groq API key** (your action)
8. ⏳ **Add to .env** (your action)
9. ⏳ **Restart server** (your action)
10. ⏳ **Test complete flow** (your action)

## Support Resources

- **Groq Documentation**: https://console.groq.com/docs
- **Groq API Reference**: https://console.groq.com/docs/api-reference
- **PDFKit Documentation**: https://pdfkit.org/docs/getting_started.html

---

**Status**: ✅ Implementation Complete - Ready for API Key Configuration

**Last Updated**: ${new Date().toISOString().split('T')[0]}
