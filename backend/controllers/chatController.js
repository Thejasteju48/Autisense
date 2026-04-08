const Screening = require('../models/Screening');
const ChatSession = require('../models/ChatSession');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { getSuggestedQuestions } = require('../services/chatAssistantService');

const RAG_SERVICE_URL = (process.env.RAG_SERVICE_URL || 'http://localhost:8002').trim().replace(/\/$/, '');
const RAG_CHAT_TIMEOUT_MS = parseInt(process.env.RAG_CHAT_TIMEOUT_MS || '180000', 10); // 3 minutes
const RAG_INDEX_TIMEOUT_MS = parseInt(process.env.RAG_INDEX_TIMEOUT_MS || '600000', 10); // 10 minutes

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableAxiosError = (e) => {
  // Retry only transient transport errors (no HTTP response available)
  const code = e?.code;
  if (e?.response) return false;
  return [
    'ECONNRESET',
    'ECONNREFUSED',
    'EPIPE',
    'ETIMEDOUT',
    'EAI_AGAIN',
    'ENOTFOUND',
    'ERR_NETWORK',
    'ERR_SOCKET',
  ].includes(code);
};

const postJsonWithRetry = async (url, payload, { timeout, retries = 1 } = {}) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await axios.post(url, payload, { timeout });
    } catch (e) {
      lastError = e;
      const isTimeoutMsg = String(e?.message || '').toLowerCase().includes('timeout');
      const shouldRetry = isRetryableAxiosError(e) || isTimeoutMsg;
      if (!shouldRetry || attempt >= retries) break;
      await sleep(200);
    }
  }
  throw lastError;
};

const detectIntent = (question = '') => {
  const q = String(question || '').toLowerCase();
  if (/(how do i use|how to use|step by step|use this web app|use this app|navigate the app)/.test(q)) return 'app_guidance';
  if (/(what does|meaning|interpret|risk|result|score)/.test(q)) return 'interpretation';
  if (/(what should i do|what can i do|next steps|recommend|therapy|action)/.test(q)) return 'recommendation';
  if (/(explain|eye contact|stimming|social reciprocity|emotion)/.test(q)) return 'explanation';
  return 'other';
};

const detectComparisonQuery = (question = '') => {
  const q = String(question || '').toLowerCase();
  return /\b(compare|compared|comparison|improve|improved|progress|better|worse|change|changed|before|previous|last time|last screening|previous assessment|difference|different report|two reports|develop|development|how has|is.*better|was.*better)\b/.test(q);
};

const formatPreviousScreening = (screening) => {
  const features = screening?.liveVideoFeatures || {};
  
  // Determine risk level from video features or fallback to old field
  let riskLevel = 'Not assessed';
  if (features.eyeContact || features.handStimming || features.socialReciprocity) {
    // If we have video features, assess risk based on them
    if (features.eyeContact === 'Low Eye Contact' || 
        features.socialReciprocity === 'Low' ||
        features.handStimming === 'Present') {
      riskLevel = 'Moderate to High';
    } else {
      riskLevel = 'Low to Moderate';
    }
  } else if (screening?.riskLevel && screening.riskLevel !== '') {
    // Fallback to stored risk level
    riskLevel = screening.riskLevel;
  }
  
  return {
    date: screening?.createdAt || 'Unknown',
    riskLevel: riskLevel,
    ageMonths: screening?.child?.ageInMonths ?? 'Unknown',
    hasVideoData: !!(features.eyeContact || features.handStimming),
    indicators: {
      eyeContact: features.eyeContact || 'Not recorded',
      headStimming: features.headStimming || 'Not recorded',
      handStimming: features.handStimming || 'Not recorded',
      handGesture: features.handGesture || 'Not recorded',
      socialReciprocity: features.socialReciprocity || 'Not recorded',
      emotionVariation: features.emotionVariation || 'Not recorded',
    },
  };
};

const toSystemData = (screening) => {
  const indicators = [];
  const features = screening?.liveVideoFeatures || {};
  if (features.eyeContact) indicators.push(`Eye Contact: ${features.eyeContact}`);
  if (features.headStimming) indicators.push(`Head Stimming: ${features.headStimming}`);
  if (features.handStimming) indicators.push(`Hand Stimming: ${features.handStimming}`);
  if (features.handGesture) indicators.push(`Hand Gesture: ${features.handGesture}`);
  if (features.socialReciprocity) indicators.push(`Social Reciprocity: ${features.socialReciprocity}`);
  if (features.emotionVariation) indicators.push(`Emotion Variation: ${features.emotionVariation}`);

  const ageMonths = screening?.child?.ageInMonths ?? null;

  return {
    age_months: ageMonths,
    risk_level: screening?.riskLevel || 'N/A',
    indicators,
  };
};

