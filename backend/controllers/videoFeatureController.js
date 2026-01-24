const axios = require('axios');
const Screening = require('../models/Screening');

/**
 * VIDEO FEATURE CONTROLLER
 * 
 * Handles real-time video behavior features from frontend
 * Processes and combines with questionnaire data
 * Returns autism risk assessment
 */

// ML Service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Store features temporarily (in production, use Redis or MongoDB)
const sessionStore = new Map();

/**
 * Analyze real-time video features
 * Called every 2 seconds from frontend
 */
exports.analyzeVideoFeatures = async (req, res) => {
  try {
    const { features, sessionId, childId } = req.body;

    // Initialize or get session
    if (!sessionStore.has(sessionId)) {
      sessionStore.set(sessionId, {
        features: [],
        childId: childId || null,
        userId: req.user._id,
        startTime: Date.now()
      });
    }

    const session = sessionStore.get(sessionId);
    session.features.push({
      ...features,
      timestamp: Date.now()
    });

    // Send to ML service for real-time analysis
    try {
      const mlResponse = await axios.post(
        `${ML_SERVICE_URL}/process-video-features`,
        {
          ...features,
          sessionId,
          childId
        },
        { timeout: 5000 }
      );

      return res.json({
        success: true,
        sessionId,
        realtime: mlResponse.data.realtime_analysis
      });
    } catch (mlError) {
      console.warn('ML service unavailable, using local analysis:', mlError.message);
      
      // Fallback to local analysis
      const localScore = calculateLocalScore(features);
      
      return res.json({
        success: true,
        sessionId,
        realtime: {
          video_score: localScore,
          risk_level: localScore < 30 ? 'LOW' : localScore < 60 ? 'MODERATE' : 'HIGH',
          confidence: 0.5
        }
      });
    }
  } catch (error) {
    console.error('Analyze features error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze features',
      error: error.message
    });
  }
};

/**
 * Finalize analysis - combine video + questionnaire
 * Called once at end of screening
 */
exports.finalizeVideoAnalysis = async (req, res) => {
  try {
    const { sessionId, questionnaireAnswers, childId } = req.body;

    // Get session data
    const session = sessionStore.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Aggregate features over time
    const aggregateFeatures = aggregateSessionFeatures(session.features);

    // Send to ML service for final analysis
    try {
      const mlResponse = await axios.post(
        `${ML_SERVICE_URL}/finalize-analysis`,
        {
          videoFeatures: aggregateFeatures,
          questionnaireAnswers: questionnaireAnswers || [],
          childId
        },
        { timeout: 10000 }
      );

      const analysis = mlResponse.data.analysis;

      // Save to database
      const screening = await Screening.create({
        child: childId || null,
        user: req.user._id,
        type: 'video-behavior-analysis',
        videoBehaviorScore: analysis.video_score,
        questionnaireScore: analysis.questionnaire_score,
        combinedScore: analysis.combined_score,
        riskClassification: analysis.risk_classification.level,
        featureAnalysis: analysis.feature_analysis,
        recommendations: analysis.recommendations,
        confidence: analysis.confidence,
        metadata: {
          sessionDuration: Date.now() - session.startTime,
          featureCount: session.features.length,
          analysisDate: new Date()
        }
      });

      // Clean up session
      sessionStore.delete(sessionId);

      return res.json({
        success: true,
        screening: {
          id: screening._id,
          combinedScore: analysis.combined_score,
          riskClassification: analysis.risk_classification,
          recommendations: analysis.recommendations,
          confidence: analysis.confidence
        }
      });
    } catch (mlError) {
      console.error('ML service error:', mlError.message);
      
      return res.status(503).json({
        success: false,
        message: 'ML service unavailable',
        error: mlError.message
      });
    }
  } catch (error) {
    console.error('Finalize analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to finalize analysis',
      error: error.message
    });
  }
};

/**
 * Helper: Aggregate features over session
 */
function aggregateSessionFeatures(features) {
  if (features.length === 0) {
    return {
      eyeContactDuration: 0,
      blinkRate: 0,
      headMovementRepetition: 0,
      handFlapping: 0,
      bodyRocking: 0,
      faceOrientation: 0,
      emotionStability: 0
    };
  }

  const aggregated = {};
  const featureKeys = Object.keys(features[0]).filter(k => k !== 'timestamp');

  for (const key of featureKeys) {
    const values = features.map(f => f[key] || 0);
    aggregated[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  return aggregated;
}

/**
 * Helper: Calculate local score (fallback)
 */
function calculateLocalScore(features) {
  const weights = {
    eyeContactDuration: 0.25,
    blinkRate: 0.10,
    headMovementRepetition: 0.15,
    handFlapping: 0.20,
    bodyRocking: 0.15,
    faceOrientation: 0.10,
    emotionStability: 0.05
  };

  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    score += (features[key] || 0) * weight;
  }

  return Math.round(score * 100);
}
