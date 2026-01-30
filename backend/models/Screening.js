const mongoose = require('mongoose');

const screeningSchema = new mongoose.Schema({
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: false,  // Optional for video-behavior-analysis
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  parent: {  // Alias for backward compatibility
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Screening Type
  type: {
    type: String,
    enum: ['Live Video', 'video-behavior-analysis'],
    default: 'Live Video'
  },
  
  // Video Source (live recording or pre-recorded upload)
  videoSource: {
    type: String,
    enum: ['live-recording', 'pre-recorded'],
    default: 'pre-recorded'
  },
  
  // Parent location for recommendations
  parentLocation: {
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  
  // Live Video Features (7 behavioral markers from ML service)
  liveVideoFeatures: {
    // Feature 1: Eye Contact
    eyeContactRatio: {
      type: Number,
      min: 0,
      max: 1
    },
    eyeContactLevel: String,  // low, normal, high
    eyeContactInterpretation: String,
    
    // Feature 2: Blink Rate
    blinkRatePerMinute: Number,
    blinkLevel: String,  // low, normal, high
    blinkInterpretation: String,
    
    // Feature 3: Head Movement Rate
    headMovementRate: Number,
    headMovementLevel: String,  // low, normal, high
    headMovementInterpretation: String,
    
    // Feature 4: Head Repetitive Movements
    headMovements: {
      present: Boolean,
      repetitive: Boolean,
      description: String
    },
    
    // Feature 5: Hand Repetitive Movements (Stimming)
    handStimming: {
      present: Boolean,
      severity: String,  // NORMAL, LOW, MODERATE, HIGH
      description: String
    },
    
    // Feature 6: Social Gestures
    socialGestures: {
      present: Boolean,
      frequency_per_minute: Number,
      description: String
    },
    
    // Feature 7: Facial Expression Variability (DeepFace)
    facialExpressionVariability: Number,
    expressionLevel: String,  // low, normal, high
    expressionInterpretation: String,
    
    // Session metadata
    sessionDuration: Number,
    totalFrames: Number,
    
    // Clinical interpretation from ML service
    interpretation: {
      concerns: [String],
      riskScore: Number,
      risk_level: String,  // Low, Moderate, High
      summary: String,
      total_concerns: Number
    },
    
    // Data quality metrics
    dataQuality: {
      face_detection_ratio: Number,
      blink_data_quality: mongoose.Schema.Types.Mixed,
      expression_detection_rate: Number
    }
  },
  
  // Video Behavior Analysis Fields (OLD - for backward compatibility)
  videoBehaviorScore: {
    type: Number,
    min: 0,
    max: 100
  },
  questionnaireScore: {
    type: Number,
    min: 0,
    max: 100
  },
  combinedScore: {
    type: Number,
    min: 0,
    max: 100
  },
  riskClassification: String,  // LOW, MODERATE, HIGH
  featureAnalysis: mongoose.Schema.Types.Mixed,  // Detailed feature scores
  recommendations: [{
    priority: String,
    category: String,
    text: String
  }],
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  metadata: mongoose.Schema.Types.Mixed,  // Session info, timestamps, etc.
  
  // Questionnaire (Parent-filled)
  questionnaire: {
    completed: {
      type: Boolean,
      default: false
    },
    responses: [{
      questionId: Number,
      question: String,
      answer: Boolean,
      _id: false  // Disable automatic _id for subdocuments
    }],
    score: {
      type: Number,
      min: 0,
      max: 1
    },
    jaundice: {
      type: String,
      enum: ['yes', 'no']
    },
    family_asd: {
      type: String,
      enum: ['yes', 'no']
    }
  },
  
  // Final Results (computed after all interactions + questionnaire)
  finalScore: {
    type: Number,
    min: 0,
    max: 100
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Moderate', 'High']
  },
  
  // Interpretation & Recommendations
  interpretation: {
    summary: String,
    confidence: Number,
    liveVideoSummary: String,
    recommendations: [String],
    llmAnalysis: String  // LLM-generated comprehensive analysis from Groq
  },
  
  // Report
  reportGenerated: {
    type: Boolean,
    default: false
  },
  reportPath: String,
  
  // Status
  status: {
    type: String,
    enum: ['started', 'in-progress', 'completed', 'failed'],
    default: 'started'
  },
  
  completedAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
screeningSchema.index({ child: 1, createdAt: -1 });
screeningSchema.index({ parent: 1, createdAt: -1 });
screeningSchema.index({ status: 1, createdAt: -1 });

// Method to calculate risk level from score
screeningSchema.methods.calculateRiskLevel = function() {
  if (!this.finalScore) return null;
  
  if (this.finalScore < 30) {
    this.riskLevel = 'Low';
  } else if (this.finalScore < 60) {
    this.riskLevel = 'Moderate';
  } else {
    this.riskLevel = 'High';
  }
  return this.riskLevel;
};

module.exports = mongoose.model('Screening', screeningSchema);
