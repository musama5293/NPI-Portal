const mongoose = require('mongoose');

const DomainSchema = new mongoose.Schema({
  domain_id: {
    type: Number,
    required: true,
    unique: true
  },
  domain_name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  domain_status: {
    type: Number,
    enum: [0, 1], // 0: Inactive, 1: Active
    default: 1
  },
  org_id: {
    type: Number,
    ref: 'Organization',
    required: true,
    default: 1000
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

// Add indexes for better performance and to prevent duplicates
DomainSchema.index({ org_id: 1, domain_name: 1 });
DomainSchema.index({ org_id: 1, domain_status: 1 });
DomainSchema.index({ domain_id: 1 }, { unique: true });

module.exports = mongoose.model('Domain', DomainSchema); 