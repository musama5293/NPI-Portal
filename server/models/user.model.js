const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  mobile_no: {
    type: String,
    required: [true, 'Please provide a mobile number']
  },
  org_id: {
    type: Number,
    ref: 'Organization',
    default: 0
  },
  inst_id: {
    type: Number,
    ref: 'Institute',
    default: 0
  },
  dept_id: {
    type: Number,
    ref: 'Department',
    default: 0
  },
  role_id: {
    type: Number,
    default: 3,
    ref: 'Role'
  },
  user_type: {
    type: String,
    enum: ['admin', 'staff', 'candidate'],
    default: 'staff'
  },
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    default: null
  },
  user_status: {
    type: Number,
    default: 1 // 1 = Active, 0 = Inactive
  },
  pass_flag: {
    type: Number,
    default: 0
  },
  test_mode: {
    type: Number,
    default: 1
  },
  profile: {
    firstName: {
      type: String,
      default: ''
    },
    lastName: {
      type: String,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: ''
    },
    position: {
      type: String,
      default: ''
    }
  },
  otp: String,
  otpExpires: Date,
  login_datetime: {
    type: Date
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  failed_login_attempts: {
    type: Number,
    default: 0
  },
  last_login_attempt: {
    type: Date
  },
  lock_until: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true
});

// Create indexes for improved performance
UserSchema.index({ org_id: 1 });
UserSchema.index({ inst_id: 1 });
UserSchema.index({ dept_id: 1 });

// Hash the password before saving
UserSchema.pre('save', async function(next) {
  this.updated_at = Date.now();
  
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) {
    return next();
  }
  
  // Generate a salt
  const salt = await bcrypt.genSalt(10);
  
  // Hash the password along with the new salt
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to check if a password is correct
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 