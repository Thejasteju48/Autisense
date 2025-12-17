const mongoose = require('mongoose');

const screeningSchema = new mongoose.Schema({
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true,
    index: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Interactive Game 1: Eye Contact Detection
  // Extracted during "Look at the Character" game
  eyeContactInteraction: {
    completed: {
      type: Boolean,
      default: false
    },
    eyeContactRatio: {
      type: Number,
      min: 0,
      max: 1
    },
    averageEAR: Number,              // Eye Aspect Ratio average
    alignmentScore: Number,          // Nose-to-eye center alignment
    totalFrames: Number,
    contactFrames: Number,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    interpretation: String,
    duration: Number,                // seconds
    completedAt: Date
  },
  
  // Interactive Game 2: Gesture Detection
  // Extracted during "Wave at the Character" game
  gestureInteraction: {
    completed: {
      type: Boolean,
      default: false
    },
    gestureFrequency: Number,        // number of gestures detected
    waveCount: Number,
    pointCount: Number,
    handMovementScore: Number,
    totalFrames: Number,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    interpretation: String,
    duration: Number,
    completedAt: Date
  },
  
  // Interactive Game 3: Smile Detection
  // Extracted during "Make the Character Happy" game
  smileInteraction: {
    completed: {
      type: Boolean,
      default: false
    },
    smileRatio: {
      type: Number,
      min: 0,
      max: 1
    },
    smileFrequency: Number,          // number of distinct smiles
    mouthAspectRatio: Number,        // average MAR
    totalFrames: Number,
    smileFrames: Number,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    interpretation: String,
    duration: Number,
    completedAt: Date
  },
  
  // Interactive Game 4: Repetitive Behavior Detection
  // Extracted during free-play interaction with moving object
  repetitiveInteraction: {
    completed: {
      type: Boolean,
      default: false
    },
    repetitiveRatio: {
      type: Number,
      min: 0,
      max: 1
    },
    oscillationCount: Number,        // number of oscillatory motions
    motionRange: Number,             // range of motion
    patternScore: Number,
    totalFrames: Number,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    interpretation: String,
    duration: Number,
    completedAt: Date
  },
  
  // Interactive Game 5: Imitation Ability
  // Extracted during "Copy the Friend" game
  imitationInteraction: {
    completed: {
      type: Boolean,
      default: false
    },
    imitationScore: {
      type: Number,
      min: 0,
      max: 1
    },
    successfulImitations: Number,    // number of successful imitations
    totalAttempts: Number,           // total number of attempts (usually 4)
    averageDelay: Number,            // average response delay in ms
    similarityScore: Number,         // motion similarity score
    totalFrames: Number,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    interpretation: String,
    duration: Number,
    completedAt: Date
  },
  
  // Questionnaire (Parent-filled)
  questionnaire: {
    completed: {
      type: Boolean,
      default: false
    },
    responses: [{
      questionId: Number,
      question: String,
      answer: Boolean
    }],
    score: {
      type: Number,
      min: 0,
      max: 1
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
    eyeContactInsights: String,
    smileInsights: String,
    gestureInsights: String,
    repetitiveInsights: String,
    imitationInsights: String,
    questionnaireInsights: String,
    recommendations: [String]
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

// Method to check if all interactions are completed
screeningSchema.methods.allInteractionsCompleted = function() {
  return (
    this.eyeContactInteraction?.completed &&
    this.smileInteraction?.completed &&
    this.gestureInteraction?.completed &&
    this.repetitiveInteraction?.completed &&
    this.imitationInteraction?.completed &&
    this.questionnaire?.completed
  );
};

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
