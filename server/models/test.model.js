const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
  test_id: {
    type: Number,
    required: true,
    unique: true
  },
  test_name: {
    type: String,
    required: true,
    trim: true
  },
  test_type: {
    type: mongoose.Schema.Types.Mixed, // Can be a number (1, 2) or a string for custom types
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  instruction: {
    type: String,
    required: true
  },
  closing_remarks: {
    type: String
  },
  test_duration: {
    type: Number, // Duration in minutes
    default: 60
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  applicable_jobs: [{
    type: Number,
    ref: 'Job'
  }],
  applicable_hiring_stages: [{
    type: String,
    enum: ['application', 'screening', 'technical', 'hr', 'final', 'probation']
  }],
  is_job_specific: {
    type: Boolean,
    default: false
  },
  test_status: {
    type: Number,
    enum: [0, 1], // 0: Inactive, 1: Active
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

TestSchema.index({ 'applicable_jobs': 1 });
TestSchema.index({ 'applicable_hiring_stages': 1 });
TestSchema.index({ 'is_job_specific': 1 });

module.exports = mongoose.model('Test', TestSchema); 