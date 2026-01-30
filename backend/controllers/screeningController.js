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
    const { responses, videoData, jaundice, family_asd, parentLocation, videoSource } = req.body;

    console.log('📝 Received questionnaire submission:', {
      screeningId: id,
      responsesType: Array.isArray(responses) ? 'array' : typeof responses,
      responsesLength: Array.isArray(responses) ? responses.length : 'N/A',
      firstResponse: Array.isArray(responses) && responses.length > 0 ? responses[0] : null,
      jaundice,
      family_asd,
      hasLocation: !!parentLocation,
      videoSource: videoSource || 'pre-recorded'
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
    
    // Set video source
    screening.videoSource = videoSource || 'pre-recorded';

    // Save parent location if provided
    if (parentLocation) {
      screening.parentLocation = {
        city: parentLocation.city || '',
        state: parentLocation.state || '',
        country: parentLocation.country || '',
        postalCode: parentLocation.postalCode || ''
      };
    }

    // Save live video features if provided
    if (videoData && Object.keys(videoData).length > 0) {
      // Map ML service features to database schema (all 7 features)
      screening.liveVideoFeatures = {
        // Feature 1: Eye Contact
        eyeContactRatio: videoData.eye_contact_ratio || 0,
        eyeContactLevel: videoData.eye_contact_level || 'unknown',
        eyeContactInterpretation: videoData.eye_contact_interpretation || '',
        
        // Feature 2: Blink Rate
        blinkRatePerMinute: videoData.blink_rate_per_minute || 0,
        blinkLevel: videoData.blink_level || 'unknown',
        blinkInterpretation: videoData.blink_interpretation || '',
        
        // Feature 3: Head Movement Rate
        headMovementRate: videoData.head_movement_avg_per_frame || 0,
        headMovementLevel: videoData.head_movement_level || 'unknown',
        headMovementInterpretation: videoData.head_movement_interpretation || '',
        
        // Feature 4: Head Repetitive Movements
        headMovements: videoData.head_movements || {
          present: false,
          repetitive: false,
          description: 'No data'
        },
        
        // Feature 5: Hand Repetitive Movements (Stimming)
        handStimming: videoData.hand_stimming || {
          present: false,
          severity: 'NORMAL',
          description: 'No repetitive hand movements detected'
        },
        
        // Feature 6: Social Gestures
        socialGestures: videoData.social_gestures || {
          present: false,
          frequency_per_minute: 0,
          description: 'No social gestures detected'
        },
        
        // Feature 7: Facial Expression Variability
        facialExpressionVariability: videoData.facial_expression_variability || 0,
        expressionLevel: videoData.expression_level || 'unknown',
        expressionInterpretation: videoData.expression_interpretation || '',
        
        // Session metadata (match ML service output keys)
        sessionDuration: videoData.sessionDuration || videoData.session_duration_seconds || 0,
        totalFrames: videoData.totalFrames || videoData.total_frames_processed || 0,
        
        // Clinical interpretation from ML service
        interpretation: videoData.clinical_interpretation || {
          concerns: [],
          riskScore: 0,
          risk_level: 'Low',
          summary: '',
          total_concerns: 0
        },
        
        // Data quality metrics
        dataQuality: videoData.data_quality || {
          face_detection_ratio: 0,
          blink_data_quality: {},
          expression_detection_rate: 0
        }
      };
      
      console.log('✓ Saved all 7 behavioral features:', {
        '1_EyeContact': screening.liveVideoFeatures.eyeContactRatio,
        '2_BlinkRate': screening.liveVideoFeatures.blinkRatePerMinute,
        '3_HeadMovement': screening.liveVideoFeatures.headMovementRate,
        '4_HeadRepetitive': screening.liveVideoFeatures.headMovements?.repetitive,
        '5_HandStimming': screening.liveVideoFeatures.handStimming?.present,
        '6_Gestures': screening.liveVideoFeatures.socialGestures?.frequency_per_minute,
        '7_Expressions': screening.liveVideoFeatures.facialExpressionVariability
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
          head_movements: screening.liveVideoFeatures.headMovements || {
            present: false,
            repetitive: false,
            description: 'No data'
          },
          hand_stimming: screening.liveVideoFeatures.handStimming || {
            present: false,
            severity: 'NORMAL',
            description: 'No repetitive hand movements detected'
          },
          social_gestures: screening.liveVideoFeatures.socialGestures || {
            present: false,
            frequency_per_minute: 0,
            description: 'No social gestures detected'
          },
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
    })
    .populate('child', 'name nickname dateOfBirth profileImage ageInMonths gender')
    .populate('user', 'name email');

    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    // Match frontend expected format: { success: true, data: { screening: ... } }
    res.json({ success: true, data: { screening } });
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
    .select('finalScore riskLevel createdAt completedAt interpretation liveVideoFeatures questionnaire status');

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
    res.json({ success: true, data: { screenings } });
  } catch (error) {
    console.error('Error fetching screenings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all screenings for current user (across all children)
// @route   GET /api/screenings/user/all
// @access  Private
exports.getAllUserScreenings = async (req, res) => {
  try {
    const screenings = await Screening.find({ 
      user: req.user._id,
      status: 'completed'
    })
    .populate('child', 'name nickname profileImage dateOfBirth gender ageInMonths')
    .sort({ completedAt: -1, createdAt: -1 })
    .select('child finalScore riskLevel createdAt completedAt interpretation liveVideoFeatures questionnaire status')
    .lean();

    res.json({ success: true, data: { screenings } });
  } catch (error) {
    console.error('Error fetching all user screenings:', error);
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

// @desc    Upload and process video for screening
// @route   POST /api/screenings/:id/video
// @access  Private
exports.uploadVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const videoFile = req.file;

    if (!videoFile) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    console.log(`📹 Received video for screening ${id}:`, {
      size: `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`,
      mimetype: videoFile.mimetype,
      originalname: videoFile.originalname
    });

    // Verify screening exists and belongs to user
    const screening = await Screening.findOne({ _id: id, user: req.user._id });
    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    // Create form data to send to ML service
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('video', videoFile.buffer, {
      filename: videoFile.originalname,
      contentType: videoFile.mimetype
    });
    formData.append('screening_id', id);
    formData.append('duration', '180'); // Default 3 minutes, can be adjusted

    console.log('📤 Forwarding video to ML service for analysis...');

    // Send to ML service
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/video/process-complete`,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 600000 // 10 minutes timeout
      }
    );

    console.log('✅ ML processing complete:', {
      frames_processed: mlResponse.data.frames_processed,
      duration: mlResponse.data.duration
    });

    const videoData = mlResponse.data.features;

    // Save features to database (all 7 behavioral features)
    screening.liveVideoFeatures = {
      // Feature 1: Eye Contact
      eyeContactRatio: videoData.eye_contact_ratio || 0,
      eyeContactLevel: videoData.eye_contact_level || 'unknown',
      eyeContactInterpretation: videoData.eye_contact_interpretation || '',
      
      // Feature 2: Blink Rate
      blinkRatePerMinute: videoData.blink_rate_per_minute || 0,
      blinkLevel: videoData.blink_level || 'unknown',
      blinkInterpretation: videoData.blink_interpretation || '',
      
      // Feature 3: Head Movement Rate
      headMovementRate: videoData.head_movement_avg_per_frame || 0,
      headMovementLevel: videoData.head_movement_level || 'unknown',
      headMovementInterpretation: videoData.head_movement_interpretation || '',
      
      // Feature 4: Head Repetitive Movements
      headMovements: videoData.head_movements || {
        present: false,
        repetitive: false,
        description: 'No data'
      },
      
      // Feature 5: Hand Stimming
      handStimming: videoData.hand_stimming || {
        present: false,
        severity: 'NORMAL',
        description: 'No repetitive hand movements detected'
      },
      
      // Feature 6: Social Gestures
      socialGestures: videoData.social_gestures || {
        present: false,
        frequency_per_minute: 0,
        description: 'No social gestures detected'
      },
      
      // Feature 7: Facial Expression Variability
      facialExpressionVariability: videoData.facial_expression_variability || 0,
      expressionLevel: videoData.expression_level || 'unknown',
      expressionInterpretation: videoData.expression_interpretation || '',
      
      // Session metadata
      sessionDuration: videoData.sessionDuration || 0,
      totalFrames: videoData.totalFrames || 0,
      
      // Clinical interpretation from ML service
      interpretation: videoData.clinical_interpretation || {
        concerns: [],
        riskScore: 0,
        risk_level: 'Low'
      }
    };

    await screening.save();

    console.log('💾 Saved video features to database:', {
      eyeContact: screening.liveVideoFeatures.eyeContactRatio,
      blinkRate: screening.liveVideoFeatures.blinkRatePerMinute,
      headMovement: screening.liveVideoFeatures.headMovementRate,
      handStimming: screening.liveVideoFeatures.handStimming.severity,
      frames: screening.liveVideoFeatures.totalFrames
    });

    // Return features to frontend
    res.json({
      success: true,
      videoData: mlResponse.data.features,
      features: mlResponse.data.features,
      frames_processed: mlResponse.data.frames_processed,
      duration: mlResponse.data.duration,
      fps: mlResponse.data.fps
    });

  } catch (error) {
    console.error('❌ Error processing video:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        message: 'ML service error',
        error: error.response.data.detail || error.message
      });
    }
    
    res.status(500).json({
      message: 'Video processing failed',
      error: error.message
    });
  }
};
