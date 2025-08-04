const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Role = require('../models/role.model');
const ExcelJS = require('exceljs');
const Organization = require('../models/organization.model');
const Institute = require('../models/institute.model');
const Department = require('../models/department.model');
const Candidate = require('../models/candidate.model');
const Job = require('../models/job.model');

/**
 * Get all users
 * @route GET /api/users
 * @access Private (Admin)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -otp -otp_expiration');
    
    // Get all roles for role name mapping
    const roles = await Role.find();
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.role_id] = role.role_name;
    });
    
    // Append role_name to each user for display purposes
    const enhancedUsers = users.map(user => {
      const userObj = user.toObject();
      userObj.role_name = roleMap[user.role_id] || 'Unknown';
      return userObj;
    });
    
    return res.status(200).json({
      success: true,
      count: users.length,
      data: enhancedUsers
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: error.message
    });
  }
};

/**
 * Get single user
 * @route GET /api/users/:id
 * @access Private (Admin or Same User)
 */
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -otp -otp_expiration');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check permission access types
    const isSameUser = req.user.id === req.params.id;
    const isAdmin = req.user.role_id === 1;
    
    // Check if the user has can_view_users permission regardless of role
    let hasViewUsersPermission = false;
    
    // Get the user's permissions if they exist
    if (req.user.permissions && Array.isArray(req.user.permissions)) {
      hasViewUsersPermission = req.user.permissions.includes('can_view_users');
    }
    
    // For supervisors, check if they need access to candidate data
    let isSupervisorWithAccess = false;
    if (req.user.role_id === 3) {
      // Supervisors should access candidate data of those they supervise
      isSupervisorWithAccess = true;
    }
    
    // Allow access if any of these conditions are true
    if (!isSameUser && !isAdmin && !isSupervisorWithAccess && !hasViewUsersPermission) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user'
      });
    }
    
    // Get organization, institute, department and role data
    const [organization, institute, department, role] = await Promise.all([
      user.org_id ? Organization.findOne({ org_id: user.org_id }) : null,
      user.inst_id ? Institute.findOne({ inst_id: user.inst_id }) : null,
      user.dept_id ? Department.findOne({ dept_id: user.dept_id }) : null,
      user.role_id ? Role.findOne({ role_id: user.role_id }) : null
    ]);
    
    const userObj = user.toObject();
    
    // Add populated data
    if (organization) {
      userObj.organization = {
        org_id: organization.org_id,
        org_name: organization.org_name
      };
    }
    
    if (institute) {
      userObj.institute = {
        inst_id: institute.inst_id,
        inst_name: institute.inst_name
      };
    }
    
    if (department) {
      userObj.department = {
        dept_id: department.dept_id,
        dept_name: department.dept_name
      };
    }
    
    if (role) {
      userObj.role = {
        role_id: role.role_id,
        role_name: role.role_name
      };
    }
    
    // If the user is a candidate, fetch candidate information
    if (user.role_id === 4 && user.candidate_id) {
      const candidateInfo = await Candidate.findById(user.candidate_id);
      if (candidateInfo) {
        userObj.candidate_info = candidateInfo;
      }
    }
    
    console.log('Get user with ID:', req.params.id, 'Data:', {
      org_id: user.org_id,
      inst_id: user.inst_id,
      dept_id: user.dept_id
    });
    
    return res.status(200).json({
      success: true,
      data: userObj
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving user',
      error: error.message
    });
  }
};

/**
 * Create user
 * @route POST /api/users
 * @access Private (Admin)
 */
exports.createUser = async (req, res) => {
  try {
    let { 
      username, // May come from client, or we generate it
      email, 
      password, 
      mobile_no, 
      org_id, 
      inst_id,
      dept_id,
      role_id, 
      user_status,
      user_type,
      profile,
      candidate_data
    } = req.body;

    // Ensure profile exists and has firstName
    if (!profile || !profile.firstName) {
      return res.status(400).json({
        success: false,
        message: 'First name is required in profile data.'
      });
    }

    // For candidate users (role_id = 4), check if provided password is valid
    if (role_id === 4) {
      // If no password provided or password too short, use the default
      if (!password || password.length < 6) {
        password = "Test@123"; // Default password but don't log it
      }
      // Otherwise use the provided password (no additional logging)
    } 
    // For non-candidate users, validate the password
    else if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Generate username if not provided or if we want to enforce server-side generation
    if (!username) {
      username = profile.firstName.toLowerCase();
      if (profile.lastName) {
        username += '.' + profile.lastName.toLowerCase();
      }
      // Ensure username uniqueness - append number if conflict
      let tempUsername = username;
      let counter = 0;
      let userExists = await User.findOne({ username: tempUsername });
      while(userExists) {
        counter++;
        tempUsername = `${username}${counter}`;
        userExists = await User.findOne({ username: tempUsername });
      }
      username = tempUsername;
    } else {
      // If username is provided from client, still check for uniqueness
      const userExists = await User.findOne({ username });
    if (userExists) {
        return res.status(400).json({
          success: false,
          message: `Username '${username}' already exists. The client should attempt to send a unique one or omit it for server generation.`
        });
      }
    }
    
    // Check if user already exists by email
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // DO NOT pre-hash the password - let the model's pre-save hook do it
    // This should resolve any issues with password handling
    
    // Set default organization values based on role
    let defaultOrgId = org_id || 1000;
    let defaultInstId = inst_id || null;
    let defaultDeptId = dept_id || null;
    
    // For admin users, set specific defaults (NUST, SEECS, LMS)
    if (role_id === 1) {
      // Get the org_id for NUST
      const nustOrg = await Organization.findOne({ org_name: 'NUST' });
      if (nustOrg) defaultOrgId = nustOrg.org_id;
      
      // Get the inst_id for SEECS
      const seecsInst = await Institute.findOne({ inst_name: 'SEECS' });
      if (seecsInst) defaultInstId = seecsInst.inst_id;
      
      // Get the dept_id for LMS
      const lmsDept = await Department.findOne({ dept_name: 'LMS' });
      if (lmsDept) defaultDeptId = lmsDept.dept_id;
    }

    // Determine if this will be a candidate user
    const isCandidate = role_id === 4;
    const userTypeValue = user_type || (isCandidate ? 'candidate' : 'staff');
    
    // Create user - pass the plain password and let mongoose handle the hashing
    const user = await User.create({
      username, // Use the generated or validated unique username
      email,
      password, // Plain password - will be hashed by the pre-save hook
      mobile_no,
      org_id: defaultOrgId,
      inst_id: defaultInstId,
      dept_id: defaultDeptId,
      role_id: role_id || 2,
      user_status: user_status || 1,
      user_type: userTypeValue,
      profile: profile || {},
      pass_flag: 0,
      candidate_id: null
    });

    // If this is a candidate user, create a candidate record
    if (isCandidate) {
      if (!candidate_data || !candidate_data.cand_cnic_no) {
        await User.findByIdAndDelete(user._id); // Rollback user creation
        return res.status(400).json({ success: false, message: 'CNIC is required for candidate users.' });
      }
      try {
        const candidatePayload = {
          cand_name: candidate_data.cand_name || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || username,
          cand_cnic_no: candidate_data.cand_cnic_no,
          cand_email: email,
          cand_mobile_no: mobile_no,
          cand_gender: candidate_data.cand_gender || null,
          cand_nationality: candidate_data.cand_nationality || 1,
          cand_mode: candidate_data.cand_mode || 'R',
          candidate_type: candidate_data.candidate_type || 'initial',
          probation_end_date: candidate_data.candidate_type === 'probation' && candidate_data.probation_end_date ? candidate_data.probation_end_date : null,
          cand_status: candidate_data.cand_status !== undefined ? candidate_data.cand_status : 1,
          cand_whatsapp_no: candidate_data.cand_whatsapp_no || '',
          org_id: defaultOrgId,
          inst_id: defaultInstId,
          dept_id: defaultDeptId,
          applied_job_id: candidate_data.applied_job_id || null,
          current_job_id: candidate_data.current_job_id || null,
          hiring_status: candidate_data.hiring_status || 'applied',
          supervisor_id: candidate_data.supervisor_id || null,
          cat_id: candidate_data.cat_id || 0,
          user_account: user._id,
          added_by: req.user.id, // Assuming req.user is populated by auth middleware
        };
        const candidate = await Candidate.create(candidatePayload);
        user.candidate_id = candidate._id;
        await user.save();
      } catch (candidateError) {
        await User.findByIdAndDelete(user._id); // Rollback
        console.error('Failed to create candidate record:', candidateError);
        return res.status(500).json({ success: false, message: 'User created, but failed to create candidate record.', error: candidateError.message });
      }
    }
    
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user_id: user._id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
        user_status: user.user_status,
        org_id: user.org_id,
        inst_id: user.inst_id,
        dept_id: user.dept_id,
        candidate_id: user.candidate_id
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ success: false, message: 'Error creating user', error: error.message });
  }
};

