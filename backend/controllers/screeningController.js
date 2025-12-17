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
      parent: req.user._id,
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

// @desc    Process eye contact interaction frames
// @route   POST /api/screenings/:id/eye-contact
// @access  Private
exports.processEyeContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { frames, duration } = req.body;

    // Find screening
    const screening = await Screening.findOne({ _id: id, parent: req.user._id });
    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    // Send frames to ML service for analysis
    const response = await axios.post(`${ML_SERVICE_URL}/analyze/eye-contact`, {
      frames: frames,  // array of base64 encoded frames
      duration: duration
    });

    const analysisResult = response.data;

    // Update screening with eye contact results
    screening.eyeContactInteraction = {
      completed: true,
      eyeContactRatio: analysisResult.eyeContactRatio,
      averageEAR: analysisResult.averageEAR,
      alignmentScore: analysisResult.alignmentScore,
      totalFrames: analysisResult.totalFrames,
      contactFrames: analysisResult.contactFrames,
      confidence: analysisResult.confidence,
      interpretation: analysisResult.interpretation,
      duration: duration,
      completedAt: new Date()
    };

    screening.status = 'in-progress';
    await screening.save();

    res.json({
      success: true,
      data: screening.eyeContactInteraction,
      message: 'Eye contact analysis completed'
    });
  } catch (error) {
    console.error('Error processing eye contact:', error);
    res.status(500).json({ 
      message: 'Error processing eye contact data',
      error: error.message 
    });
  }
};

// @desc    Process gesture interaction frames
// @route   POST /api/screenings/:id/gesture
// @access  Private
exports.processGesture = async (req, res) => {
  try {
    const { id } = req.params;
    const { frames, duration } = req.body;

    const screening = await Screening.findOne({ _id: id, parent: req.user._id });
    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    // Send frames to ML service
    const response = await axios.post(`${ML_SERVICE_URL}/analyze/gesture`, {
      frames: frames,
      duration: duration
    });

    const analysisResult = response.data;

    // Update screening with gesture results
    screening.gestureInteraction = {
      completed: true,
      gestureFrequency: analysisResult.gestureFrequency,
      waveCount: analysisResult.waveCount,
      pointCount: analysisResult.pointCount,
      handMovementScore: analysisResult.handMovementScore,
      totalFrames: analysisResult.totalFrames,
      confidence: analysisResult.confidence,
      interpretation: analysisResult.interpretation,
      duration: duration,
      completedAt: new Date()
    };

    await screening.save();

    res.json({
      success: true,
      data: screening.gestureInteraction,
      message: 'Gesture analysis completed'
    });
  } catch (error) {
    console.error('Error processing gesture:', error);
    res.status(500).json({ 
      message: 'Error processing gesture data',
      error: error.message 
    });
  }
};

// @desc    Process smile interaction frames
// @route   POST /api/screenings/:id/smile
// @access  Private
exports.processSmile = async (req, res) => {
  try {
    const { id } = req.params;
    const { frames, duration } = req.body;

    const screening = await Screening.findOne({ _id: id, parent: req.user._id });
    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    // Send frames to ML service
    const response = await axios.post(`${ML_SERVICE_URL}/analyze/smile`, {
      frames: frames,
      duration: duration
    });

    const analysisResult = response.data;

    // Update screening with smile results
    screening.smileInteraction = {
      completed: true,
      smileRatio: analysisResult.smileRatio,
      smileFrequency: analysisResult.smileFrequency,
      mouthAspectRatio: analysisResult.mouthAspectRatio,
      totalFrames: analysisResult.totalFrames,
      smileFrames: analysisResult.smileFrames,
      confidence: analysisResult.confidence,
      interpretation: analysisResult.interpretation,
      duration: duration,
      completedAt: new Date()
    };

    await screening.save();

    res.json({
      success: true,
      data: screening.smileInteraction,
      message: 'Smile analysis completed'
    });
  } catch (error) {
    console.error('Error processing smile:', error);
    res.status(500).json({ 
      message: 'Error processing smile data',
      error: error.message 
    });
  }
};

// @desc    Process repetitive behavior interaction frames
// @route   POST /api/screenings/:id/repetitive
// @access  Private
exports.processRepetitive = async (req, res) => {
  try {
    const { id } = req.params;
    const { frames, duration } = req.body;

    const screening = await Screening.findOne({ _id: id, parent: req.user._id });
    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    // Send frames to ML service
    const response = await axios.post(`${ML_SERVICE_URL}/analyze/repetitive`, {
      frames: frames,
      duration: duration
    });

    const analysisResult = response.data;

    // Update screening with repetitive behavior results
    screening.repetitiveInteraction = {
      completed: true,
      repetitiveRatio: analysisResult.repetitiveRatio,
      oscillationCount: analysisResult.oscillationCount,
      motionRange: analysisResult.motionRange,
      patternScore: analysisResult.patternScore,
      totalFrames: analysisResult.totalFrames,
      confidence: analysisResult.confidence,
      interpretation: analysisResult.interpretation,
      duration: duration,
      completedAt: new Date()
    };

    await screening.save();

    res.json({
      success: true,
      data: screening.repetitiveInteraction,
      message: 'Repetitive behavior analysis completed'
    });
  } catch (error) {
    console.error('Error processing repetitive behavior:', error);
    res.status(500).json({ 
      message: 'Error processing repetitive behavior data',
      error: error.message 
    });
  }
};