// @desc    Send chat message
// @route   POST /api/chat/:screeningId/message
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { screeningId } = req.params;
    const { question, language = 'en' } = req.body;

    if (!question || !String(question).trim()) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    const screening = await Screening.findOne({ _id: screeningId, user: req.user._id })
      .populate('child', 'name nickname ageInMonths gender')
      .populate('user', 'name city state country')
      .lean();

    if (!screening) {
      return res.status(404).json({ success: false, message: 'Screening not found' });
    }

    let session = await ChatSession.findOne({ user: req.user._id, screening: screeningId });
    if (!session) {
      session = await ChatSession.create({
        user: req.user._id,
        screening: screeningId,
        messages: [],
      });
    }

    const userMessage = {
      role: 'user',
      text: String(question).trim(),
      language,
      intent: 'other',
      createdAt: new Date(),
    };

    session.messages.push(userMessage);

    const intent = detectIntent(question);
    session.messages[session.messages.length - 1].intent = intent;

    const systemData = toSystemData(screening);
    const history = (session.messages || []).slice(-5).map((m) => ({
      role: m.role,
      text: m.text,
    }));

    // Check if this is a comparison/progress question
    const isComparisonQuery = detectComparisonQuery(question);
    let previousScreening = null;
    let comparisonData = null;

    if (isComparisonQuery) {
      try {
        // Prefer the most recent previous screening that has an uploaded report.
        previousScreening = await Screening.findOne(
          {
            _id: { $ne: screeningId },
            child: screening.child._id,
            user: req.user._id,
            uploadedReportPath: { $exists: true, $ne: '' },
          }
        )
          .sort({ createdAt: -1 })
          .populate('child', 'ageInMonths')
          .lean();

        // Fallback: any previous screening for this child.
        if (!previousScreening) {
          previousScreening = await Screening.findOne(
          {
            _id: { $ne: screeningId },
            child: screening.child._id,
            user: req.user._id,
          }
          )
            .sort({ createdAt: -1 })
            .populate('child', 'ageInMonths')
            .lean();
        }

        if (previousScreening) {
          const previous = formatPreviousScreening(previousScreening);
          const current = {
            date: screening?.createdAt || 'Now',
            riskLevel: screening?.riskLevel || 'N/A',
            ageMonths: screening?.child?.ageInMonths ?? 'N/A',
            indicators: {
              eyeContact: screening?.liveVideoFeatures?.eyeContact || 'N/A',
              headStimming: screening?.liveVideoFeatures?.headStimming || 'N/A',
              handStimming: screening?.liveVideoFeatures?.handStimming || 'N/A',
              handGesture: screening?.liveVideoFeatures?.handGesture || 'N/A',
              socialReciprocity: screening?.liveVideoFeatures?.socialReciprocity || 'N/A',
              emotionVariation: screening?.liveVideoFeatures?.emotionVariation || 'N/A',
            },
          };

          comparisonData = {
            hasPreviousScreening: true,
            previous,
            current,
          };
        }
      } catch (e) {
        console.warn('Failed to fetch previous screening for comparison:', e.message);
        comparisonData = { hasPreviousScreening: false };
      }
    }

    if (!comparisonData) {
      comparisonData = { hasPreviousScreening: false };
    }

    let answer = 'Information not available';
    let usedReportContext = false;

    // If comparison query with previous screening, use dedicated comparison endpoint
    if (isComparisonQuery && comparisonData?.hasPreviousScreening && previousScreening) {
      try {
        const previous = comparisonData.previous;
        const current = comparisonData.current;

        const ensureIndexed = async (targetScreeningId, pdfPath) => {
          if (!pdfPath || !String(pdfPath).trim()) return;
          if (!fs.existsSync(pdfPath)) return;
          try {
            await postJsonWithRetry(`${RAG_SERVICE_URL}/rag/index`, {
              screening_id: String(targetScreeningId),
              pdf_path: pdfPath,
            }, { timeout: RAG_INDEX_TIMEOUT_MS, retries: 1 });
          } catch (idxErr) {
            console.warn('On-demand indexing failed (will still attempt comparison):', {
              screeningId: String(targetScreeningId),
              message: idxErr?.message,
              status: idxErr?.response?.status,
            });
          }
        };

        // Attempt best-effort re-index for both reports before comparing.
        await ensureIndexed(previousScreening._id, previousScreening?.uploadedReportPath);
        await ensureIndexed(screeningId, screening?.uploadedReportPath);

        // First preference: compare uploaded/indexed PDF reports for both screenings.
        try {
          const indexedRes = await postJsonWithRetry(`${RAG_SERVICE_URL}/compare-indexed-reports`, {
            previous_screening_id: String(previousScreening._id),
            current_screening_id: String(screeningId),
          }, { timeout: RAG_CHAT_TIMEOUT_MS, retries: 1 });

          const { status, differences, explanation, recommendation } = indexedRes?.data || {};
          answer = [
            `Status: ${status || 'Unable to determine'}`,
            `Differences: ${differences || 'No differences found'}`,
            `Explanation: ${explanation || 'Unable to provide analysis'}`,
            `Recommendation: ${recommendation || 'No recommendations available'}`,
          ].join('\n\n');
          usedReportContext = true;
        } catch (indexedErr) {
          const indexedMissing = indexedErr?.response?.status === 404;
          if (indexedMissing) {
            try {
              if (previousScreening?.uploadedReportPath && screening?.uploadedReportPath) {
                const directRes = await postJsonWithRetry(`${RAG_SERVICE_URL}/compare-report-paths`, {
                  previous_pdf_path: previousScreening.uploadedReportPath,
                  current_pdf_path: screening.uploadedReportPath,
                }, { timeout: RAG_CHAT_TIMEOUT_MS, retries: 1 });

                const { status, differences, explanation, recommendation } = directRes?.data || {};
                answer = [
                  `Status: ${status || 'Unable to determine'}`,
                  `Differences: ${differences || 'No differences found'}`,
                  `Explanation: ${explanation || 'Unable to provide analysis'}`,
                  `Recommendation: ${recommendation || 'No recommendations available'}`,
                ].join('\n\n');
                usedReportContext = true;
              }
            } catch (directErr) {
              console.warn('Direct PDF-path comparison failed, will fallback to DB comparison:', {
                message: directErr?.message,
                status: directErr?.response?.status,
              });
            }
          } else {
            console.warn('Indexed report comparison failed, will fallback to DB comparison:', {
              message: indexedErr?.message,
              status: indexedErr?.response?.status,
            });
          }
        }

        if (usedReportContext) {
          // Already answered via indexed report comparison.
        } else {
        
        // Check if previous screening has video data for fair comparison
        const hasVideoData = previous.indicators.eyeContact !== 'Not recorded' &&
                            previous.indicators.eyeContact !== '';
        
        if (!hasVideoData) {
          // If previous screening lacks video data, provide general guidance
          answer = [
            'Detailed comparison is limited because the previous screening has incomplete video-behavior fields.',
            'Current assessment:',
            `- Risk Level: ${current.riskLevel}`,
            `- Eye Contact: ${current.indicators.eyeContact}`,
            `- Hand Stimming: ${current.indicators.handStimming}`,
            `- Hand Gesture: ${current.indicators.handGesture}`,
            `- Social Reciprocity: ${current.indicators.socialReciprocity}`,
            `- Head Stimming: ${current.indicators.headStimming}`,
            'For accurate progress tracking, keep uploading full reports and complete video analysis in each screening.',
          ].join('\n');
          
          usedReportContext = true;
        } else {
          // Both have video data - run LLM-based detailed comparison
          const previousReportJson = JSON.stringify({
            screeningDate: previous.date,
            ageMonths: previous.ageMonths,
            riskLevel: previous.riskLevel,
            indicators: previous.indicators,
          }, null, 2);

          const currentReportJson = JSON.stringify({
            screeningDate: current.date,
            ageMonths: current.ageMonths,
            riskLevel: current.riskLevel,
            indicators: current.indicators,
          }, null, 2);

          const comparisonRes = await postJsonWithRetry(`${RAG_SERVICE_URL}/compare-reports`, {
            previous_report: previousReportJson,
            current_report: currentReportJson,
          }, { timeout: RAG_CHAT_TIMEOUT_MS, retries: 1 });

          const { status, differences, explanation, recommendation } = comparisonRes?.data || {};

          answer = [
            `Status: ${status || 'Unable to determine'}`,
            `Differences: ${differences || 'No differences found'}`,
            `Explanation: ${explanation || 'Unable to provide analysis'}`,
            `Recommendation: ${recommendation || 'No recommendations available'}`,
          ].join('\n\n');

          usedReportContext = true;
        }
        }
      } catch (e) {
        console.warn('Comparison endpoint failed, falling back to chat:', {
          message: e?.message,
          status: e?.response?.status,
        });
        // Fall through to regular chat if comparison fails
      }
    }

    // If regular chat or comparison fell back
    if (!usedReportContext) {
      try {
        const ragRes = await postJsonWithRetry(`${RAG_SERVICE_URL}/chat`, {
          screening_id: String(screeningId),
          system_data: systemData,
          comparison_data: comparisonData,
          question: String(question).trim(),
          history,
          n_results: 4,
        }, { timeout: RAG_CHAT_TIMEOUT_MS, retries: 1 });

        answer = ragRes?.data?.answer || answer;
        usedReportContext = !!ragRes?.data?.used_report_context;
      } catch (e) {
        const status = e?.response?.status;
        const detail = e?.response?.data;
        console.error('RAG service failed, returning fallback:', {
          message: e?.message,
          name: e?.name,
          code: e?.code,
          isAxiosError: !!e?.isAxiosError,
          status,
          data: detail,
          url: `${RAG_SERVICE_URL}/chat`,
        });

        // Common first-run behavior: the Python service downloads/loads embedding models.
        if (String(e?.message || '').toLowerCase().includes('timeout')) {
          answer = 'Information not available (RAG service is warming up — please try again in 1–2 minutes)';
        }
      }
    }

    session.messages.push({
      role: 'assistant',
      text: answer,
      language,
      intent,
      createdAt: new Date(),
    });

    await session.save();

    return res.json({
      success: true,
      data: {
        intent,
        answer,
        englishAnswer: answer,
        reportContextUsed: usedReportContext,
        reportContextReason: usedReportContext ? 'Retrieved top chunks from indexed report' : 'No relevant report chunks (answered from system data only)',
      },
    });
  } catch (error) {
    console.error('Chat sendMessage error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate chat response', error: error.message });
  }
};