/**
 * Update user
 * @route PUT /api/users/:id
 * @access Private (Admin or Same User)
 */
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { 
      username, email, mobile_no, org_id, inst_id, dept_id, 
      role_id, user_status, profile, candidate_data 
    } = req.body;

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (req.user.id !== userId && req.user.role_id !== 1) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this user' });
    }

    const oldRoleId = user.role_id;
    const newRoleId = role_id !== undefined ? Number(role_id) : oldRoleId;

    // Prepare user update object
    const userUpdateData = {};
    if (username && req.user.role_id === 1) userUpdateData.username = username; // Username only updatable by admin and if provided
    if (email) userUpdateData.email = email;
    if (mobile_no) userUpdateData.mobile_no = mobile_no;
    if (profile) userUpdateData.profile = { ...user.profile, ...profile };
    if (org_id !== undefined) userUpdateData.org_id = Number(org_id) || null;
    if (inst_id !== undefined) userUpdateData.inst_id = Number(inst_id) || null;
    if (dept_id !== undefined) userUpdateData.dept_id = Number(dept_id) || null;
    if (user_status !== undefined) userUpdateData.user_status = user_status;
    if (role_id !== undefined) userUpdateData.role_id = newRoleId;

    // Update user_type based on role
    if (newRoleId === 4) {
      userUpdateData.user_type = 'candidate';
    } else if (oldRoleId === 4 && newRoleId !== 4) {
      userUpdateData.user_type = 'staff'; // Revert to staff if role changed from candidate
    }

    Object.assign(user, userUpdateData);

    // Role change logic for candidates
    if (oldRoleId !== newRoleId) {
      if (newRoleId === 4) { // Changed TO Candidate
        if (!candidate_data || !candidate_data.cand_cnic_no) {
           return res.status(400).json({ success: false, message: 'CNIC is required for candidate users.' });
        }
        try {
          let existingCandidate = user.candidate_id ? await Candidate.findById(user.candidate_id) : null;
          const candidatePayload = {
            cand_name: candidate_data.cand_name || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.username,
            cand_cnic_no: candidate_data.cand_cnic_no,
            cand_email: user.email,
            cand_mobile_no: user.mobile_no,
            cand_gender: candidate_data.cand_gender || null,
            cand_nationality: candidate_data.cand_nationality || 1,
            cand_mode: candidate_data.cand_mode || 'R',
            candidate_type: candidate_data.candidate_type || 'initial',
            probation_end_date: candidate_data.candidate_type === 'probation' && candidate_data.probation_end_date ? candidate_data.probation_end_date : null,
            cand_status: candidate_data.cand_status !== undefined ? candidate_data.cand_status : 1,
            cand_whatsapp_no: candidate_data.cand_whatsapp_no || '',
            org_id: user.org_id,
            inst_id: user.inst_id,
            dept_id: user.dept_id,
            applied_job_id: candidate_data.applied_job_id || null,
            current_job_id: candidate_data.current_job_id || null,
            hiring_status: candidate_data.hiring_status || 'applied',
            supervisor_id: candidate_data.supervisor_id || null,
            cat_id: candidate_data.cat_id || 0,
            user_account: user._id,
            updated_by: req.user.id,
            updated_on: Date.now()
          };
          if (existingCandidate) {
            Object.assign(existingCandidate, candidatePayload);
            await existingCandidate.save();
            user.candidate_id = existingCandidate._id; 
          } else {
            const newCandidate = await Candidate.create(candidatePayload);
            user.candidate_id = newCandidate._id;
          }
        } catch (err) {
          console.error('Error creating/updating candidate for user:', err);
          return res.status(500).json({ success: false, message: 'Error processing candidate information.', error: err.message });
        }
      } else if (oldRoleId === 4 && newRoleId !== 4) { // Changed FROM Candidate
        if (user.candidate_id) {
          try {
            const candidate = await Candidate.findById(user.candidate_id);
            if (candidate) {
              // Option 1: Soft delete or mark inactive (if candidate should be preserved)
              // candidate.cand_status = 0; // Mark inactive
              // candidate.user_account = null; // Unlink
              // await candidate.save();

              // Option 2: Hard delete candidate record (if it should be removed completely)
               await Candidate.findByIdAndDelete(user.candidate_id);
               console.log(`Deleted candidate ${user.candidate_id} as user role changed.`);
            }
          } catch (err) {
            console.error('Error handling candidate on role change from candidate:', err);
          }
          user.candidate_id = null; // Unlink from user
        }
      }
    }
    
    // Update candidate data if user is/remains a candidate and candidate_data is provided
    if (newRoleId === 4 && candidate_data && user.candidate_id) {
      try {
        const candidate = await Candidate.findById(user.candidate_id);
        if (candidate) {
          const candidateUpdatePayload = {
              cand_name: candidate_data.cand_name || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.username,
              cand_cnic_no: candidate_data.cand_cnic_no || candidate.cand_cnic_no, // Keep old if not provided
              cand_email: user.email,
              cand_mobile_no: user.mobile_no,
              cand_gender: candidate_data.cand_gender !== undefined ? candidate_data.cand_gender : candidate.cand_gender,
              cand_nationality: candidate_data.cand_nationality !== undefined ? candidate_data.cand_nationality : candidate.cand_nationality,
              cand_mode: candidate_data.cand_mode !== undefined ? candidate_data.cand_mode : candidate.cand_mode,
              candidate_type: candidate_data.candidate_type !== undefined ? candidate_data.candidate_type : candidate.candidate_type,
              probation_end_date: candidate_data.candidate_type === 'probation' && candidate_data.probation_end_date ? candidate_data.probation_end_date : (candidate_data.candidate_type !== 'probation' ? null : candidate.probation_end_date),
              cand_status: candidate_data.cand_status !== undefined ? candidate_data.cand_status : candidate.cand_status,
              cand_whatsapp_no: candidate_data.cand_whatsapp_no !== undefined ? candidate_data.cand_whatsapp_no : candidate.cand_whatsapp_no,
              org_id: user.org_id,
              inst_id: user.inst_id,
              dept_id: user.dept_id,
              applied_job_id: candidate_data.applied_job_id !== undefined ? (candidate_data.applied_job_id || null) : candidate.applied_job_id,
              current_job_id: candidate_data.current_job_id !== undefined ? (candidate_data.current_job_id || null) : candidate.current_job_id,
              hiring_status: candidate_data.hiring_status !== undefined ? candidate_data.hiring_status : candidate.hiring_status,
              supervisor_id: candidate_data.supervisor_id !== undefined ? (candidate_data.supervisor_id || null) : candidate.supervisor_id,
              cat_id: candidate_data.cat_id !== undefined ? candidate_data.cat_id : candidate.cat_id,
              updated_by: req.user.id,
              updated_on: Date.now()
          };
          Object.assign(candidate, candidateUpdatePayload);
          await candidate.save();
        }
      } catch (err) {
        console.error('Error updating candidate for user:', err);
        // Decide if this should be a hard error for the user update
      }
    }

    await user.save();
    const updatedUserResponse = user.toObject();
    delete updatedUserResponse.password;

    return res.status(200).json({ success: true, message: 'User updated successfully', data: updatedUserResponse });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
};

