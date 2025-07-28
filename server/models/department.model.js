const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  dept_id: {
    type: Number,
    required: true,
    unique: true
  },
  dept_name: {
    type: String,
    required: true
  },
  dept_status: {
    type: Number,
    default: 1
  },
  inst_id: {
    type: Number,
    required: true,
    ref: 'Institute'
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

module.exports = mongoose.model('Department', DepartmentSchema); 