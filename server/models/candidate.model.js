const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  cand_name: {
    type: String,
    required: [true, 'Candidate name is required']
  },
  cand_cnic_no: {
    type: String,
    required: [true, 'CNIC number is required'],
    unique: true
  },
  temp_cand_cnic_no: {
    type: String,
    default: ''
  },
  cand_mobile_no: {
    type: String,
    default: null
  },
  cand_whatsapp_no: {
    type: String,
    default: ''
  },
  cand_email: {
    type: String,
    required: [true, 'Email address is required'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  cand_gender: {
    type: String,
    enum: {
      values: ['M', 'F', 'O'],
      message: '{VALUE} is not a valid gender option'
    },
    default: null
  },
  cand_remarks: {
    type: String,
    default: null
  },
  cand_status: {
    type: Number,
    default: 1 // 1: Active, 0: Inactive
  },
  cand_nationality: {
    type: Number,
    default: 1 // 1: Pakistani, 2: Overseas Pakistani, 3: Foreign
  },
  cand_mode: {
    type: String,
    default: 'R' // Example: R: Regular, C: Contract, etc.
  },
  candidate_type: {
    type: String,
    enum: {
      values: ['initial', 'probation', 'hired', 'rejected'],
      message: '{VALUE} is not a valid candidate type'
    },
    default: 'initial' // initial: Initial Hiring, probation: On Probation, hired: Hired, rejected: Rejected
  },
  probation_period: {
    type: Number,  // in months
    default: null
  },
  probation_start_date: {
    type: Date,
    default: null
  },
  probation_end_date: {
    type: Date,
    default: null
  },
  org_id: {
    type: Number,
    default: 1000,
    ref: 'Organization'
  },
  added_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  user_account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
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
  },
  cnic_flag: {
    type: Number,
    default: 0
  },
  emp_test_status: {
    type: Number,
    default: 0
  },
  board_id: {
    type: Number,
    default: 0
  },
  cat_id: {
    type: Number,
    default: 0,
    ref: 'Category'
  },
  inst_id: {
    type: Number,
    default: 0,
    ref: 'Institute'
  },
  dept_id: {
    type: Number,
    default: 0,
    ref: 'Department'
  },
  job_id: {
    type: Number,
    default: 0,
    ref: 'Job'
  },
  // New fields for job management
  applied_job_id: {
    type: Number,
    default: 0,
    ref: 'Job'
  },
  current_job_id: {
    type: Number,
    default: 0,
    ref: 'Job'
  },
  slot_id: {
    type: Number,
    default: 0,
    ref: 'JobSlot'
  },
  job_history: [{
    job_id: {
      type: Number,
      ref: 'Job'
    },
    slot_id: {
      type: Number,
      ref: 'JobSlot'
    },
    start_date: {
      type: Date
    },
    end_date: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'terminated'],
      default: 'active'
    }
  }],
  hiring_status: {
    type: String,
    enum: ['applied', 'shortlisted', 'interviewed', 'test_assigned', 'test_completed', 'board_assigned', 'board_completed', 'probation', 'hired', 'rejected'],
    default: 'applied'
  },
  supervisor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  date_of_joining: {
    type: Date,
    default: null
  },
  ebps: {
    type: Number,
    default: 0
  },
  qalam_id: {
    type: String,
    default: null
  },
  email_official: {
    type: String,
    default: ''
  },
  emp_flag: {
    type: Number,
    default: 0
  },
  addl_id: {
    type: Number,
    default: 0
  },
  psychom_flag: {
    type: Number,
    default: 0
  },
  emp_cat: {
    type: String,
    default: null
  },
  hr_status: {
    type: String,
    default: 'a'
  },
  emp_status: {
    type: String,
    default: null
  },
  desig_id: {
    type: Number,
    default: 0
  },
  ini_desig_id: {
    type: Number,
    default: 0
  },
  exl_sr_no: {
    type: Number,
    default: null
  },
  res_flag: {
    type: Number,
    default: 0
  },
  prob_flag: {
    type: Number,
    default: 0
  },
  is_transfered: {
    type: Number,
    default: 0
  },
  date_of_birth: {
    type: Date,
    default: null
  },
  is_special: {
    type: Number,
    default: 0
  },
  res_desig: {
    type: String,
    default: null
  },
  evaluation_history: [{
    board_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board'
    },
    evaluation_date: {
      type: Date,
      default: Date.now
    },
    previous_status: String,
    new_status: String,
    comments: String,
    evaluated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
});

// Create indexes matching the SQL indexes
CandidateSchema.index({ org_id: 1 });
CandidateSchema.index({ emp_flag: 1, prob_flag: 1, date_of_joining: 1 });
CandidateSchema.index({ cat_id: 1 });
CandidateSchema.index({ dept_id: 1 });
CandidateSchema.index({ inst_id: 1 });
CandidateSchema.index({ desig_id: 1 });
CandidateSchema.index({ job_id: 1 });
CandidateSchema.index({ applied_job_id: 1 });
CandidateSchema.index({ current_job_id: 1 });
CandidateSchema.index({ slot_id: 1 });
CandidateSchema.index({ hiring_status: 1 });

module.exports = mongoose.model('Candidate', CandidateSchema); 