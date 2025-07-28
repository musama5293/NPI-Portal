const Candidate = require('../models/candidate.model');
const exceljs = require('exceljs');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const Job = require('../models/job.model');
const mongoose = require('mongoose');

/**
 * Helper function to clean empty ObjectId fields
 * @param {Object} data - The data object to clean
 * @returns {Object} - The cleaned data object
 */
const cleanEmptyObjectIds = (data) => {
  const objectIdFields = ['supervisor_id', 'added_by', 'updated_by', 'user_account'];
  
  // Create a copy of the data
  const cleanedData = { ...data };
  
  // Remove empty ObjectId fields
  objectIdFields.forEach(field => {
    if (cleanedData[field] === '') {
      delete cleanedData[field];
    }
  });
  
  // Handle status_history if it exists
  if (cleanedData.status_history && Array.isArray(cleanedData.status_history)) {
    cleanedData.status_history = cleanedData.status_history.map(item => {
      if (item.updated_by === '') {
        const newItem = { ...item };
        delete newItem.updated_by;
        return newItem;
      }
      return item;
    });
  }
  
  return cleanedData;
};

/**
 * Get all candidates
 * @route GET /api/candidates
 * @access Private
 */
exports.getCandidates = async (req, res) => {
  try {
    const { 
      search, 
      nationality, 
      gender, 
      status, 
      mode,
      org_id,
      inst_id,
      dept_id,
      cat_id,
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { cand_name: { $regex: search, $options: 'i' } },
        { cand_cnic_no: { $regex: search, $options: 'i' } },
        { cand_email: { $regex: search, $options: 'i' } },
        { cand_mobile_no: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by nationality
    if (nationality) {
      query.cand_nationality = Number(nationality);
    }
    
    // Filter by gender
    if (gender) {
      query.cand_gender = gender;
    }
    
    // Filter by status
    if (status !== undefined) {
      query.cand_status = Number(status);
    }
    
    // Filter by mode
    if (mode) {
      query.cand_mode = mode;
    }
    
    // Filter by organization
    if (org_id) {
      query.org_id = Number(org_id);
    }
    
    // Filter by institute
    if (inst_id) {
      query.inst_id = Number(inst_id);
    }
    
    // Filter by department
    if (dept_id) {
      query.dept_id = Number(dept_id);
    }
    
    // Filter by category
    if (cat_id) {
      query.cat_id = Number(cat_id);
    }
    
    // Count total records
    const total = await Candidate.countDocuments(query);
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get records
    const candidates = await Candidate.find(query)
      .sort({ added_on: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    // Manually populate references using numeric IDs
    // Get organizations, institutes, departments, and categories
    const Organization = require('../models/organization.model');
    const Institute = require('../models/institute.model');
    const Department = require('../models/department.model');
    const Category = require('../models/category.model');
    
    // Get distinct org_ids, inst_ids, dept_ids, cat_ids from filtered candidates
    const orgIds = [...new Set(candidates.map(c => c.org_id).filter(id => id))];
    const instIds = [...new Set(candidates.map(c => c.inst_id).filter(id => id))];
    const deptIds = [...new Set(candidates.map(c => c.dept_id).filter(id => id))];
    const catIds = [...new Set(candidates.map(c => c.cat_id).filter(id => id))];
    
    // Fetch related data
    const [organizations, institutes, departments, categories] = await Promise.all([
      Organization.find({ org_id: { $in: orgIds } }).lean(),
      Institute.find({ inst_id: { $in: instIds } }).lean(),
      Department.find({ dept_id: { $in: deptIds } }).lean(),
      Category.find({ cat_id: { $in: catIds } }).lean()
    ]);
    
    // Create lookup maps
    const orgMap = new Map(organizations.map(org => [org.org_id, org]));
    const instMap = new Map(institutes.map(inst => [inst.inst_id, inst]));
    const deptMap = new Map(departments.map(dept => [dept.dept_id, dept]));
    const catMap = new Map(categories.map(cat => [cat.cat_id, cat]));
    
    // Populate the candidates with the related data
    const populatedCandidates = candidates.map(candidate => {
      const candidateObj = candidate.toObject();
      
      if (candidate.org_id && orgMap.has(candidate.org_id)) {
        candidateObj.org_id = {
          _id: orgMap.get(candidate.org_id)._id,
          org_id: candidate.org_id,
          org_name: orgMap.get(candidate.org_id).org_name
        };
      }
      
      if (candidate.inst_id && instMap.has(candidate.inst_id)) {
        candidateObj.inst_id = {
          _id: instMap.get(candidate.inst_id)._id,
          inst_id: candidate.inst_id,
          inst_name: instMap.get(candidate.inst_id).inst_name
        };
      }
      
      if (candidate.dept_id && deptMap.has(candidate.dept_id)) {
        candidateObj.dept_id = {
          _id: deptMap.get(candidate.dept_id)._id,
          dept_id: candidate.dept_id,
          dept_name: deptMap.get(candidate.dept_id).dept_name
        };
      }
      
      if (candidate.cat_id && catMap.has(candidate.cat_id)) {
        candidateObj.cat_id = {
          _id: catMap.get(candidate.cat_id)._id,
          cat_id: candidate.cat_id,
          cat_name: catMap.get(candidate.cat_id).cat_name
        };
      }
      
      return candidateObj;
    });
    
    return res.status(200).json({
      success: true,
      count: candidates.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: populatedCandidates
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get single candidate
 * @route GET /api/candidates/:id
 * @access Private
 */
exports.getCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Manually populate references using numeric IDs
    const Organization = require('../models/organization.model');
    const Institute = require('../models/institute.model');
    const Department = require('../models/department.model');
    const Category = require('../models/category.model');
    
    // Fetch related data if IDs exist
    const [organization, institute, department, category] = await Promise.all([
      candidate.org_id ? Organization.findOne({ org_id: candidate.org_id }).lean() : null,
      candidate.inst_id ? Institute.findOne({ inst_id: candidate.inst_id }).lean() : null,
      candidate.dept_id ? Department.findOne({ dept_id: candidate.dept_id }).lean() : null,
      candidate.cat_id ? Category.findOne({ cat_id: candidate.cat_id }).lean() : null
    ]);
    
    // Convert to object and populate manually
    const candidateObj = candidate.toObject();
    
    if (organization) {
      candidateObj.org_id = {
        _id: organization._id,
        org_id: candidate.org_id,
        org_name: organization.org_name
      };
    }
    
    if (institute) {
      candidateObj.inst_id = {
        _id: institute._id,
        inst_id: candidate.inst_id,
        inst_name: institute.inst_name
      };
    }
    
    if (department) {
      candidateObj.dept_id = {
        _id: department._id,
        dept_id: candidate.dept_id,
        dept_name: department.dept_name
      };
    }
    
    if (category) {
      candidateObj.cat_id = {
        _id: category._id,
        cat_id: candidate.cat_id,
        cat_name: category.cat_name
      };
    }
    
    return res.status(200).json({
      success: true,
      data: candidateObj
    });
  } catch (error) {
    console.error(error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Validate job vacancy before assigning candidate
 * @param {Number} jobId - The job ID to validate
 * @param {String} currentCandidateId - Optional current candidate ID (for updates)
 * @returns {Promise<boolean>} - Whether the vacancy is available
 */
const validateJobVacancy = async (jobId, currentCandidateId = null) => {
  if (!jobId) return true; // If no job ID, no validation needed
  
  try {
    // Get the job
    const job = await Job.findOne({ job_id: jobId });
    if (!job) return false; // Job not found
    
    // If job has unlimited vacancies (0) or no vacancy count specified
    if (!job.vacancy_count) return true;
    
    // Count current candidates assigned to this job
    const Candidate = require('../models/candidate.model');
    
    // Query to count candidates with this job, excluding the current candidate (for updates)
    const query = { 
      $or: [
        { job_id: jobId },
        { applied_job_id: jobId },
        { current_job_id: jobId }
      ]
    };
    
    // For updates, exclude the current candidate
    if (currentCandidateId) {
      query._id = { $ne: currentCandidateId };
    }
    
    const assignedCount = await Candidate.countDocuments(query);
    
    // Check if adding one more would exceed vacancy count
    return assignedCount < job.vacancy_count;
  } catch (error) {
    console.error('Error validating job vacancy:', error);
    return false;
  }
};

/**
 * Create a candidate
 * @route POST /api/candidates
 * @access Private
 */
exports.createCandidate = async (req, res) => {
  try {
    // Validate job vacancies if job_id, applied_job_id, or current_job_id is provided
    const { job_id, applied_job_id, current_job_id } = req.body;
    
    // Check each job field for vacancy
    if (job_id && !(await validateJobVacancy(job_id))) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign candidate to job ID ${job_id}. Maximum vacancy limit reached.`
      });
    }
    
    if (applied_job_id && !(await validateJobVacancy(applied_job_id))) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign candidate to applied job ID ${applied_job_id}. Maximum vacancy limit reached.`
      });
    }
    
    if (current_job_id && !(await validateJobVacancy(current_job_id))) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign candidate to current job ID ${current_job_id}. Maximum vacancy limit reached.`
      });
    }
    
    // Check if CNIC already exists
    const cnicExists = await Candidate.findOne({ cand_cnic_no: req.body.cand_cnic_no });
    
    if (cnicExists) {
      return res.status(400).json({
        success: false,
        message: 'A candidate with this CNIC already exists'
      });
    }
    
    // Handle empty gender value (convert to null)
    if (req.body.cand_gender === '') {
      req.body.cand_gender = null;
    }
    
    // Handle empty supervisor_id (remove the field if it's empty)
    if (req.body.supervisor_id === '') {
      delete req.body.supervisor_id;
    }
    
    // Set the added_by field to the current user
    req.body.added_by = req.user.id;
    
    // Clean empty ObjectId fields
    const cleanedData = cleanEmptyObjectIds(req.body);
    
    const candidate = await Candidate.create(cleanedData);
    
    // Create a user account for the candidate
    // Generate a username based on the candidate's name (first initial + last name)
    const nameParts = req.body.cand_name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    
    // Ensure username meets minimum length requirement (4 characters)
    let username = (firstName.charAt(0) + lastName).toLowerCase().replace(/\s/g, '');
    if (username.length < 4) {
      // If username is too short, use more of the first name
      username = (firstName + lastName).toLowerCase().replace(/\s/g, '');
      // If still too short, add the candidate's initials repeated
      if (username.length < 4) {
        const initials = firstName.charAt(0).toLowerCase();
        username = username + initials.repeat(4 - username.length);
      }
    }
    
    // Check if username already exists and append numbers if needed
    let usernameExists = true;
    let counter = 1;
    let originalUsername = username;
    
    while (usernameExists) {
      const existingUser = await User.findOne({ username });
      if (!existingUser) {
        usernameExists = false;
      } else {
        username = `${originalUsername}${counter}`;
        counter++;
      }
    }
    
    // Generate a password (standardize the CNIC by removing all non-alphanumeric characters)
    let initialPassword = req.body.cand_cnic_no.replace(/[^a-zA-Z0-9]/g, '');
    
    // For simpler testing, we'll use the last 6 digits of CNIC with a prefix
    // This makes passwords easier to remember and enter
    if (initialPassword.length >= 6) {
      const last6 = initialPassword.slice(-6);
      initialPassword = `cand${last6}`;
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(initialPassword, salt);
    
   
    // Set user email address
    let email = req.body.cand_email || `${username}@temp.npiadmin.com`;
    
    // Check if email already exists and generate a unique one if needed
    let emailExists = true;
    let emailCounter = 1;
    let originalEmail = email;
    
    while (emailExists) {
      const existingEmail = await User.findOne({ email });
      if (!existingEmail) {
        emailExists = false;
      } else {
        // Create a unique email by adding a counter
        const emailParts = originalEmail.split('@');
        email = `${emailParts[0]}${emailCounter}@${emailParts[1]}`;
        emailCounter++;
      }
    }
    
    // Create the user account
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      mobile_no: req.body.cand_mobile_no || '0000000000',
      org_id: req.body.org_id || 1000,
      inst_id: req.body.inst_id || 0,
      dept_id: req.body.dept_id || 0,
      role_id: 4, // Candidate role
      user_type: 'candidate',
      candidate_id: candidate._id,
      user_status: 1
    });
    
    // Update the candidate with the user account reference
    await Candidate.findByIdAndUpdate(
      candidate._id,
      { user_account: user._id },
      { new: true }
    );
    
    // Send notification to admins and email to candidate
    try {
      const User = require('../models/user.model');
      const NotificationHelper = require('../services/notificationHelper');
      
      const io = req.app.get('io');
      const notificationHelper = new NotificationHelper(io);
      
      // Get admin users for notification
      const adminUsers = await User.find({ role_id: 1 });
      
      // Send notifications to admins and welcome email to candidate
      await notificationHelper.notifyCandidateRegistration(
        candidate.toObject(), 
        adminUsers, 
        { username, password: initialPassword, email }
      );
      
      console.log(`Candidate registration notifications sent for ${candidate.cand_name}`);
    } catch (notificationError) {
      console.error('Error sending candidate registration notifications:', notificationError);
      // Don't fail the registration if notification fails
    }
    
    return res.status(201).json({
      success: true,
      message: 'Candidate created successfully',
      data: candidate,
      credentials: {
        username,
        password: initialPassword,
        email
      }
    });
  } catch (error) {
    console.error(error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Update a candidate
 * @route PUT /api/candidates/:id
 * @access Private
 */
exports.updateCandidate = async (req, res) => {
  try {
    const candidateId = req.params.id;
    
    // Get the candidate
    const existingCandidate = await Candidate.findById(candidateId);
    if (!existingCandidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Make a copy of the request body for modifications
    const updateData = { ...req.body };
    
    // Ensure probation_end_date is properly handled
    if (updateData.candidate_type === 'probation' && !updateData.probation_end_date) {
      // If it's a probation candidate but no end date provided, preserve existing date
      updateData.probation_end_date = existingCandidate.probation_end_date;
    }
    
    // Handle empty supervisor_id (remove the field if it's empty)
    if (updateData.supervisor_id === '') {
      delete updateData.supervisor_id;
    }
    
    // Clean empty ObjectId fields
    const cleanedData = cleanEmptyObjectIds(updateData);
    
    // Validate job vacancies if job_id, applied_job_id, or current_job_id is changing
    const { job_id, applied_job_id, current_job_id } = cleanedData;
    
    // Check each job field for vacancy if it's different from current value
    if (job_id && job_id !== existingCandidate.job_id && !(await validateJobVacancy(job_id, candidateId))) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign candidate to job ID ${job_id}. Maximum vacancy limit reached.`
      });
    }
    
    if (applied_job_id && applied_job_id !== existingCandidate.applied_job_id && 
        !(await validateJobVacancy(applied_job_id, candidateId))) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign candidate to applied job ID ${applied_job_id}. Maximum vacancy limit reached.`
      });
    }
    
    if (current_job_id && current_job_id !== existingCandidate.current_job_id && 
        !(await validateJobVacancy(current_job_id, candidateId))) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign candidate to current job ID ${current_job_id}. Maximum vacancy limit reached.`
      });
    }
    
    // Check if CNIC is already in use by another candidate
    if (cleanedData.cand_cnic_no && cleanedData.cand_cnic_no !== existingCandidate.cand_cnic_no) {
      const cnicExists = await Candidate.findOne({ 
        cand_cnic_no: cleanedData.cand_cnic_no,
        _id: { $ne: req.params.id }
      });
      
      if (cnicExists) {
        return res.status(400).json({
          success: false,
          message: 'A candidate with this CNIC already exists'
        });
      }
    }
    
    // Handle empty gender value (convert to null)
    if (cleanedData.cand_gender === '') {
      cleanedData.cand_gender = null;
    }
    
    // Set update metadata
    cleanedData.updated_by = req.user.id;
    cleanedData.updated_on = Date.now();
    
    // Add debugging for probation data
    console.log('Candidate update - Probation data:', {
      type: cleanedData.candidate_type,
      endDate: cleanedData.probation_end_date,
      originalEndDate: existingCandidate.probation_end_date
    });
    
    // Update candidate
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      cleanedData,
      { new: true, runValidators: true }
    );

    // If this candidate has a linked user account, update relevant user information
    if (updatedCandidate.user_account) {
      try {
        // Find the linked user
        const linkedUser = await User.findById(updatedCandidate.user_account);
        
        if (linkedUser) {
          // Update key fields that should be synchronized
          const userUpdates = {
            email: updatedCandidate.cand_email,
            mobile_no: updatedCandidate.cand_mobile_no || linkedUser.mobile_no,
            org_id: updatedCandidate.org_id || 1000,
            inst_id: updatedCandidate.inst_id || 0,
            dept_id: updatedCandidate.dept_id || 0,
            // Status should reflect candidate status
            user_status: updatedCandidate.cand_status
          };
          
          // Update the user
          await User.findByIdAndUpdate(
            linkedUser._id,
            userUpdates,
            { new: false }
          );
          
          console.log(`Updated linked user ${linkedUser._id} for candidate ${updatedCandidate._id}`);
        }
      } catch (userUpdateError) {
        console.error('Error updating linked user account:', userUpdateError);
        // We don't fail the request if user update fails
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Candidate updated successfully',
      data: updatedCandidate
    });
  } catch (error) {
    console.error(error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Delete a candidate
 * @route DELETE /api/candidates/:id
 * @access Private
 */
exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Handle linked user account
    if (candidate.user_account) {
      try {
        const linkedUser = await User.findById(candidate.user_account);
        
        if (linkedUser) {
          // Option 1: Update the user to reflect that candidate is deleted
          await User.findByIdAndUpdate(linkedUser._id, {
            candidate_id: null,
            user_type: 'staff', // Convert to regular staff
            role_id: 2, // Default to staff role
          });
          
          // Option 2: Delete the user account (uncomment if needed)
          // await User.findByIdAndDelete(linkedUser._id);
          // console.log(`Deleted linked user ${linkedUser._id} for candidate ${candidate._id}`);
          
          console.log(`Updated linked user ${linkedUser._id} for deleted candidate ${candidate._id}`);
        }
      } catch (userError) {
        console.error('Error handling linked user during candidate deletion:', userError);
        // Don't stop the candidate deletion if user update fails
      }
    }
    
    await Candidate.findByIdAndDelete(req.params.id);
    
    return res.status(200).json({
      success: true,
      message: 'Candidate deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error(error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Export candidates to Excel
 * @route GET /api/candidates/export
 * @access Private
 */
exports.exportCandidates = async (req, res) => {
  try {
    const { nationality, gender, status, mode, org_id, inst_id, dept_id, cat_id } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by nationality
    if (nationality) {
      query.cand_nationality = Number(nationality);
    }
    
    // Filter by gender
    if (gender) {
      query.cand_gender = gender;
    }
    
    // Filter by status
    if (status !== undefined) {
      query.cand_status = Number(status);
    }
    
    // Filter by mode
    if (mode) {
      query.cand_mode = mode;
    }
    
    // Filter by organization
    if (org_id) {
      query.org_id = Number(org_id);
    }
    
    // Filter by institute
    if (inst_id) {
      query.inst_id = Number(inst_id);
    }
    
    // Filter by department
    if (dept_id) {
      query.dept_id = Number(dept_id);
    }
    
    // Filter by category
    if (cat_id) {
      query.cat_id = Number(cat_id);
    }
    
    // Get all candidates matching the query
    const candidates = await Candidate.find(query)
      .sort({ added_on: -1 });
    
    // Manually populate references using numeric IDs
    const Organization = require('../models/organization.model');
    const Institute = require('../models/institute.model');
    const Department = require('../models/department.model');
    
    // Get distinct org_ids, inst_ids, dept_ids from filtered candidates
    const orgIds = [...new Set(candidates.map(c => c.org_id).filter(id => id))];
    const instIds = [...new Set(candidates.map(c => c.inst_id).filter(id => id))];
    const deptIds = [...new Set(candidates.map(c => c.dept_id).filter(id => id))];
    
    // Fetch related data
    const [organizations, institutes, departments] = await Promise.all([
      Organization.find({ org_id: { $in: orgIds } }).lean(),
      Institute.find({ inst_id: { $in: instIds } }).lean(),
      Department.find({ dept_id: { $in: deptIds } }).lean()
    ]);
    
    // Create lookup maps
    const orgMap = new Map(organizations.map(org => [org.org_id, org]));
    const instMap = new Map(institutes.map(inst => [inst.inst_id, inst]));
    const deptMap = new Map(departments.map(dept => [dept.dept_id, dept]));
    
    // Create Excel workbook and worksheet
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Candidates');
    
    // Define columns
    worksheet.columns = [
      { header: 'Name', key: 'cand_name', width: 30 },
      { header: 'CNIC', key: 'cand_cnic_no', width: 20 },
      { header: 'Mobile', key: 'cand_mobile_no', width: 15 },
      { header: 'WhatsApp', key: 'cand_whatsapp_no', width: 15 },
      { header: 'Email', key: 'cand_email', width: 30 },
      { header: 'Gender', key: 'cand_gender', width: 10 },
      { header: 'Organization', key: 'organization', width: 20 },
      { header: 'Institute', key: 'institute', width: 20 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Nationality', key: 'nationality', width: 15 },
      { header: 'Mode', key: 'cand_mode', width: 10 },
      { header: 'Status', key: 'status', width: 10 }
    ];
    
    // Add rows
    candidates.forEach(candidate => {
      const nationality = candidate.cand_nationality === 1 ? 'Pakistani' : 
                        candidate.cand_nationality === 2 ? 'Overseas Pakistani' : 
                        candidate.cand_nationality === 3 ? 'Foreign' : 'Unknown';
      
      const status = candidate.cand_status === 1 ? 'Active' : 'Inactive';
      
      worksheet.addRow({
        cand_name: candidate.cand_name,
        cand_cnic_no: candidate.cand_cnic_no,
        cand_mobile_no: candidate.cand_mobile_no,
        cand_whatsapp_no: candidate.cand_whatsapp_no,
        cand_email: candidate.cand_email,
        cand_gender: candidate.cand_gender,
        organization: orgMap.get(candidate.org_id)?.org_name || '',
        institute: instMap.get(candidate.inst_id)?.inst_name || '',
        department: deptMap.get(candidate.dept_id)?.dept_name || '',
        nationality,
        cand_mode: candidate.cand_mode,
        status
      });
    });
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=candidates.xlsx');
    
    // Write to response
    await workbook.xlsx.write(res);
    
    // End response
    res.end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Import candidates from Excel
 * @route POST /api/candidates/import
 * @access Private
 */
exports.importCandidates = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file'
      });
    }
    
    // Load organizations, institutes, and departments for reference lookup
    const Organization = require('../models/organization.model');
    const Institute = require('../models/institute.model');
    const Department = require('../models/department.model');
    
    const organizations = await Organization.find({}, 'org_id org_name');
    const institutes = await Institute.find({}, 'inst_id inst_name');
    const departments = await Department.find({}, 'dept_id dept_name');
    
    // Create lookup maps by name (case insensitive)
    const orgMap = new Map(organizations.map(org => [org.org_name.toLowerCase(), org.org_id]));
    const instMap = new Map(institutes.map(inst => [inst.inst_name.toLowerCase(), inst.inst_id]));
    const deptMap = new Map(departments.map(dept => [dept.dept_name.toLowerCase(), dept.dept_id]));
    
    // Read Excel file
    const workbook = new exceljs.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    
    const worksheet = workbook.getWorksheet(1);
    
    if (!worksheet) {
      return res.status(400).json({
        success: false,
        message: 'Worksheet not found in the Excel file'
      });
    }
    
    const rows = [];
    
    // Read rows
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber !== 1) { // Skip header row
        const rowData = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          // Map columns to candidate fields
          switch (colNumber) {
            case 1:
              rowData.cand_name = cell.value;
              break;
            case 2:
              rowData.cand_cnic_no = cell.value ? String(cell.value) : '';
              break;
            case 3:
              rowData.cand_mobile_no = cell.value ? String(cell.value) : null;
              break;
            case 4:
              rowData.cand_whatsapp_no = cell.value ? String(cell.value) : '';
              break;
            case 5:
              rowData.cand_email = cell.value || null;
              break;
            case 6:
              rowData.cand_gender = cell.value || null;
              break;
            case 7:
              // Organization lookup
              if (cell.value) {
                const orgName = String(cell.value).toLowerCase();
                rowData.org_id = orgMap.get(orgName) || 1000; // Default to 1000 if not found
              } else {
                rowData.org_id = 1000; // Default org_id
              }
              break;
            case 8:
              // Institute lookup
              if (cell.value) {
                const instName = String(cell.value).toLowerCase();
                rowData.inst_id = instMap.get(instName) || 0; // Default to 0 if not found
              } else {
                rowData.inst_id = 0; // Default inst_id
              }
              break;
            case 9:
              // Department lookup
              if (cell.value) {
                const deptName = String(cell.value).toLowerCase();
                rowData.dept_id = deptMap.get(deptName) || 0; // Default to 0 if not found
              } else {
                rowData.dept_id = 0; // Default dept_id
              }
              break;
            case 10:
              // Nationality
              if (cell.value) {
                const nationalityValue = String(cell.value).toLowerCase();
                if (nationalityValue.includes('pakistan')) {
                  if (nationalityValue.includes('overseas')) {
                    rowData.cand_nationality = 2; // Overseas Pakistani
                  } else {
                    rowData.cand_nationality = 1; // Pakistani
                  }
                } else if (nationalityValue.includes('foreign')) {
                  rowData.cand_nationality = 3; // Foreign
                } else {
                  rowData.cand_nationality = 1; // Default to Pakistani
                }
              } else {
                rowData.cand_nationality = 1; // Default nationality
              }
              break;
            case 11:
              // Mode
              rowData.cand_mode = cell.value || 'R'; // Default to 'R'
              break;
            case 12:
              // Status
              if (cell.value) {
                const statusValue = String(cell.value).toLowerCase();
                rowData.cand_status = statusValue.includes('active') ? 1 : 0;
              } else {
                rowData.cand_status = 1; // Default to active
              }
              break;
          }
        });
        
        // Add metadata
        rowData.added_by = req.user.id;
        rowData.added_on = Date.now();
        
        // Only add row if name and CNIC are provided
        if (rowData.cand_name && rowData.cand_cnic_no) {
          rows.push(rowData);
        }
      }
    });
    
    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid candidate data found in the Excel file'
      });
    }
    
    // Insert candidates
    const result = await Candidate.insertMany(rows, { ordered: false });
    
    return res.status(201).json({
      success: true,
      message: `${result.length} candidates imported successfully`,
      count: result.length
    });
  } catch (error) {
    console.error(error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Some candidates could not be imported due to duplicate CNIC numbers'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error importing candidates',
      error: error.message
    });
  }
};

/**
 * Assign supervisor to candidates
 * @route POST /api/candidates/assign-supervisor
 * @access Private
 */
exports.assignSupervisor = async (req, res) => {
  try {
    const { candidateIds, supervisorId } = req.body;
    
    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of candidate IDs'
      });
    }
    
    if (!supervisorId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a supervisor ID'
      });
    }
    
    // Update all candidates with the supervisor ID
    const updatePromises = candidateIds.map(candidateId => 
      Candidate.findByIdAndUpdate(
        candidateId,
        { 
          supervisor_id: supervisorId,
          updated_by: req.user.id,
          updated_on: Date.now()
        },
        { new: true }
      )
    );
    
    const results = await Promise.all(updatePromises);
    
    return res.status(200).json({
      success: true,
      message: `Successfully assigned supervisor to ${results.length} candidate(s)`,
      data: results
    });
  } catch (error) {
    console.error('Failed to assign supervisor:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 