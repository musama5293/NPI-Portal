const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  org_id: {
    type: Number,
    required: true,
    unique: true
  },
  org_name: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    default: 1
  },
  quiz_inst: {
    type: String,
    default: null
  },
  terms_and_conditions: {
    type: String,
    default: null
  },
  poc_name: {
    type: String,
    default: null
  },
  contact_no: {
    type: String,
    default: null
  },
  address: {
    type: String,
    default: null
  },
  email: {
    type: String,
    default: null
  },
  web_title: {
    type: String,
    default: null
  },
  logo_file_input: {
    type: String,
    default: null
  },
  closing_mesg: {
    type: String,
    default: null
  },
  expiry_days: {
    type: Number,
    default: 10
  },
  prob_expiry_days: {
    type: Number,
    default: 2
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

module.exports = mongoose.model('Organization', OrganizationSchema); 