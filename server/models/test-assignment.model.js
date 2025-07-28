const mongoose = require('mongoose');

const TestAssignmentSchema = new mongoose.Schema({
  assignment_id: {
    type: Number,
    required: true,
    unique: true
  },
  test_id: {
    type: Number,
    ref: 'Test',
    required: true
  },
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  // New job-related fields
  job_id: {
    type: Number,
    ref: 'Job',
    default: 0
  },
  slot_id: {
    type: Number,
    ref: 'JobSlot',
    default: 0
  },
  board_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    default: null
  },
  hiring_stage: {
    type: String,
    enum: ['application', 'screening', 'technical', 'hr', 'final', 'probation'],
    default: 'screening'
  },
  scheduled_date: {
    type: Date,
    required: true
  },
  expiry_date: {
    type: Date,
    required: true
  },
  start_time: {
    type: Date
  },
  end_time: {
    type: Date
  },
  completion_status: {
    type: String,
    enum: ['pending', 'started', 'completed', 'expired'],
    default: 'pending'
  },
  score: {
    type: Number,
    default: 0
  },
  // Domain and subdomain scores
  domain_scores: [{
    domain_id: {
      type: Number,
      ref: 'Domain'
    },
    domain_name: String,
    obtained_score: {
      type: Number,
      default: 0
    },
    max_score: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  }],
  subdomain_scores: [{
    subdomain_id: {
      type: Number,
      ref: 'SubDomain'
    },
    subdomain_name: String,
    domain_id: {
      type: Number,
      ref: 'Domain'
    },
    obtained_score: {
      type: Number,
      default: 0
    },
    max_score: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  }],
  answers: [{
    question_id: {
      type: Number,
      ref: 'Question'
    },
    answer: {
      type: mongoose.Schema.Types.Mixed // Can store string, number, or array for multiple-choice
    },
    score_obtained: {
      type: Number,
      default: 0
    },
    max_score: {
      type: Number,
      default: 0
    },
    answered_at: {
      type: Date,
      default: Date.now
    }
  }],
  feedback: {
    type: String
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignment_status: {
    type: Number,
    enum: [0, 1], // 0: Inactive, 1: Active
    default: 1
  },
  // New fields for supervisor feedback functionality
  is_supervisor_feedback: {
    type: Boolean,
    default: false
  },
  supervisor_id: {
    type: String,
    ref: 'User'
  },
  linked_assignment_id: {
    type: Number,
    ref: 'TestAssignment'
  },
  supervisor_feedback_text: {
    type: String,
    default: ''
  },
  linked_assignments: {
    type: [Number],
    default: []
  },
  supervisor_score: {
    type: Number,
    default: 0
  },
  candidate_name: {
    type: String  // Store candidate name directly for easier queries
  },
  supervisor_name: {
    type: String  // Store supervisor name directly for easier queries
  },
  // Enhanced test-taking experience fields
  current_page: {
    type: Number,
    default: 0
  },
  total_pages: {
    type: Number,
    default: 1
  },
  page_completed: {
    type: Number,
    default: 0
  },
  activity_log: [{
    activity_type: {
      type: String,
      enum: ['test_start', 'page_change', 'question_start', 'question_end', 'option_select', 'fullscreen_exit', 'fullscreen_enter', 'test_submit'],
      required: true
    },
    data: {
      type: mongoose.Schema.Types.Mixed // Store additional activity data
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  question_times: [{
    question_id: {
      type: Number,
      ref: 'Question'
    },
    time_spent: {
      type: Number, // Time in milliseconds
      default: 0
    },
    view_count: {
      type: Number,
      default: 1
    }
  }],
  fullscreen_violations: {
    type: Number,
    default: 0
  },
  total_offscreen_time: {
    type: Number, // Total time spent outside fullscreen in milliseconds
    default: 0
  },
  // Psychometric analysis data
  psychometric_analysis: {
    analysis_data: {
      type: mongoose.Schema.Types.Mixed // Store the complete analysis response
    },
    generated_at: {
      type: Date
    },
    api_version: {
      type: String,
      default: '1.0'
    }
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

// Add indexes for improved query performance
TestAssignmentSchema.index({ job_id: 1 });
TestAssignmentSchema.index({ slot_id: 1 });
TestAssignmentSchema.index({ hiring_stage: 1 });
TestAssignmentSchema.index({ candidate_id: 1, job_id: 1 });

module.exports = mongoose.model('TestAssignment', TestAssignmentSchema); 