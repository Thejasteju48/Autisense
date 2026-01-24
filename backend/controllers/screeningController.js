const Screening = require('../models/Screening');
const Child = require('../models/Child');
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// @desc    Start a new screening session
// @route   POST /api/screenings/start
// @access  Private
exports.startScreening = async (req, res) => {
  try {
    const { childId } = req.body;

    // Verify child exists and belongs to user
    const child = await Child.findOne({ _id: childId, parent: req.user._id });
    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }

    // Create new screening
    const screening = await Screening.create({
      child: childId,
      user: req.user._id,
      parent: req.user._id,  // Keep for backward compatibility
      status: 'started'
    });

    // Questionnaire for screening
    const questionnaire = [
      { id: 1, question: 'Does the child make eye contact during conversations?' },
      { id: 2, question: 'Does the child respond to their name when called?' },
      { id: 3, question: 'Does the child show interest in other children?' },
      { id: 4, question: 'Does the child engage in pretend play?' },
      { id: 5, question: 'Does the child point to show interest in something?' }
    ];

    res.status(201).json({
      success: true,
      data: {
        screening: {
          _id: screening._id,
          child: screening.child,
          status: screening.status,
          createdAt: screening.createdAt
        },
        questionnaire
      },
      message: 'Screening started. Please complete all interactive activities.'
    });
  } catch (error) {
    console.error('Error starting screening:', error);
    res.status(500).json({ message: 'Server error starting screening' });
  }
};

