const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    intent: {
      type: String,
      enum: ['explanation', 'interpretation', 'recommendation', 'report', 'general', 'app_guidance', 'other'],
      default: 'other',
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'kn'],
      default: 'en',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    screening: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screening',
      required: true,
      index: true,
    },
    messages: [chatMessageSchema],
  },
  { timestamps: true }
);

chatSessionSchema.index({ user: 1, screening: 1 }, { unique: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
