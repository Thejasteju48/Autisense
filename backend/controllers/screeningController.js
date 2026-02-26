const Screening = require('../models/Screening');
const Child = require('../models/Child');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const EMOTION_SERVICE_URL = process.env.EMOTION_SERVICE_URL || 'http://localhost:8001';

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
      const existingVideo = screening.liveVideoFeatures || {};
      screening.liveVideoFeatures = {
        eyeContact: videoData.eye_contact || existingVideo.eyeContact || 'Unknown',
        headStimming: videoData.head_stimming || existingVideo.headStimming || 'Absent',
        handStimming: videoData.hand_stimming || existingVideo.handStimming || 'Absent',
        handGesture: videoData.hand_gesture || existingVideo.handGesture || 'Absent',
        socialReciprocity: videoData.social_reciprocity || existingVideo.socialReciprocity || 'Unknown',
        emotionVariation: videoData.emotion_variation || existingVideo.emotionVariation || 'Unknown',
        sessionDuration: existingVideo.sessionDuration || videoData.session_duration_seconds || videoData.sessionDuration || 0,
        totalFrames: existingVideo.totalFrames || videoData.total_frames_processed || videoData.totalFrames || 0
      };

      console.log('✓ Saved 6 behavioral features:', {
        eyeContact: screening.liveVideoFeatures.eyeContact,
        headStimming: screening.liveVideoFeatures.headStimming,
        handStimming: screening.liveVideoFeatures.handStimming,
        handGesture: screening.liveVideoFeatures.handGesture,
        socialReciprocity: screening.liveVideoFeatures.socialReciprocity,
        emotionVariation: screening.liveVideoFeatures.emotionVariation
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

    // Derive video behavior score from the 6 feature labels (if available)
    let videoScore = null;
    let videoRiskLevel = null;
    let videoSummary = null;

    if (screening.liveVideoFeatures) {
      const features = screening.liveVideoFeatures;
      const riskFlags = [
        features.eyeContact === 'Low Eye Contact',
        features.headStimming === 'Present',
        features.handStimming === 'Present',
        features.handGesture === 'Absent',
        features.socialReciprocity === 'Low',
        features.emotionVariation === 'Low'
      ];

      const concernCount = riskFlags.filter(Boolean).length;
      videoScore = (concernCount / riskFlags.length) * 100;

      if (videoScore < 30) {
        videoRiskLevel = 'Low';
      } else if (videoScore < 60) {
        videoRiskLevel = 'Moderate';
      } else {
        videoRiskLevel = 'High';
      }

      videoSummary = `Video analysis indicates ${concernCount} of ${riskFlags.length} behavioral signals requiring attention.`;

      console.log('✓ Video behavior score (derived):', { videoScore, videoRiskLevel, concernCount });
    }

    // Combine predictions (weighted average if both available)
    let finalScore, riskLevel, interpretation;
    
    if (videoScore !== null) {
      // Combine: 60% questionnaire (more reliable), 40% video-derived score
      // Note: questionnairePrediction.probability is already a percentage (0-100)
      finalScore = (questionnairePrediction.probability * 0.6) + (videoScore * 0.4);
      
      // Determine combined risk level
      if (finalScore < 30) {
        riskLevel = 'Low';
      } else if (finalScore < 60) {
        riskLevel = 'Moderate';
      } else {
        riskLevel = 'High';
      }
      
      interpretation = `Combined assessment: ${questionnairePrediction.interpretation} ${videoSummary || ''}`;
      
      console.log('✓ Combined prediction:', { finalScore, riskLevel });
    } else {
      // Use questionnaire-only prediction
      finalScore = questionnairePrediction.probability;
      riskLevel = questionnairePrediction.risk_level;
      interpretation = questionnairePrediction.interpretation;
      
      console.log('✓ Using questionnaire-only prediction');
    }

    // Update screening with ML prediction results
    screening.finalScore = finalScore;
    screening.riskLevel = riskLevel;
    // Store the ML-predicted questionnaire score (not the simple yes/no ratio)
    // Note: probability is already a percentage (0-100)
    screening.mlQuestionnaireScore = questionnairePrediction.probability;
    screening.interpretation = {
      summary: interpretation,
      confidence: questionnairePrediction.confidence || 0.85,
      recommendations: questionnairePrediction.recommendations || [],
      liveVideoSummary: videoSummary || 'N/A',
      videoBehaviorScore: videoScore
    };

    // Generate LLM-enhanced analysis using Groq (TEMPORARILY DISABLED)
    let llmAnalysis = null;
    try {
      // LLM analysis disabled for now - can be re-enabled later
      // const groqService = require('../services/groqService');
      // const analysisResult = await groqService.generateScreeningAnalysis({
      //   finalScore: screening.finalScore,
      //   riskLevel: screening.riskLevel,
      //   questionnaire: screening.questionnaire,
      //   liveVideoFeatures: screening.liveVideoFeatures,
      //   child: screening.child
      // });

      // if (analysisResult.success) {
      //   llmAnalysis = analysisResult.analysis;
      //   screening.interpretation.llmAnalysis = llmAnalysis;
      //   console.log('✓ Generated LLM analysis using Groq API');
      // }
    } catch (llmError) {
      console.log('Note: LLM analysis currently disabled');
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
        mlQuestionnaireScore: screening.mlQuestionnaireScore,
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
    .populate('user', 'name email')
    .select('finalScore riskLevel mlQuestionnaireScore liveVideoFeatures questionnaire interpretation completedAt');

    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    console.log('Retrieved screening from DB:', {
      finalScore: screening.finalScore,
      riskLevel: screening.riskLevel,
      mlQuestionnaireScore: screening.mlQuestionnaireScore
    });

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
    .select('finalScore riskLevel mlQuestionnaireScore createdAt completedAt interpretation liveVideoFeatures questionnaire status');

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
    .select('child finalScore riskLevel mlQuestionnaireScore createdAt completedAt interpretation liveVideoFeatures questionnaire status')
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
    // PDF download temporarily disabled
    return res.status(503).json({ 
      message: 'PDF download service is temporarily unavailable. Please check back later.',
      error: 'SERVICE_DISABLED' 
    });
    
    // Original code commented out for future re-enablement:
    /*
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
    */
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

    const uploadsDir = path.join(__dirname, '../uploads/videos');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(videoFile.originalname) || '.mp4';
    const filename = `screening-${id}-${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, videoFile.buffer);

    const actualDuration = req.body.duration || '180';

    console.log('📤 Forwarding video path to ML service for analysis...');
    console.log('   ML Service URL:', `${ML_SERVICE_URL}/analyze`);
    console.log('   Video Path:', filePath);
    console.log('   Duration:', actualDuration, 'seconds');
    console.log('   Screening ID:', id);

    let videoData = null;
    try {
      const mlResponse = await axios.post(
        `${ML_SERVICE_URL}/analyze`,
        { video_path: filePath },
        { timeout: 600000 }
      );

      console.log('✅ ML processing complete:', mlResponse.data);
      videoData = mlResponse.data;

      try {
        const emotionResponse = await axios.post(
          `${EMOTION_SERVICE_URL}/analyze-emotion`,
          { video_path: filePath },
          { timeout: 600000 }
        );
        videoData.emotion_variation = emotionResponse.data?.emotion_variation || videoData.emotion_variation;
      } catch (emotionError) {
        console.error('⚠️ Emotion service failed:', emotionError.message);
      }
    } finally {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    screening.liveVideoFeatures = {
      eyeContact: videoData.eye_contact || 'Unknown',
      headStimming: videoData.head_stimming || 'Absent',
      handStimming: videoData.hand_stimming || 'Absent',
      handGesture: videoData.hand_gesture || 'Absent',
      socialReciprocity: videoData.social_reciprocity || 'Unknown',
      emotionVariation: videoData.emotion_variation || 'Unknown',
      sessionDuration: Number(actualDuration) || 0,
      totalFrames: 0
    };

    await screening.save();

    console.log('💾 Saved video features to database:', screening.liveVideoFeatures);

    // Return features to frontend
    res.json({
      success: true,
      videoData: videoData,
      features: videoData,
      duration: Number(actualDuration) || 0
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
