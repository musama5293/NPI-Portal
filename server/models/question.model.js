const mongoose = require('mongoose');

// Option Schema
const OptionSchema = new mongoose.Schema({
  option_text: {
    type: String,
    required: true
  },
  is_correct: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number,
    default: 0
  }
});

// Question Schema
const QuestionSchema = new mongoose.Schema({
  question_id: {
    type: Number,
    required: true,
    unique: true
  },
  question_text: {
    type: String,
    required: true
  },
  question_text_urdu: {
    type: String,
    default: ''
  },
  help_text: {
    type: String,
    default: ''
  },
  question_type: {
    type: String,
    enum: ['multiple_choice', 'single_choice', 'text', 'rating_scale', 'likert_scale'],
    default: 'single_choice'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  // New fields for domain and subdomain
  domain_id: {
    type: Number,
    ref: 'Domain'
  },
  subdomain_id: {
    type: Number,
    ref: 'SubDomain'
  },
  // Likert scale settings
  is_likert: {
    type: Boolean,
    default: false
  },
  is_reversed: {
    type: Boolean,
    default: false
  },
  likert_points: {
    type: Number,
    enum: [3, 5, 7, 9, 11],
    default: 5
  },
  probation_flag: {
    type: Boolean,
    default: false  // false: Psychometric, true: Probation
  },
  test_ids: [{
    type: Number,
    ref: 'Test'
  }],
  options: [OptionSchema],
  difficulty_level: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  question_status: {
    type: Number,
    enum: [0, 1], // 0: Inactive, 1: Active
    default: 1
  },
  org_id: {
    type: Number,
    ref: 'Organization',
    required: true,
    default: 1
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updated_by: {
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

// Add indexes for faster queries
QuestionSchema.index({ domain_id: 1 });
QuestionSchema.index({ subdomain_id: 1 });
QuestionSchema.index({ test_ids: 1 });
QuestionSchema.index({ is_likert: 1 });
QuestionSchema.index({ question_type: 1 });
// Organization-based indexes for multi-tenancy
QuestionSchema.index({ org_id: 1, question_status: 1 });
QuestionSchema.index({ org_id: 1, domain_id: 1 });
QuestionSchema.index({ org_id: 1, subdomain_id: 1 });
QuestionSchema.index({ question_id: 1 }, { unique: true });

module.exports = mongoose.model('Question', QuestionSchema); 