const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  cat_id: {
    type: Number,
    required: true,
    unique: true
  },
  cat_name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  probation_period_months: {
    type: Number,
    default: null
  },
  cat_status: {
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

module.exports = mongoose.model('Category', CategorySchema); 