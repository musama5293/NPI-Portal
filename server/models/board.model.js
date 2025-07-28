const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
  board_name: {
    type: String,
    required: [true, 'Board name is required'],
    trim: true
  },
  board_description: {
    type: String,
    trim: true
  },
  board_type: {
    type: String,
    enum: ['initial', 'probation', 'other'],
    default: 'initial'
  },
  board_date: {
    type: Date,
    default: Date.now
  },
  panel_members: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'completed'],
    default: 'draft'
  },
  job_ids: {
    type: [Number],
    ref: 'Job',
    default: []
  },
  job_id: {
    type: Number,
    ref: 'Job'
  },
  candidates: [{
    candidate_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate'
    },
    assessment_status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    assigned_date: {
      type: Date,
      default: Date.now
    },
    job_id: {
      type: Number,
      ref: 'Job'
    }
  }],
  evaluation_required_from: [{
    role: {
      type: String,
      enum: ['supervisor', 'hr', 'panel_member', 'other'],
      default: 'hr'
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending'
    },
    completed_at: {
      type: Date,
      default: null
    }
  }],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Update the 'updated_at' field on save
BoardSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Board', BoardSchema); 