/**
 * Update user password
 * @route PUT /api/users/:id/password
 * @access Private (Admin or Same User)
 */
exports.updatePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    // Find user with password
    const user = await User.findById(req.params.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if the requesting user is the same as the requested user or is an admin
    if (req.user.id !== req.params.id && req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }
    
    // If not admin, check current password
    if (req.user.role_id !== 1) {
      const isMatch = await bcrypt.compare(current_password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);
    
    // Update password
    user.password = hashedPassword;
    user.pass_flag = 0;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
};

/**
 * Delete user
 * @route DELETE /api/users/:id
 * @access Private (Admin)
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Only admin can delete users
    if (req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete users'
      });
    }
    
    // If the user is a candidate, delete the associated candidate record
    if (user.role_id === 4 && user.candidate_id) {
      try {
        await Candidate.findByIdAndDelete(user.candidate_id);
        console.log(`Deleted candidate ${user.candidate_id} for deleted user ${user._id}`);
      } catch (candError) {
        console.error('Error deleting candidate record during user deletion:', candError);
        // Optionally, you might want to return an error here or decide if user deletion should proceed
        // For now, we'll log the error and proceed with user deletion.
      }
    }
    
    // Use findByIdAndDelete instead of user.remove()
    await User.findByIdAndDelete(req.params.id);
    
    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

/**
 * Get user profile
 * @route GET /api/users/profile
 * @access Private
 */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otp_expiration');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get organization, institute, department and role data
    const [organization, institute, department, role] = await Promise.all([
      user.org_id ? Organization.findOne({ org_id: user.org_id }) : null,
      user.inst_id ? Institute.findOne({ inst_id: user.inst_id }) : null,
      user.dept_id ? Department.findOne({ dept_id: user.dept_id }) : null,
      user.role_id ? Role.findOne({ role_id: user.role_id }) : null
    ]);
    
    const userObj = user.toObject();
    
    // Add populated data
    if (organization) {
      userObj.organization = {
        org_id: organization.org_id,
        org_name: organization.org_name
      };
    }
    
    if (institute) {
      userObj.institute = {
        inst_id: institute.inst_id,
        inst_name: institute.inst_name
      };
    }
    
    if (department) {
      userObj.department = {
        dept_id: department.dept_id,
        dept_name: department.dept_name
      };
    }
    
    if (role) {
      userObj.role = {
        role_id: role.role_id,
        role_name: role.role_name
      };
    }
    
    // If the user is a candidate, fetch candidate information
    if (user.role_id === 4 && user.candidate_id) {
      const candidateInfo = await Candidate.findById(user.candidate_id);
      if (candidateInfo) {
        userObj.candidate_info = candidateInfo;
      }
    }
    
    res.status(200).json({
      success: true,
      data: userObj
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get all users with organization information
 */
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    
    // Get unique org, inst, and dept IDs
    const orgIds = [...new Set(users.map(user => user.org_id).filter(id => id))];
    const instIds = [...new Set(users.map(user => user.inst_id).filter(id => id))];
    const deptIds = [...new Set(users.map(user => user.dept_id).filter(id => id))];
    
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
    
    // Populate users
    const populatedUsers = users.map(user => {
      const userObj = user.toObject();
      
      // Add organization info
      if (user.org_id && orgMap.has(user.org_id)) {
        const org = orgMap.get(user.org_id);
        userObj.organization = {
          org_id: org.org_id,
          org_name: org.org_name
        };
      }
      
      // Add institute info
      if (user.inst_id && instMap.has(user.inst_id)) {
        const inst = instMap.get(user.inst_id);
        userObj.institute = {
          inst_id: inst.inst_id,
          inst_name: inst.inst_name
        };
      }
      
      // Add department info
      if (user.dept_id && deptMap.has(user.dept_id)) {
        const dept = deptMap.get(user.dept_id);
        userObj.department = {
          dept_id: dept.dept_id,
          dept_name: dept.dept_name
        };
      }
      
      return userObj;
    });
    
    return res.status(200).json({
      success: true,
      count: users.length,
      data: populatedUsers
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: error.message
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, mobile_no, currentPassword, newPassword, profile, candidate_data } = req.body;
    
    // Find user
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update basic info
    if (username) user.username = username;
    if (email) user.email = email;
    if (mobile_no) user.mobile_no = mobile_no;
    if (profile) user.profile = { ...user.profile, ...profile };
    
    // Handle password change if requested
    if (newPassword && currentPassword) {
      // Verify current password
      const isMatch = await user.matchPassword(currentPassword);
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      // Set new password
      user.password = newPassword;
    }
    
    // If this is a candidate user, update the candidate record too
    if (user.role_id === 4 && user.candidate_id) {
      try {
        const candidate = await Candidate.findById(user.candidate_id);
        if (candidate) {
          candidate.cand_name = `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.username;
          candidate.cand_email = user.email;
          candidate.cand_mobile_no = user.mobile_no;
          
          // Update candidate-specific fields if provided
          if (candidate_data) {
            if (candidate_data.cand_cnic_no) candidate.cand_cnic_no = candidate_data.cand_cnic_no;
            if (candidate_data.cand_gender) candidate.cand_gender = candidate_data.cand_gender;
            if (candidate_data.cand_nationality) candidate.cand_nationality = candidate_data.cand_nationality;
            if (candidate_data.cand_whatsapp_no !== undefined) candidate.cand_whatsapp_no = candidate_data.cand_whatsapp_no;
          }
          
          await candidate.save();
        }
      } catch (candError) {
        console.error('Error updating linked candidate record during profile update:', candError);
      }
    }
    
    // Save changes
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(userId).select('-password');
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

/**
 * Set default organizations for admins
 * @route POST /api/users/set-admin-orgs
 * @access Private (Admin)
 */
exports.setAdminOrganizations = async (req, res) => {
  try {
    // Only allow admins to perform this action
    if (req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to perform this action'
      });
    }

    // Get the organization IDs
    const nustOrg = await Organization.findOne({ org_name: 'NUST' });
    const seecsInst = await Institute.findOne({ inst_name: 'SEECS' });
    const lmsDept = await Department.findOne({ dept_name: 'LMS' });

    if (!nustOrg || !seecsInst || !lmsDept) {
      return res.status(404).json({
        success: false,
        message: 'One or more required organizations not found'
      });
    }

    // Update all admin users
    const result = await User.updateMany(
      { role_id: 1 }, // All admin users
      { 
        org_id: nustOrg.org_id,
        inst_id: seecsInst.inst_id,
        dept_id: lmsDept.dept_id
      }
    );

    return res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} admin users with default organizations`,
      data: {
        organization: nustOrg.org_name,
        institute: seecsInst.inst_name,
        department: lmsDept.dept_name,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error setting admin organizations:', error);
    return res.status(500).json({
      success: false,
      message: 'Error setting admin organizations',
      error: error.message
    });
  }
};

/**
 * Bulk import candidates
 * @route POST /api/users/bulk-import
 * @access Private (Admin)
 */
exports.bulkImportCandidates = async (req, res) => {
  try {
    const { candidates } = req.body;
    
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No candidates provided for import'
      });
    }
    
    // Group candidates by job to check vacancies
    const jobCandidateMap = {};
    for (const candidate of candidates) {
      if (candidate.applied_job_id) {
        if (!jobCandidateMap[candidate.applied_job_id]) {
          jobCandidateMap[candidate.applied_job_id] = 0;
        }
        jobCandidateMap[candidate.applied_job_id]++;
      }
    }
    
    // Check vacancies for each job
    for (const jobId in jobCandidateMap) {
      const job = await Job.findOne({ job_id: jobId });
      if (!job) {
        return res.status(400).json({
          success: false,
          message: `Job with ID ${jobId} not found`
        });
      }
      
      const assignedCandidatesCount = await Candidate.countDocuments({ applied_job_id: jobId });
      const candidatesForJob = jobCandidateMap[jobId];
      
      if (assignedCandidatesCount + candidatesForJob > job.vacancy_count) {
        return res.status(400).json({
          success: false,
          message: `Cannot import ${candidatesForJob} candidates for job ${job.job_name} (ID: ${jobId}). Job has ${job.vacancy_count} vacancies with ${assignedCandidatesCount} already assigned. Only ${Math.max(0, job.vacancy_count - assignedCandidatesCount)} vacancies available.`
        });
      }
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    const defaultPassword = "Test@123"; // Default password for all imported candidates
    
    // Process each candidate
    for (const candidateData of candidates) {
      try {
        // Generate username from first and last name
        const firstName = candidateData.firstName || '';
        const lastName = candidateData.lastName || '';
        
        if (!firstName) {
          results.failed.push({
            data: candidateData,
            error: 'First name is required'
          });
          continue;
        }
        
        if (!candidateData.email) {
          results.failed.push({
            data: candidateData,
            error: 'Email is required'
          });
          continue;
        }
        
        if (!candidateData.cnic_no) {
          results.failed.push({
            data: candidateData,
            error: 'CNIC is required'
          });
          continue;
        }
        
        // Check if user with this email already exists
        const emailExists = await User.findOne({ email: candidateData.email });
        if (emailExists) {
          results.failed.push({
            data: candidateData,
            error: 'User with this email already exists'
          });
          continue;
        }
        
        // Check if candidate with this CNIC already exists
        const cnicExists = await Candidate.findOne({ cand_cnic_no: candidateData.cnic_no });
        if (cnicExists) {
          results.failed.push({
            data: candidateData,
            error: 'Candidate with this CNIC already exists'
          });
          continue;
        }
        
        // Generate unique username
        let username = firstName.toLowerCase().replace(/\s+/g, '');
        if (lastName) {
          username += '.' + lastName.toLowerCase().replace(/\s+/g, '');
        }
        
        // Add random number suffix to ensure uniqueness even before DB check
        username += Math.floor(Math.random() * 100);
        
        // Ensure username uniqueness - append number if conflict
        let tempUsername = username;
        let counter = 0;
        let userExists = await User.findOne({ username: tempUsername });
        while(userExists) {
          counter++;
          tempUsername = `${username}${counter}`;
          userExists = await User.findOne({ username: tempUsername });
        }
        username = tempUsername;
        
        // Generate unique password
        const uniquePassword = candidateData.password || `${defaultPassword}${Math.floor(Math.random() * 1000)}`;
        
        // Create user
        const user = await User.create({
          username,
          email: candidateData.email,
          password: uniquePassword,
          mobile_no: candidateData.mobile_no || '',
          org_id: candidateData.org_id || 1000,
          inst_id: candidateData.inst_id || null,
          dept_id: candidateData.dept_id || null,
          role_id: 4, // Candidate role
          user_status: 1,
          user_type: 'candidate',
          profile: {
            firstName,
            lastName,
            department: candidateData.department || '',
            position: candidateData.position || ''
          },
          pass_flag: 0,
          candidate_id: null
        });
        
        // Create candidate record
        const candidate = await Candidate.create({
          cand_name: `${firstName} ${lastName}`.trim(),
          cand_cnic_no: candidateData.cnic_no,
          cand_email: candidateData.email,
          cand_mobile_no: candidateData.mobile_no || '',
          cand_gender: candidateData.gender || null,
          cand_nationality: 1,
          cand_mode: candidateData.mode || 'R',
          candidate_type: candidateData.candidate_type || 'initial',
          probation_end_date: null,
          cand_status: 1,
          cand_whatsapp_no: candidateData.whatsapp_no || candidateData.mobile_no || '',
          org_id: candidateData.org_id || 1000,
          inst_id: candidateData.inst_id || null,
          dept_id: candidateData.dept_id || null,
          applied_job_id: candidateData.applied_job_id || null,
          current_job_id: null,
          hiring_status: candidateData.hiring_status || 'applied',
          supervisor_id: candidateData.supervisor_id || null,
          cat_id: candidateData.cat_id || 0,
          user_account: user._id,
          added_by: req.user.id,
        });
        
        // Update user with candidate ID
        user.candidate_id = candidate._id;
        await user.save();
        
        // Add to success results
        results.success.push({
          username,
          email: candidateData.email,
          password: uniquePassword,
          userId: user._id,
          candidateId: candidate._id
        });
        
      } catch (error) {
        console.error('Error importing candidate:', error);
        results.failed.push({
          data: candidateData,
          error: error.message
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Successfully imported ${results.success.length} candidates. Failed to import ${results.failed.length} candidates.`,
      data: results
    });
    
  } catch (error) {
    console.error('Error in bulk import:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing bulk import',
      error: error.message
    });
  }
};

/**
 * Generate Excel template for candidate import
 * @route GET /api/users/import-template
 * @access Private (Admin)
 */
exports.generateImportTemplate = async (req, res) => {
  try {
    // Get job details from query parameters if provided
    const jobId = req.query.job_id;
    const orgId = req.query.org_id;
    const instId = req.query.inst_id;
    const deptId = req.query.dept_id;
    const catId = req.query.cat_id;
    
    // Initialize mongoose models
    const Organization = mongoose.model('Organization');
    const Institute = mongoose.model('Institute');
    const Department = mongoose.model('Department');
    const Job = mongoose.model('Job');
    const Category = mongoose.model('Category');
    
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    
    // Add a worksheet
    const worksheet = workbook.addWorksheet('Candidates');
    
    // If job details are provided, create a pre-filled template
    if (jobId) {
      // Create a job-specific template
      worksheet.columns = [
        { header: 'First Name*', key: 'firstName', width: 20 },
        { header: 'Last Name', key: 'lastName', width: 20 },
        { header: 'Email*', key: 'email', width: 30 },
        { header: 'CNIC*', key: 'cnic_no', width: 20 },
        { header: 'Mobile Number', key: 'mobile_no', width: 15 },
        { header: 'WhatsApp Number', key: 'whatsapp_no', width: 15 },
        { header: 'Gender (M/F/O)', key: 'gender', width: 15 },
        // Only include category if not provided in the job
        ...(catId ? [] : [{ header: 'Category ID', key: 'cat_id', width: 15 }]),
        { header: 'Candidate Type', key: 'candidate_type', width: 15 },
        { header: 'Hiring Status', key: 'hiring_status', width: 15 },
        { header: 'Mode', key: 'mode', width: 10 }
      ];
      
      // Add header row with styling
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Add example row without org, inst, dept, job fields
      worksheet.addRow({
        firstName: 'John',
        lastName: 'Doe',
        email: 'example@example.com',
        cnic_no: '12345-1234567-1',
        mobile_no: '03001234567',
        whatsapp_no: '03001234567',
        gender: 'M',
        ...(catId ? {} : { cat_id: '' }),
        candidate_type: 'initial',
        hiring_status: 'applied',
        mode: 'R'
      });
      
      // Add a note about pre-filled job details
      const infoSheet = workbook.addWorksheet('Info');
      infoSheet.addRow(['IMPORTANT: This template has been pre-configured for a specific job']);
      infoSheet.addRow(['']);
      
      // Get job details
      let jobName = '';
      if (jobId) {
        const job = await Job.findOne({ job_id: jobId }).lean();
        if (job) {
          jobName = job.job_name;
          infoSheet.addRow(['Job ID:', jobId, job.job_name]);
        }
      }
      
      let orgName = '';
      if (orgId) {
        const org = await Organization.findOne({ org_id: orgId }).lean();
        if (org) {
          orgName = org.org_name;
          infoSheet.addRow(['Organization:', orgId, org.org_name]);
        }
      }
      
      let instName = '';
      if (instId) {
        const inst = await Institute.findOne({ inst_id: instId }).lean();
        if (inst) {
          instName = inst.inst_name;
          infoSheet.addRow(['Institute:', instId, inst.inst_name]);
        }
      }
      
      let deptName = '';
      if (deptId) {
        const dept = await Department.findOne({ dept_id: deptId }).lean();
        if (dept) {
          deptName = dept.dept_name;
          infoSheet.addRow(['Department:', deptId, dept.dept_name]);
        }
      }
      
      let catName = '';
      if (catId) {
        const category = await Category.findOne({ cat_id: catId }).lean();
        if (category) {
          catName = category.cat_name;
          infoSheet.addRow(['Category:', catId, category.cat_name]);
        }
      }
      
      infoSheet.addRow(['']);
      infoSheet.addRow(['IMPORTANT: The following values will be automatically applied to all imported candidates:']);
      infoSheet.addRow(['- Organization: ' + orgName + ' (ID: ' + orgId + ')']);
      infoSheet.addRow(['- Institute: ' + instName + ' (ID: ' + instId + ')']);
      infoSheet.addRow(['- Department: ' + deptName + ' (ID: ' + deptId + ')']);
      infoSheet.addRow(['- Job: ' + jobName + ' (ID: ' + jobId + ')']);
      if (catId) {
        infoSheet.addRow(['- Category: ' + catName + ' (ID: ' + catId + ')']);
      }
      infoSheet.addRow(['']);
      infoSheet.addRow(['You do NOT need to include these fields in your data.']);
    } else {
      // If no job details are provided, create the default worksheet
      worksheet.columns = [
        { header: 'First Name*', key: 'firstName', width: 20 },
        { header: 'Last Name', key: 'lastName', width: 20 },
        { header: 'Email*', key: 'email', width: 30 },
        { header: 'CNIC*', key: 'cnic_no', width: 20 },
        { header: 'Mobile Number', key: 'mobile_no', width: 15 },
        { header: 'WhatsApp Number', key: 'whatsapp_no', width: 15 },
        { header: 'Gender (M/F/O)', key: 'gender', width: 15 },
        { header: 'Job ID*', key: 'applied_job_id', width: 15 },
        { header: 'Candidate Type', key: 'candidate_type', width: 15 },
        { header: 'Hiring Status', key: 'hiring_status', width: 15 },
        { header: 'Mode', key: 'mode', width: 10 }
      ];
      
      // Add header row with styling
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Add example row
      worksheet.addRow({
        firstName: 'John',
        lastName: 'Doe',
        email: 'example@example.com',
        cnic_no: '12345-1234567-1',
        mobile_no: '03001234567',
        whatsapp_no: '03001234567',
        gender: 'M',
        applied_job_id: '1000', // Example job ID
        candidate_type: 'initial',
        hiring_status: 'applied',
        mode: 'R'
      });
      
      // Add a note about job ID
      const infoSheet = workbook.addWorksheet('Info');
      infoSheet.addRow(['IMPORTANT: This template has been optimized for easier candidate imports']);
      infoSheet.addRow(['']);
      infoSheet.addRow(['Simply provide the Job ID and all related information will be automatically applied:']);
      infoSheet.addRow(['- Organization will be set based on the job']);
      infoSheet.addRow(['- Institute will be set based on the job']);
      infoSheet.addRow(['- Department will be set based on the job']);
      infoSheet.addRow(['- Category will be set based on the job']);
      infoSheet.addRow(['']);
      infoSheet.addRow(['You do NOT need to include these fields separately in your data.']);
      
      // Add a separate job reference sheet
      await addJobReferenceSheet(workbook);
    }
    
    // Get data for dropdowns
    const organizations = await Organization.find().select('org_id org_name');
    const institutes = await Institute.find().select('inst_id inst_name');
    const departments = await Department.find().select('dept_id dept_name');
    const jobs = await Job.find().select('job_id job_name');
    const categories = await Category.find().select('cat_id cat_name');
    
    // Add a reference sheet for jobs with their details - always include this regardless of template type
    // Check if Job Reference worksheet already exists
    let jobReferenceSheet;
    if (!workbook.getWorksheet('Job Reference')) {
      jobReferenceSheet = workbook.addWorksheet('Job Reference');
      jobReferenceSheet.columns = [
        { header: 'Job ID', key: 'job_id', width: 10 },
        { header: 'Job Name', key: 'job_name', width: 30 },
        { header: 'Organization', key: 'org_name', width: 20 },
        { header: 'Institute', key: 'inst_name', width: 20 },
        { header: 'Department', key: 'dept_name', width: 20 },
        { header: 'Category', key: 'cat_name', width: 20 }
      ];
      
      // Style the header row
      jobReferenceSheet.getRow(1).font = { bold: true };
      jobReferenceSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Populate job reference data
      for (const job of jobs) {
        try {
          const jobData = await Job.findOne({ job_id: job.job_id })
            .populate('organization', 'org_name')
            .populate('institute', 'inst_name')
            .populate('department', 'dept_name')
            .populate('category', 'cat_name')
            .lean();
            
          if (jobData) {
            jobReferenceSheet.addRow({
              job_id: jobData.job_id,
              job_name: jobData.job_name,
              org_name: jobData.organization ? jobData.organization.org_name : 'N/A',
              inst_name: jobData.institute ? jobData.institute.inst_name : 'N/A',
              dept_name: jobData.department ? jobData.department.dept_name : 'N/A',
              cat_name: jobData.category ? jobData.category.cat_name : 'N/A'
            });
          }
        } catch (error) {
          console.error(`Error loading job details for job ID ${job.job_id}:`, error);
        }
      }
    } else {
      jobReferenceSheet = workbook.getWorksheet('Job Reference');
    }
    
    // Create named ranges for dropdowns
    // Gender dropdown
    const genderValues = ['M', 'F', 'O'];
    const genderSheet = workbook.addWorksheet('_Dropdowns');
    genderSheet.getColumn('A').values = ['Gender', ...genderValues];
    
    // Candidate type dropdown
    const candidateTypeValues = ['initial', 'probation', 'hired'];
    genderSheet.getColumn('B').values = ['CandidateType', ...candidateTypeValues];
    
    // Hiring status dropdown
    const hiringStatusValues = ['applied', 'screening', 'interview', 'selected', 'rejected', 'hired'];
    genderSheet.getColumn('C').values = ['HiringStatus', ...hiringStatusValues];
    
    // Mode dropdown
    const modeValues = ['R', 'C', 'T', 'P'];
    genderSheet.getColumn('D').values = ['Mode', ...modeValues];
    
    // Organization dropdown
    genderSheet.getColumn('E').values = ['OrgID', ...organizations.map(org => org.org_id)];
    genderSheet.getColumn('F').values = ['OrgName', ...organizations.map(org => org.org_name)];
    
    // Institute dropdown
    genderSheet.getColumn('G').values = ['InstID', ...institutes.map(inst => inst.inst_id)];
    genderSheet.getColumn('H').values = ['InstName', ...institutes.map(inst => inst.inst_name)];
    
    // Department dropdown
    genderSheet.getColumn('I').values = ['DeptID', ...departments.map(dept => dept.dept_id)];
    genderSheet.getColumn('J').values = ['DeptName', ...departments.map(dept => dept.dept_name)];
    
    // Job dropdown
    genderSheet.getColumn('K').values = ['JobID', ...jobs.map(job => job.job_id)];
    genderSheet.getColumn('L').values = ['JobName', ...jobs.map(job => job.job_name)];
    
    // Category dropdown
    genderSheet.getColumn('M').values = ['CatID', ...categories.map(cat => cat.cat_id)];
    genderSheet.getColumn('N').values = ['CatName', ...categories.map(cat => cat.cat_name)];
    
    // Hide the dropdown sheet
    genderSheet.state = 'hidden';
    
    // Define data validation for dropdowns
    // Gender validation
    worksheet.getCell('G2').dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"M,F,O"`]
    };
    
          // Only add validations if not a job-specific template
    if (!jobId) {
      // Organization validation with lookup
      const orgMapping = {};
      organizations.forEach(org => {
        orgMapping[org.org_id] = org.org_name;
      });
      
      // Job validation - this is now the most important field
      worksheet.getCell('H2').dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`"${jobs.map(job => job.job_id).join(',')}"`]
      };
    }
    
    // Category validation (always add this if not job-specific or if job doesn't have a category)
    if (!jobId || !catId) {
      worksheet.getCell(jobId ? (catId ? null : 'H2') : 'L2').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${categories.map(cat => cat.cat_id).join(',')}"`]
      };
    }
    
    // Candidate type validation
    worksheet.getCell(jobId ? (catId ? 'H2' : 'I2') : 'M2').dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${candidateTypeValues.join(',')}"`]
    };
    
    // Hiring status validation
    worksheet.getCell(jobId ? (catId ? 'I2' : 'J2') : 'N2').dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${hiringStatusValues.join(',')}"`]
    };
    
    // Mode validation
    worksheet.getCell(jobId ? (catId ? 'J2' : 'K2') : 'O2').dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${modeValues.join(',')}"`]
    };
    
    // Add a reference sheet for codes and their meanings
    const referenceSheet = workbook.addWorksheet('Reference');
    
    // Gender reference
    referenceSheet.getCell('A1').value = 'Gender Codes';
    referenceSheet.getCell('A1').font = { bold: true };
    referenceSheet.getCell('A2').value = 'M = Male';
    referenceSheet.getCell('A3').value = 'F = Female';
    referenceSheet.getCell('A4').value = 'O = Other';
    
    // Mode reference
    referenceSheet.getCell('B1').value = 'Mode Codes';
    referenceSheet.getCell('B1').font = { bold: true };
    referenceSheet.getCell('B2').value = 'R = Regular';
    referenceSheet.getCell('B3').value = 'C = Contract';
    referenceSheet.getCell('B4').value = 'T = Temporary';
    referenceSheet.getCell('B5').value = 'P = Part-time';
    
    // Job reference with detailed information
    referenceSheet.getCell('C1').value = 'Jobs (with Organization, Institute, Department, Category)';
    referenceSheet.getCell('C1').font = { bold: true };
    referenceSheet.getCell('C2').value = 'ID';
    referenceSheet.getCell('D2').value = 'Name';
    referenceSheet.getCell('E2').value = 'Organization';
    referenceSheet.getCell('F2').value = 'Institute';
    referenceSheet.getCell('G2').value = 'Department';
    referenceSheet.getCell('H2').value = 'Category';
    
    // Get all jobs with their details
    const allJobs = await Job.find().lean();
    
    // Prepare lookup maps for related entities
    const orgMap = new Map();
    for (const org of organizations) {
      orgMap.set(org.org_id.toString(), org.org_name);
    }
    
    const instMap = new Map();
    for (const inst of institutes) {
      instMap.set(inst.inst_id.toString(), inst.inst_name);
    }
    
    const deptMap = new Map();
    for (const dept of departments) {
      deptMap.set(dept.dept_id.toString(), dept.dept_name);
    }
    
    const catMap = new Map();
    for (const cat of categories) {
      catMap.set(cat.cat_id.toString(), cat.cat_name);
    }
    
    // Populate job reference data
    let jobRowIndex = 3;
    for (const job of allJobs) {
      referenceSheet.getCell(`C${jobRowIndex}`).value = job.job_id;
      referenceSheet.getCell(`D${jobRowIndex}`).value = job.job_name;
      referenceSheet.getCell(`E${jobRowIndex}`).value = job.org_id ? orgMap.get(job.org_id.toString()) || `ID: ${job.org_id}` : 'N/A';
      referenceSheet.getCell(`F${jobRowIndex}`).value = job.inst_id ? instMap.get(job.inst_id.toString()) || `ID: ${job.inst_id}` : 'N/A';
      referenceSheet.getCell(`G${jobRowIndex}`).value = job.dept_id ? deptMap.get(job.dept_id.toString()) || `ID: ${job.dept_id}` : 'N/A';
      referenceSheet.getCell(`H${jobRowIndex}`).value = job.cat_id ? catMap.get(job.cat_id.toString()) || `ID: ${job.cat_id}` : 'N/A';
      jobRowIndex++;
    }
    
    // Add a sample row
    worksheet.addRow({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      cnic_no: '12345-1234567-1',
      mobile_no: '03001234567',
      whatsapp_no: '03001234567',
      gender: 'M',
      applied_job_id: jobs[0]?.job_id || '',
      candidate_type: 'initial',
      hiring_status: 'applied',
      mode: 'R'
    });
    
    // Apply data validation to all rows (for up to 1000 rows)
    for (let i = 2; i <= 1000; i++) {
      // Gender validation
      worksheet.getCell(`G${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"M,F,O"`]
      };
      
      // Job validation - this is now the most important field
      worksheet.getCell(`H${i}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`"${jobs.map(job => job.job_id).join(',')}"`]
      };
      
      // Candidate type validation
      worksheet.getCell(`I${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${candidateTypeValues.join(',')}"`]
      };
      
      // Hiring status validation
      worksheet.getCell(`J${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${hiringStatusValues.join(',')}"`]
      };
      
      // Mode validation
      worksheet.getCell(`K${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${modeValues.join(',')}"`]
      };
    }
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=candidate_import_template.xlsx');
    
    // Write to response
    await workbook.xlsx.write(res);
    
  } catch (error) {
    console.error('Error generating template:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating import template',
      error: error.message
    });
  }
};

