const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  board_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  evaluator_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scores: {
    type: Object,
    default: {}
  },
  notes: {
    type: String,
    trim: true
  },
  decision: {
    type: String,
    enum: ['hire', 'consider', 'reject', 'pending', ''],
    default: ''
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    default: 'in_progress'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique assessment per board, candidate, and evaluator
AssessmentSchema.index({ board_id: 1, candidate_id: 1, evaluator_id: 1 }, { unique: true });

// Update the 'updated_at' field on save
AssessmentSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Assessment', AssessmentSchema); 