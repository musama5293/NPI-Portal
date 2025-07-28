const mongoose = require('mongoose');

const InstituteSchema = new mongoose.Schema({
  inst_id: {
    type: Number,
    required: true,
    unique: true
  },
  inst_name: {
    type: String,
    required: true
  },
  inst_status: {
    type: Number,
    default: 1
  },
  inst_type_id: {
    type: Number,
    default: null
  },
  org_id: {
    type: Number,
    required: true,
    ref: 'Organization'
  },
  added_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  added_on: {
    type: Date,
    default: Date.now
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updated_on: {
    type: Date
  }
});

module.exports = mongoose.model('Institute', InstituteSchema); 