const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Child name is required'],
    trim: true
  },
  nickname: {
    type: String,
    trim: true
  },
  ageInMonths: {
    type: Number,
    required: [true, 'Age is required'],
    min: [12, 'Minimum age is 12 months'],
    max: [72, 'Maximum age is 72 months (6 years)']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  dateOfBirth: {
    type: Date
  },
  profileImage: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for display name
childSchema.virtual('displayName').get(function() {
  return this.nickname || this.name;
});

// Ensure virtuals are included in JSON
childSchema.set('toJSON', { virtuals: true });
childSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Child', childSchema);