// Helper function to add job reference sheet
async function addJobReferenceSheet(workbook) {
  try {
    const jobRefSheet = workbook.addWorksheet('Job Reference');
    jobRefSheet.columns = [
      { header: 'Job ID', key: 'job_id', width: 10 },
      { header: 'Job Name', key: 'job_name', width: 30 },
      { header: 'Organization', key: 'org_name', width: 20 },
      { header: 'Institute', key: 'inst_name', width: 20 },
      { header: 'Department', key: 'dept_name', width: 20 },
      { header: 'Category', key: 'cat_name', width: 20 }
    ];
    
    // Style the header row
    jobRefSheet.getRow(1).font = { bold: true };
    jobRefSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Get all jobs
    const Job = require('../models/job.model');
    const Organization = require('../models/organization.model');
    const Institute = require('../models/institute.model');
    const Department = require('../models/department.model');
    const Category = require('../models/category.model');
    
    const jobs = await Job.find().lean();
    
    // Add job data with lookup for each related entity
    for (const job of jobs) {
      try {
        // Prepare job row data
        const rowData = {
          job_id: job.job_id,
          job_name: job.job_name,
          org_name: 'N/A',
          inst_name: 'N/A',
          dept_name: 'N/A',
          cat_name: 'N/A'
        };
        
        // Look up organization name
        if (job.org_id) {
          const org = await Organization.findOne({ org_id: job.org_id }).lean();
          if (org) {
            rowData.org_name = org.org_name;
          }
        }
        
        // Look up institute name
        if (job.inst_id) {
          const inst = await Institute.findOne({ inst_id: job.inst_id }).lean();
          if (inst) {
            rowData.inst_name = inst.inst_name;
          }
        }
        
        // Look up department name
        if (job.dept_id) {
          const dept = await Department.findOne({ dept_id: job.dept_id }).lean();
          if (dept) {
            rowData.dept_name = dept.dept_name;
          }
        }
        
        // Look up category name
        if (job.cat_id) {
          const cat = await Category.findOne({ cat_id: job.cat_id }).lean();
          if (cat) {
            rowData.cat_name = cat.cat_name;
          }
        }
        
        // Add row to sheet
        jobRefSheet.addRow(rowData);
      } catch (error) {
        console.error(`Error processing job ${job.job_id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error creating job reference sheet:', error);
  }
}

/**
 * Process Excel file upload for candidate import
 * @route POST /api/users/upload-import
 * @access Private (Admin)
 */
exports.processExcelImport = async (req, res) => {
  try {
    // Check if file exists in the request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get file extension
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    
    // Check if file is an Excel file
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      return res.status(400).json({
        success: false,
        message: 'Only Excel files (xlsx, xls) are allowed'
      });
    }

    // Parse Excel file
    const xlsx = require('xlsx');
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert sheet data to JSON
    const candidates = xlsx.utils.sheet_to_json(sheet);
    
    if (!candidates || candidates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data found in the Excel file'
      });
    }
    
    // Process the candidates data
    const results = {
      success: [],
      failed: []
    };
    
    const defaultPassword = "Test@123"; // Default password for all imported candidates
    
    // Get job details from the request if provided
    const jobId = req.body.job_id;
    const orgId = req.body.org_id;
    const instId = req.body.inst_id;
    const deptId = req.body.dept_id;
    const catId = req.body.cat_id;
    
    console.log('Job details from request:', { jobId, orgId, instId, deptId, catId });
    
    // If a job ID is provided, check for available vacancies
    if (jobId) {
      const job = await Job.findOne({ job_id: jobId });
      
      if (!job) {
        return res.status(400).json({
          success: false,
          message: 'Job not found'
        });
      }
      
      // Get current number of candidates assigned to this job
      const assignedCandidatesCount = await Candidate.countDocuments({ applied_job_id: jobId });
      
      // Check if there are enough vacancies
      if (assignedCandidatesCount + candidates.length > job.vacancy_count) {
        return res.status(400).json({
          success: false,
          message: `Cannot import ${candidates.length} candidates. Job has ${job.vacancy_count} vacancies with ${assignedCandidatesCount} already assigned. Only ${job.vacancy_count - assignedCandidatesCount} vacancies available.`
        });
      }
    }
    
    // Process each candidate
    for (const candidateData of candidates) {
      try {
        // Map Excel column names to our expected field names
        const mappedData = {
          firstName: candidateData['First Name*'] || candidateData['First Name'],
          lastName: candidateData['Last Name'] || '',
          email: candidateData['Email*'] || candidateData['Email'],
          cnic_no: candidateData['CNIC*'] || candidateData['CNIC'],
          mobile_no: candidateData['Mobile Number'] || '',
          whatsapp_no: candidateData['WhatsApp Number'] || '',
          gender: candidateData['Gender (M/F/O)'] || candidateData['Gender'] || null,
          // Generate a unique password if not provided
          password: candidateData['Password'] || `${defaultPassword}${Math.floor(Math.random() * 1000)}`,
          // Use job details from the request if available, otherwise use values from Excel
          applied_job_id: jobId || candidateData['Job ID*'] || candidateData['Job ID'] || null,
          candidate_type: candidateData['Candidate Type'] || 'initial',
          hiring_status: candidateData['Hiring Status'] || 'applied',
          mode: candidateData['Mode'] || 'R'
        };
        
        // If job ID is provided, get the job details and apply them
        let jobDetails = null;
        if (mappedData.applied_job_id) {
          jobDetails = await Job.findOne({ job_id: mappedData.applied_job_id }).lean();
          if (jobDetails) {
            // Apply job details to the candidate
            mappedData.org_id = orgId || jobDetails.org_id || 1000;
            mappedData.inst_id = instId || jobDetails.inst_id || null;
            mappedData.dept_id = deptId || jobDetails.dept_id || null;
            mappedData.cat_id = catId || jobDetails.cat_id || null;
          } else {
            // Job not found, use default values or values from request
            mappedData.org_id = orgId || 1000;
            mappedData.inst_id = instId || null;
            mappedData.dept_id = deptId || null;
            mappedData.cat_id = catId || null;
          }
        } else {
          // No job ID provided, use values from request or default
          mappedData.org_id = orgId || 1000;
          mappedData.inst_id = instId || null;
          mappedData.dept_id = deptId || null;
          mappedData.cat_id = catId || null;
        }
        
        // Validate required fields
        if (!mappedData.firstName) {
          results.failed.push({
            data: candidateData,
            error: 'First name is required'
          });
          continue;
        }
        
        if (!mappedData.email) {
          results.failed.push({
            data: candidateData,
            error: 'Email is required'
          });
          continue;
        }
        
        if (!mappedData.cnic_no) {
          results.failed.push({
            data: candidateData,
            error: 'CNIC is required'
          });
          continue;
        }
        
        // Check if user with this email already exists
        const emailExists = await User.findOne({ email: mappedData.email });
        if (emailExists) {
          results.failed.push({
            data: candidateData,
            error: 'User with this email already exists'
          });
          continue;
        }
        
        // Check if candidate with this CNIC already exists
        const cnicExists = await Candidate.findOne({ cand_cnic_no: mappedData.cnic_no });
        if (cnicExists) {
          results.failed.push({
            data: candidateData,
            error: 'Candidate with this CNIC already exists'
          });
          continue;
        }
        
        // Generate unique username
        let username = mappedData.firstName.toLowerCase().replace(/\s+/g, '');
        if (mappedData.lastName) {
          username += '.' + mappedData.lastName.toLowerCase().replace(/\s+/g, '');
        }
        
        // Add random number suffix to ensure uniqueness even before DB check
        username += Math.floor(Math.random() * 100);
        
        // Ensure username uniqueness - append number if conflict
        let tempUsername = username;
        let counter = 0;
        let userExists = await User.findOne({ username: tempUsername });
        while(userExists) {
          counter++;
          tempUsername = `${username}${counter}`;
          userExists = await User.findOne({ username: tempUsername });
        }
        username = tempUsername;
        
        // Create user
        const user = await User.create({
          username,
          email: mappedData.email,
          password: mappedData.password,
          mobile_no: mappedData.mobile_no || '',
          org_id: mappedData.org_id || 1000,
          inst_id: mappedData.inst_id || null,
          dept_id: mappedData.dept_id || null,
          role_id: 4, // Candidate role
          user_status: 1,
          user_type: 'candidate',
          profile: {
            firstName: mappedData.firstName,
            lastName: mappedData.lastName,
            department: '',
            position: ''
          },
          pass_flag: 0,
          candidate_id: null
        });
        
        // Create candidate record
        const candidate = await Candidate.create({
          cand_name: `${mappedData.firstName} ${mappedData.lastName}`.trim(),
          cand_cnic_no: mappedData.cnic_no,
          cand_email: mappedData.email,
          cand_mobile_no: mappedData.mobile_no || '',
          cand_gender: mappedData.gender || null,
          cand_nationality: 1,
          cand_mode: mappedData.mode || 'R',
          candidate_type: mappedData.candidate_type || 'initial',
          probation_end_date: null,
          cand_status: 1,
          cand_whatsapp_no: mappedData.whatsapp_no || mappedData.mobile_no || '',
          org_id: mappedData.org_id || 1000,
          inst_id: mappedData.inst_id || null,
          dept_id: mappedData.dept_id || null,
          applied_job_id: mappedData.applied_job_id || null,
          current_job_id: null,
          hiring_status: mappedData.hiring_status || 'applied',
          supervisor_id: mappedData.supervisor_id || null,
          cat_id: mappedData.cat_id || 0,
          user_account: user._id,
          added_by: req.user.id,
        });
        
        // Update user with candidate ID
        user.candidate_id = candidate._id;
        await user.save();
        
        // Add to success results
        results.success.push({
          username,
          email: mappedData.email,
          password: mappedData.password,
          userId: user._id,
          candidateId: candidate._id
        });
        
      } catch (error) {
        console.error('Error importing candidate from Excel:', error);
        results.failed.push({
          data: candidateData,
          error: error.message
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Successfully imported ${results.success.length} candidates. Failed to import ${results.failed.length} candidates.`,
      data: results
    });
    
  } catch (error) {
    console.error('Error processing Excel import:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing Excel import',
      error: error.message
    });
  }
};

