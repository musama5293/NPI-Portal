const mongoose = require('mongoose');

/**
 * JobSlot Schema
 * Represents a specific slot/position within a job
 */
const jobSlotSchema = new mongoose.Schema({
  slot_id: {
    type: Number,
    required: true,
    unique: true
  },
  slot_name: {
    type: String,
    required: true,
    trim: true
  },
  job_id: {
    type: Number,
    ref: 'Job'
  },
  cat_id: {
    type: Number,
    ref: 'Category'
  },
  slot_description: {
    type: String,
    trim: true
  },
  slot_status: {
    type: Number,
    default: 1 // 1=Active, 0=Inactive
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

// Set up an index on slot_id for faster queries
jobSlotSchema.index({ slot_id: 1 });
jobSlotSchema.index({ job_id: 1 });

// Pre-save hook to update the updated_at field
jobSlotSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const JobSlot = mongoose.model('JobSlot', jobSlotSchema);

module.exports = JobSlot; 