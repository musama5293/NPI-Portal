const mongoose = require('mongoose');

/**
 * Job Schema
 * Represents a job position in the organization
 */
const jobSchema = new mongoose.Schema({
  job_id: {
    type: Number,
    required: true,
    unique: true
  },
  job_name: {
    type: String,
    required: true,
    trim: true
  },
  job_description: {
    type: String,
    trim: true
  },
  job_scale: {
    type: String,
    trim: true
  },
  org_id: {
    type: Number,
    ref: 'Organization',
    required: true
  },
  inst_id: {
    type: Number,
    ref: 'Institute'
  },
  dept_id: {
    type: Number,
    ref: 'Department'
  },
  cat_id: {
    type: Number,
    ref: 'Category'
  },
  test_id: {
    type: String, // Corresponds to test_id in the Test model
    ref: 'Test'
  },
  vacancy_count: {
    type: Number,
    default: 0
  },
  min_qualification: {
    type: String,
    trim: true
  },
  job_type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    default: 'Full-time'
  },
  job_status: {
    type: Number,
    default: 1 // 1=Active, 0=Inactive
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

// Set up an index on job_id for faster queries
jobSchema.index({ job_id: 1 });
jobSchema.index({ org_id: 1 });
jobSchema.index({ created_by: 1 });

// Pre-save hook to update the updated_at field
jobSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job; 