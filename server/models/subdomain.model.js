const mongoose = require('mongoose');

const SubDomainSchema = new mongoose.Schema({
  subdomain_id: {
    type: Number,
    required: true,
    unique: true
  },
  domain_id: {
    type: Number,
    ref: 'Domain',
    required: true
  },
  subdomain_name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subdomain_status: {
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

// Create indexes for better performance and to prevent duplicates
SubDomainSchema.index({ domain_id: 1, subdomain_id: 1 });
SubDomainSchema.index({ org_id: 1, domain_id: 1, subdomain_name: 1 });
SubDomainSchema.index({ org_id: 1, subdomain_status: 1 });
SubDomainSchema.index({ subdomain_id: 1 }, { unique: true });

module.exports = mongoose.model('SubDomain', SubDomainSchema); 