// @desc    Submit questionnaire responses
// @route   POST /api/screenings/:id/questionnaire
// @access  Private
exports.submitQuestionnaire = async (req, res) => {
  try {
    const { id } = req.params;
    const { responses, videoData, jaundice, family_asd } = req.body;

    console.log('📝 Received questionnaire submission:', {
      screeningId: id,
      responsesType: Array.isArray(responses) ? 'array' : typeof responses,
      responsesLength: Array.isArray(responses) ? responses.length : 'N/A',
      firstResponse: Array.isArray(responses) && responses.length > 0 ? responses[0] : null,
      jaundice,
      family_asd
    });

    const screening = await Screening.findOne({ _id: id, user: req.user._id });
    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    // Ensure responses is an array
    const responsesArray = Array.isArray(responses) ? responses : [];
    
    // Calculate questionnaire score (percentage of "yes" answers)
    const yesCount = responsesArray.filter(r => r.answer === true).length;
    const score = responsesArray.length > 0 ? yesCount / responsesArray.length : 0;

    // Update screening with questionnaire
    screening.questionnaire = {
      completed: true,
      responses: responsesArray,
      score: score,
      jaundice: jaundice || 'no',
      family_asd: family_asd || 'no'
    };

    // Save live video features if provided
    if (videoData && Object.keys(videoData).length > 0) {
      // Map ML service features to database schema
      screening.liveVideoFeatures = {
        eyeContactRatio: videoData.eye_contact_ratio,
        blinkRatePerMinute: videoData.blink_rate_per_minute,
        headMovementRate: videoData.head_movement_rate,
        headRepetitiveMovement: videoData.head_repetitive_movement || {
          detected: false,
          oscillations: 0,
          horizontal: 0,
          vertical: 0
        },
        handRepetitiveMovement: videoData.hand_repetitive_movement || {
          leftHand: { detected: false, oscillations: 0, intensity: 0 },
          rightHand: { detected: false, oscillations: 0, intensity: 0 }
        },
        gestureFrequencyPerMinute: videoData.gesture_frequency_per_minute,
        facialExpressionVariability: videoData.facial_expression_variability,
        sessionDuration: videoData.session_duration_seconds,
        totalFrames: videoData.total_frames_processed,
        interpretation: videoData.interpretation || {
          concerns: [],
          riskScore: 0,
          summary: ''
        }
      };
      
      console.log('✓ Saved live video features:', {
        eyeContact: screening.liveVideoFeatures.eyeContactRatio,
        blinkRate: screening.liveVideoFeatures.blinkRatePerMinute,
        gestures: screening.liveVideoFeatures.gestureFrequencyPerMinute,
        expressions: screening.liveVideoFeatures.facialExpressionVariability
      });
    }

    screening.status = 'in-progress';
    await screening.save();

    res.json({
      success: true,
      data: {
        score: score,
        totalQuestions: responses.length,
        yesCount: yesCount,
        hasVideoData: !!videoData
      },
      message: 'Questionnaire submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting questionnaire:', error);
    res.status(500).json({ message: 'Error submitting questionnaire' });
  }
};

// @desc    Complete screening and generate final prediction
// @route   POST /api/screenings/:id/complete
// @access  Private
exports.completeScreening = async (req, res) => {
  try {
    const { id } = req.params;

    const screening = await Screening.findOne({ _id: id, user: req.user._id })
      .populate('child', 'name nickname dateOfBirth ageInMonths gender jaundice familyASD');
    
    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    console.log('Completing screening:', {
      id: screening._id,
      questionnaireCompleted: screening.questionnaire?.completed,
      responsesCount: screening.questionnaire?.responses?.length,
      childAge: screening.child?.ageInMonths,
      childGender: screening.child?.gender
    });

    // Check if questionnaire is completed
    if (!screening.questionnaire?.completed) {
      return res.status(400).json({ 
        message: 'Please complete the questionnaire before finalizing screening'
      });
    }

    // Validate responses exist
    if (!screening.questionnaire.responses || screening.questionnaire.responses.length === 0) {
      return res.status(400).json({
        message: 'No questionnaire responses found. Please fill out the questionnaire first.'
      });
    }

    // Prepare questionnaire data for ML prediction
    const questionnaireData = {
      responses: screening.questionnaire.responses.map(r => r.answer), // Boolean array
      age: screening.child.ageInMonths || 36, // Default to 36 months if not set
      sex: (screening.child.gender || 'male').toLowerCase(),
      jaundice: screening.questionnaire.jaundice || 'no',
      family_asd: screening.questionnaire.family_asd || 'no'
    };

    console.log('Sending questionnaire to ML service:', questionnaireData);

    // Get questionnaire prediction from ML service using trained models
    const questionnaireResponse = await axios.post(`${ML_SERVICE_URL}/predict/questionnaire`, questionnaireData);
    const questionnairePrediction = questionnaireResponse.data;
    
    console.log('✓ Questionnaire prediction:', {
      probability: questionnairePrediction.probability,
      risk: questionnairePrediction.risk_level
    });

    // Get video behavior prediction if video features exist
    let videoPrediction = null;
    if (screening.liveVideoFeatures && screening.liveVideoFeatures.eyeContactRatio !== undefined) {
      try {
        const videoFeatureData = {
          eye_contact_ratio: screening.liveVideoFeatures.eyeContactRatio || 0.5,
          blink_rate_per_minute: screening.liveVideoFeatures.blinkRatePerMinute || 15,
          head_movement_rate: screening.liveVideoFeatures.headMovementRate || 0.2,
          head_repetitive_movement: screening.liveVideoFeatures.headRepetitiveMovement || {},
          hand_repetitive_movement: screening.liveVideoFeatures.handRepetitiveMovement || {},
          gesture_frequency_per_minute: screening.liveVideoFeatures.gestureFrequencyPerMinute || 3,
          facial_expression_variability: screening.liveVideoFeatures.facialExpressionVariability || 0.4
        };
        
        console.log('Sending video features to ML service:', videoFeatureData);
        
        const videoResponse = await axios.post(`${ML_SERVICE_URL}/predict/video-behavior`, videoFeatureData);
        videoPrediction = videoResponse.data;
        
        console.log('✓ Video behavior prediction:', {
          score: videoPrediction.video_behavior_score,
          risk: videoPrediction.risk_level
        });
      } catch (videoError) {
        console.error('Warning: Video behavior prediction failed:', videoError.message);
        // Continue with questionnaire-only prediction
      }
    }

    // Combine predictions (weighted average if both available)
    let finalScore, riskLevel, interpretation;
    
    if (videoPrediction) {
      // Combine: 60% questionnaire (more reliable), 40% video
      finalScore = (questionnairePrediction.probability * 100 * 0.6) + (videoPrediction.video_behavior_score * 0.4);
      
      // Determine combined risk level
      if (finalScore < 30) {
        riskLevel = 'Low';
      } else if (finalScore < 60) {
        riskLevel = 'Moderate';
      } else {
        riskLevel = 'High';
      }
      
      interpretation = `Combined assessment: ${questionnairePrediction.interpretation} ${videoPrediction.interpretation}`;
      
      console.log('✓ Combined prediction:', { finalScore, riskLevel });
    } else {
      // Use questionnaire-only prediction
      finalScore = questionnairePrediction.probability * 100;
      riskLevel = questionnairePrediction.risk_level;
      interpretation = questionnairePrediction.interpretation;
      
      console.log('✓ Using questionnaire-only prediction');
    }

    // Update screening with ML prediction results
    screening.finalScore = finalScore;
    screening.riskLevel = riskLevel;
    // Update screening with ML prediction results
    screening.finalScore = finalScore;
    screening.riskLevel = riskLevel;
    screening.interpretation = {
      summary: interpretation,
      confidence: questionnairePrediction.confidence || 0.85,
      recommendations: questionnairePrediction.recommendations || [],
      liveVideoSummary: screening.liveVideoFeatures?.interpretation?.summary || 'N/A',
      videoBehaviorScore: videoPrediction ? videoPrediction.video_behavior_score : null,
      componentScores: videoPrediction ? videoPrediction.component_scores : null
    };

    // Generate LLM-enhanced analysis using Groq
    let llmAnalysis = null;
    try {
      const groqService = require('../services/groqService');
      const analysisResult = await groqService.generateScreeningAnalysis({
        finalScore: screening.finalScore,
        riskLevel: screening.riskLevel,
        questionnaire: screening.questionnaire,
        liveVideoFeatures: screening.liveVideoFeatures,
        child: screening.child
      });

      if (analysisResult.success) {
        llmAnalysis = analysisResult.analysis;
        screening.interpretation.llmAnalysis = llmAnalysis;
        console.log('✓ Generated LLM analysis using Groq API');
      }
    } catch (llmError) {
      console.error('Warning: Failed to generate LLM analysis:', llmError.message);
      // Continue without LLM analysis - not critical
    }

    screening.status = 'completed';
    screening.completedAt = new Date();

    await screening.save();

    res.json({
      success: true,
      data: {
        screeningId: screening._id,
        childName: screening.child.nickname || screening.child.name,
        finalScore: screening.finalScore,
        riskLevel: screening.riskLevel,
        interpretation: screening.interpretation,
        liveVideoFeatures: screening.liveVideoFeatures,
        completedAt: screening.completedAt,
        hasLLMAnalysis: !!llmAnalysis
      },
      message: 'Screening completed successfully'
    });
  } catch (error) {
    console.error('Error completing screening:', error);
    res.status(500).json({ 
      message: 'Error completing screening',
      error: error.message 
    });
  }
};

// @desc    Get screening by ID
// @route   GET /api/screenings/:id
// @access  Private
exports.getScreening = async (req, res) => {
  try {
    const screening = await Screening.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    }).populate('child', 'name nickname dateOfBirth profileImage');

    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    res.json({ success: true, data: screening });
  } catch (error) {
    console.error('Error fetching screening:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all screenings for a child (or latest if route includes /latest)
// @route   GET /api/screenings/child/:childId
// @route   GET /api/screenings/child/:childId/latest
// @access  Private
exports.getScreeningsByChild = async (req, res) => {
  try {
    const isLatest = req.path.includes('/latest');
    
    const query = Screening.find({ 
      child: req.params.childId,
      user: req.user._id,
      status: 'completed'
    })
    .sort({ createdAt: -1 })
    .select('finalScore riskLevel createdAt completedAt interpretation');

    if (isLatest) {
      const screening = await query.limit(1).exec();
      if (screening.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'No screening found' 
        });
      }
      return res.json({ success: true, data: { screening: screening[0] } });
    }

    const screenings = await query.exec();
    res.json({ success: true, data: screenings });
  } catch (error) {
    console.error('Error fetching screenings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Generate PDF report
// @route   GET /api/screenings/:id/report
// @access  Private
exports.generateReport = async (req, res) => {
  try {
    const screening = await Screening.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    })
    .populate('child', 'name nickname dateOfBirth')
    .populate('user', 'name email');

    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    if (screening.status !== 'completed') {
      return res.status(400).json({ message: 'Screening is not completed yet' });
    }

    // Populate child details
    await screening.populate('child');

    // Generate PDF report with LLM analysis
    const pdfService = require('../services/pdfService');
    const llmAnalysis = screening.interpretation?.llmAnalysis || null;
    
    const reportPath = await pdfService.generateScreeningReport(screening, llmAnalysis);

    screening.reportGenerated = true;
    screening.reportPath = reportPath;
    await screening.save();

    console.log('✓ PDF report generated:', reportPath);

    // Send PDF file
    res.download(reportPath, `screening-report-${screening.child.name}-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
};

// @desc    Delete screening
// @route   DELETE /api/screenings/:id
// @access  Private
exports.deleteScreening = async (req, res) => {
  try {
    const screening = await Screening.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    await screening.deleteOne();

    res.json({ success: true, message: 'Screening deleted successfully' });
  } catch (error) {
    console.error('Error deleting screening:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
