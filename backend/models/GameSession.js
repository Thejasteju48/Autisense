const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true,
    index: true
  },
  gameType: {
    type: String,
    enum: ['eye-contact', 'imitation', 'emotion-matching', 'gesture-mimic'],
    required: true
  },
  gameName: {
    type: String,
    required: true
  },
  
  // Performance metrics
  performance: {
    score: {
      type: Number,
      default: 0
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 100
    },
    completionRate: {
      type: Number,
      min: 0,
      max: 100
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    attempts: {
      type: Number,
      default: 0
    },
    correctResponses: {
      type: Number,
      default: 0
    },
    incorrectResponses: {
      type: Number,
      default: 0
    }
  },
  
  // Behavioral observations
  observations: {
    eyeContactDuration: Number,
    responseTime: Number,
    emotionalResponse: String,
    engagementLevel: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  },
  
  duration: {
    type: Number, // in seconds
    required: true
  },
  
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for performance queries
gameSessionSchema.index({ child: 1, gameType: 1, createdAt: -1 });

module.exports = mongoose.model('GameSession', gameSessionSchema);