// @desc    Process imitation interaction frames
// @route   POST /api/screenings/:id/imitation
// @access  Private
exports.processImitation = async (req, res) => {
  try {
    const { id } = req.params;
    const { frames, duration } = req.body;

    const screening = await Screening.findOne({ _id: id, parent: req.user._id });
    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    // Send frames to ML service
    const response = await axios.post(`${ML_SERVICE_URL}/analyze/imitation`, {
      frames: frames,
      duration: duration
    });

    const analysisResult = response.data;

    // Update screening with imitation results
    screening.imitationInteraction = {
      completed: true,
      imitationScore: analysisResult.imitationScore,
      successfulImitations: analysisResult.successfulImitations,
      totalAttempts: analysisResult.totalAttempts,
      averageDelay: analysisResult.averageDelay,
      similarityScore: analysisResult.similarityScore,
      totalFrames: analysisResult.totalFrames,
      confidence: analysisResult.confidence,
      interpretation: analysisResult.interpretation,
      duration: duration,
      completedAt: new Date()
    };

    await screening.save();

    res.json({
      success: true,
      data: screening.imitationInteraction,
      message: 'Imitation analysis completed'
    });
  } catch (error) {
    console.error('Error processing imitation:', error);
    res.status(500).json({ 
      message: 'Error processing imitation data',
      error: error.message 
    });
  }
};

// @desc    Submit questionnaire responses
// @route   POST /api/screenings/:id/questionnaire
// @access  Private
exports.submitQuestionnaire = async (req, res) => {
  try {
    const { id } = req.params;
    const { responses } = req.body;

    const screening = await Screening.findOne({ _id: id, parent: req.user._id });
    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    // Calculate questionnaire score (percentage of "yes" answers)
    const yesCount = responses.filter(r => r.answer === true).length;
    const score = yesCount / responses.length;

    // Update screening with questionnaire
    screening.questionnaire = {
      completed: true,
      responses: responses,
      score: score
    };

    await screening.save();

    res.json({
      success: true,
      data: {
        score: score,
        totalQuestions: responses.length,
        yesCount: yesCount
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

    const screening = await Screening.findOne({ _id: id, parent: req.user._id })
      .populate('child', 'name nickname dateOfBirth');
    
    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    // Check if all interactions are completed
    if (!screening.allInteractionsCompleted()) {
      return res.status(400).json({ 
        message: 'Please complete all interactions before finalizing screening',
        completed: {
          eyeContact: screening.eyeContactInteraction?.completed || false,
          smile: screening.smileInteraction?.completed || false,
          gesture: screening.gestureInteraction?.completed || false,
          repetitive: screening.repetitiveInteraction?.completed || false,
          imitation: screening.imitationInteraction?.completed || false,
          questionnaire: screening.questionnaire?.completed || false
        }
      });
    }

    // Send all interaction data to ML service for final prediction
    const predictionData = {
      eyeContact: {
        ratio: screening.eyeContactInteraction.eyeContactRatio,
        ear: screening.eyeContactInteraction.averageEAR,
        alignment: screening.eyeContactInteraction.alignmentScore
      },
      smile: {
        ratio: screening.smileInteraction.smileRatio,
        frequency: screening.smileInteraction.smileFrequency
      },
      gesture: {
        frequency: screening.gestureInteraction.gestureFrequency,
        waveCount: screening.gestureInteraction.waveCount,
        pointCount: screening.gestureInteraction.pointCount
      },
      repetitive: {
        ratio: screening.repetitiveInteraction.repetitiveRatio,
        oscillationCount: screening.repetitiveInteraction.oscillationCount
      },
      imitation: {
        score: screening.imitationInteraction.imitationScore,
        successfulImitations: screening.imitationInteraction.successfulImitations,
        totalAttempts: screening.imitationInteraction.totalAttempts,
        averageDelay: screening.imitationInteraction.averageDelay
      },
      questionnaire: {
        score: screening.questionnaire.score
      }
    };

    const response = await axios.post(`${ML_SERVICE_URL}/predict/autism`, predictionData);
    const prediction = response.data;

    // Update screening with final results
    screening.finalScore = prediction.autismLikelihood;
    screening.riskLevel = prediction.riskLevel;
    screening.interpretation = {
      summary: prediction.interpretation.summary,
      eyeContactInsights: prediction.interpretation.eyeContactInsights,
      smileInsights: prediction.interpretation.smileInsights,
      gestureInsights: prediction.interpretation.gestureInsights,
      repetitiveInsights: prediction.interpretation.repetitiveInsights,
      imitationInsights: prediction.interpretation.imitationInsights,
      questionnaireInsights: prediction.interpretation.questionnaireInsights,
      recommendations: prediction.interpretation.recommendations
    };
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
        completedAt: screening.completedAt
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
      parent: req.user._id 
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
      parent: req.user._id,
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
      parent: req.user._id 
    })
    .populate('child', 'name nickname dateOfBirth')
    .populate('parent', 'name email');

    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    if (screening.status !== 'completed') {
      return res.status(400).json({ message: 'Screening is not completed yet' });
    }

    // Generate PDF report
    const pdfGenerator = require('../utils/pdfGenerator');
    const reportPath = await pdfGenerator.generateInteractionReport(screening);

    screening.reportGenerated = true;
    screening.reportPath = reportPath;
    await screening.save();

    // Send PDF file
    res.download(reportPath, `screening-report-${screening._id}.pdf`);
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
      parent: req.user._id 
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
