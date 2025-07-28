const mongoose = require('mongoose');

// Domain Score Schema
const DomainScoreSchema = new mongoose.Schema({
  domain_id: {
    type: Number,
    required: true,
    ref: 'Domain'
  },
  domain_name: {
    type: String
  },
  raw_score: {
    type: Number,
    required: true
  },
  max_score: {
    type: Number,
    required: true
  },
  percentage_score: {
    type: Number,
    required: true
  },
  // Breakdown by subdomains
  subdomain_scores: [{
    subdomain_id: {
      type: Number,
      ref: 'SubDomain'
    },
    subdomain_name: {
      type: String
    },
    raw_score: {
      type: Number
    },
    max_score: {
      type: Number
    },
    percentage_score: {
      type: Number
    },
    // Store question-level responses for potential analysis
    question_responses: [{
      question_id: {
        type: Number,
        ref: 'Question'
      },
      question_text: {
        type: String
      },
      is_reversed: {
        type: Boolean,
        default: false
      },
      response_value: {
        type: Number
      },
      score_value: {
        type: Number
      }
    }]
  }]
});

// Test Score Schema
const TestScoreSchema = new mongoose.Schema({
  // Reference to test assignment
  test_assignment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestAssignment',
    required: true
  },
  // Reference to the test
  test_id: {
    type: Number,
    ref: 'Test',
    required: true
  },
  test_name: {
    type: String
  },
  // Reference to the candidate
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  candidate_name: {
    type: String
  },
  // Total score
  total_raw_score: {
    type: Number,
    required: true
  },
  total_max_score: {
    type: Number,
    required: true
  },
  total_percentage: {
    type: Number,
    required: true
  },
  // Breakdown by domains
  domain_scores: [DomainScoreSchema],
  // Status
  is_final: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String
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

// Create indexes for common queries
TestScoreSchema.index({ test_assignment_id: 1 });
TestScoreSchema.index({ candidate_id: 1 });
TestScoreSchema.index({ test_id: 1 });
TestScoreSchema.index({ 'domain_scores.domain_id': 1 });

module.exports = mongoose.model('TestScore', TestScoreSchema); 