/**
 * Register a single candidate
 * @route POST /api/users/register-candidate
 * @access Private (Admin)
 */
exports.registerCandidate = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      cnic_no,
      mobile_no,
      whatsapp_no,
      gender,
      password,
      org_id,
      inst_id,
      dept_id,
      applied_job_id,
      cat_id,
      supervisor_id,
      candidate_type,
      hiring_status,
      mode
    } = req.body;

    // Validate required fields
    if (!firstName) {
      return res.status(400).json({
        success: false,
        message: 'First name is required'
      });
    }
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    if (!cnic_no) {
      return res.status(400).json({
        success: false,
        message: 'CNIC is required'
      });
    }
    
    if (!org_id) {
      return res.status(400).json({
        success: false,
        message: 'Organization is required'
      });
    }
    
    // Check if job exists and has vacancies if applied_job_id is provided
    if (applied_job_id) {
      const job = await Job.findOne({ job_id: applied_job_id });
      
      if (!job) {
        return res.status(400).json({
          success: false,
          message: 'Job not found'
        });
      }
      
      // Get current number of candidates assigned to this job
      const assignedCandidatesCount = await Candidate.countDocuments({ applied_job_id });
      
      // Check if there are enough vacancies
      if (assignedCandidatesCount >= job.vacancy_count) {
        return res.status(400).json({
          success: false,
          message: `Cannot assign candidate to this job. Job has ${job.vacancy_count} vacancies with ${assignedCandidatesCount} already assigned. No vacancies available.`
        });
      }
    }
    
    // Check if user with this email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Check if candidate with this CNIC already exists
    const cnicExists = await Candidate.findOne({ cand_cnic_no: cnic_no });
    if (cnicExists) {
      return res.status(400).json({
        success: false,
        message: 'Candidate with this CNIC already exists'
      });
    }
    
    // Generate unique username
    let username = firstName.toLowerCase().replace(/\s+/g, '');
    if (lastName) {
      username += '.' + lastName.toLowerCase().replace(/\s+/g, '');
    }
    
    // Add random number suffix to ensure uniqueness even before DB check
    username += Math.floor(Math.random() * 100);
    
    // Ensure username uniqueness - append number if conflict
    let tempUsername = username;
    let counter = 0;
    let userExists = await User.findOne({ username: tempUsername });
    while(userExists) {
      counter++;
      tempUsername = `${username}${counter}`;
      userExists = await User.findOne({ username: tempUsername });
    }
    username = tempUsername;
    
    // Generate a unique password if not provided
    const defaultPassword = "Test@123";
    const finalPassword = password || `${defaultPassword}${Math.floor(Math.random() * 1000)}`;
    
    // Create user
    const user = await User.create({
      username,
      email,
      password: finalPassword,
      mobile_no: mobile_no || '',
      org_id: org_id || 1000,
      inst_id: inst_id || null,
      dept_id: dept_id || null,
      role_id: 4, // Candidate role
      user_status: 1,
      user_type: 'candidate',
      profile: {
        firstName,
        lastName: lastName || '',
        department: '',
        position: ''
      },
      pass_flag: 0,
      candidate_id: null
    });
    
    // Create candidate record
    const candidate = await Candidate.create({
      cand_name: `${firstName} ${lastName || ''}`.trim(),
      cand_cnic_no: cnic_no,
      cand_email: email,
      cand_mobile_no: mobile_no || '',
      cand_gender: gender || null,
      cand_nationality: 1,
      cand_mode: mode || 'R',
      candidate_type: candidate_type || 'initial',
      probation_end_date: null,
      cand_status: 1,
      cand_whatsapp_no: whatsapp_no || mobile_no || '',
      org_id: org_id || 1000,
      inst_id: inst_id || null,
      dept_id: dept_id || null,
      applied_job_id: applied_job_id || null,
      current_job_id: null,
      hiring_status: hiring_status || 'applied',
      supervisor_id: supervisor_id || null,
      cat_id: cat_id || 0,
      user_account: user._id,
      added_by: req.user.id,
    });
    
    // Update user with candidate ID
    user.candidate_id = candidate._id;
    await user.save();
    
    return res.status(201).json({
      success: true,
      message: 'Candidate registered successfully',
      data: {
        username,
        email,
        password: finalPassword,
        userId: user._id,
        candidateId: candidate._id
      }
    });
    
  } catch (error) {
    console.error('Error registering candidate:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', '),
        error: error.message
      });
    }
    
    // Handle duplicate key errors (e.g., duplicate email)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error registering candidate',
      error: error.message
    });
  }
}; 

/**
 * Get all supervisors (users with role_id 3)
 * @route GET /api/users/supervisors
 * @access Private
 */
exports.getSupervisors = async (req, res) => {
  try {
    const supervisors = await User.find({ role_id: 3 }).select('_id username email');
    res.status(200).json({
      success: true,
      data: supervisors,
    });
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching supervisors',
    });
  }
};
