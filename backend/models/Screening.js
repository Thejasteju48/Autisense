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
  
  // Live Video Features (7 behavioral markers)
  liveVideoFeatures: {
    eyeContactRatio: {
      type: Number,
      min: 0,
      max: 1
    },
    blinkRatePerMinute: Number,
    headMovementRate: Number,
    headRepetitiveMovement: {
      detected: Boolean,
      oscillations: Number,
      horizontal: Number,
      vertical: Number
    },
    handRepetitiveMovement: {
      leftHand: {
        detected: Boolean,
        oscillations: Number,
        intensity: Number
      },
      rightHand: {
        detected: Boolean,
        oscillations: Number,
        intensity: Number
      }
    },
    gestureFrequencyPerMinute: Number,
    facialExpressionVariability: Number,
    sessionDuration: Number,
    totalFrames: Number,
    interpretation: {
      concerns: [String],
      riskScore: Number,
      summary: String
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