// @desc    Upload medical report PDF for chatbot RAG
// @route   POST /api/chat/:screeningId/upload-report
// @access  Private
exports.uploadMedicalReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'PDF file is required' });
    }

    const screening = await Screening.findOne({
      _id: req.params.screeningId,
      user: req.user._id,
    });

    if (!screening) {
      return res.status(404).json({ success: false, message: 'Screening not found' });
    }

    // Normalize to an absolute path so the Python RAG service can read it reliably on Windows.
    const absolutePath = path.resolve(req.file.path);
    screening.uploadedReportPath = absolutePath;
    await screening.save({ validateBeforeSave: false });

    const indexing = {
      success: false,
      data: null,
      error: null,
      status: null,
    };

    // Best-effort: index into Chroma via the Python RAG service.
    try {
      if (!fs.existsSync(screening.uploadedReportPath)) {
        indexing.error = `Uploaded file not found on disk: ${screening.uploadedReportPath}`;
      } else {
        const idxRes = await axios.post(
          `${RAG_SERVICE_URL}/rag/index`,
          {
            screening_id: String(screening._id),
            pdf_path: screening.uploadedReportPath,
          },
          { timeout: RAG_INDEX_TIMEOUT_MS }
        );

        indexing.success = !!idxRes?.data?.success;
        indexing.data = idxRes?.data?.data || null;
      }
    } catch (e) {
      indexing.status = e?.response?.status || null;
      indexing.error = e?.response?.data?.detail || e?.message || 'Indexing failed';
      console.error('Failed to index uploaded report in RAG service:', {
        message: e?.message,
        status: indexing.status,
        detail: e?.response?.data,
        pdf_path: screening.uploadedReportPath,
      });
    }

    return res.json({
      success: true,
      data: {
        uploadedReportPath: screening.uploadedReportPath,
        indexing,
      },
      message: 'Medical report uploaded for chatbot context',
    });
  } catch (error) {
    console.error('Chat uploadMedicalReport error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload report', error: error.message });
  }
};

// @desc    Get chat history
// @route   GET /api/chat/:screeningId/history
// @access  Private
exports.getHistory = async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      user: req.user._id,
      screening: req.params.screeningId,
    }).lean();

    return res.json({
      success: true,
      data: {
        messages: session?.messages || [],
      },
    });
  } catch (error) {
    console.error('Chat getHistory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch chat history', error: error.message });
  }
};

// @desc    Suggested questions
// @route   GET /api/chat/suggestions
// @access  Private
exports.getSuggestions = async (req, res) => {
  return res.json({
    success: true,
    data: {
      suggestions: getSuggestedQuestions(),
    },
  });
};
