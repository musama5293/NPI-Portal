const TestAssignment = require('../models/test-assignment.model');
const Test = require('../models/test.model');
const Candidate = require('../models/candidate.model');
const NotificationHelper = require('../services/notificationHelper');
const Organization = require('../models/organization.model');
const axios = require('axios');

/**
 * Get all test assignments
 * @route GET /api/test-assignments
 * @access Private
 */
exports.getAllTestAssignments = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Get total count of assignments for pagination
    const totalAssignments = await TestAssignment.countDocuments();

    // Get all test assignments with pagination
    const testAssignments = await TestAssignment.find()
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log('TestAssignments:', testAssignments.map(ta => ({ 
      id: ta._id, 
      assignment_id: ta.assignment_id,
      test_id: ta.test_id,
      candidate_id: ta.candidate_id,
      completion_status: ta.completion_status
    })));
    
    // Get unique candidate and test IDs
    const candidateIds = [...new Set(testAssignments.map(ta => ta.candidate_id).filter(id => id))];
    const testIds = [...new Set(testAssignments.map(ta => ta.test_id).filter(id => id))];
    const userIds = [...new Set(testAssignments.map(ta => ta.assigned_by).filter(id => id))];
    
    console.log('Unique test IDs:', testIds);
    
    // Fetch related data
    const User = require('../models/user.model');
    const [candidates, tests, users] = await Promise.all([
      Candidate.find({ _id: { $in: candidateIds } }).lean(),
      Test.find({ test_id: { $in: testIds } }).lean(),
      User.find({ _id: { $in: userIds } }).lean()
    ]);
    
    console.log('Tests found:', tests.map(t => ({ id: t._id, test_id: t.test_id, name: t.test_name })));
    
    // Create lookup maps
    const candidateMap = new Map(candidates.map(c => [c._id.toString(), c]));
    const testMap = new Map(tests.map(t => [t.test_id, t]));
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    // Populate the test assignments
    const populatedAssignments = testAssignments.map(assignment => {
      const assignmentObj = assignment.toObject();
      
      // Populate candidate
      if (assignment.candidate_id && candidateMap.has(assignment.candidate_id.toString())) {
        const candidate = candidateMap.get(assignment.candidate_id.toString());
        assignmentObj.candidate_id = {
          _id: candidate._id,
          candidate_name: candidate.cand_name,
          email: candidate.cand_email
        };
      }
      
      // Populate test
      if (assignment.test_id && testMap.has(assignment.test_id)) {
        const test = testMap.get(assignment.test_id);
        assignmentObj.test_id = {
          _id: test._id,
          test_id: test.test_id,
          test_name: test.test_name,
          test_type: test.test_type,
          test_duration: test.test_duration
        };
      } else {
        console.log(`No test found for test_id: ${assignment.test_id}`);
        // Provide default test information to avoid "Unknown" display
        assignmentObj.test_id = {
          test_id: assignment.test_id,
          test_name: `Test #${assignment.test_id}`,
          test_type: "unknown"
        };
      }
      
      // Populate assigned_by user
      if (assignment.assigned_by && userMap.has(assignment.assigned_by.toString())) {
        const user = userMap.get(assignment.assigned_by.toString());
        assignmentObj.assigned_by = {
          _id: user._id,
          username: user.username
        };
      }
      
      return assignmentObj;
    });
    
    return res.status(200).json({
      success: true,
      count: populatedAssignments.length,
      total: totalAssignments,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalAssignments / limit)
      },
      data: populatedAssignments
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving test assignments',
      error: error.message
    });
  }
};

/**
 * Get test assignments by candidate
 * @route GET /api/test-assignments/candidate/:id
 * @access Private
 */
exports.getTestAssignmentsByCandidate = async (req, res) => {
  try {
    const candidateId = req.params.id;
    
    const testAssignments = await TestAssignment.find({ candidate_id: candidateId })
      .sort({ created_at: -1 });
    
    // Get unique test IDs and user IDs
    const testIds = [...new Set(testAssignments.map(ta => ta.test_id).filter(id => id))];
    const userIds = [...new Set(testAssignments.map(ta => ta.assigned_by).filter(id => id))];
    
    // Fetch related data
    const User = require('../models/user.model');
    const [tests, users] = await Promise.all([
      Test.find({ test_id: { $in: testIds } }).lean(),
      User.find({ _id: { $in: userIds } }).lean()
    ]);
    
    // Create lookup maps
    const testMap = new Map(tests.map(t => [t.test_id, t]));
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    // Populate the test assignments
    const populatedAssignments = testAssignments.map(assignment => {
      const assignmentObj = assignment.toObject();
      
      // Populate test
      if (assignment.test_id && testMap.has(assignment.test_id)) {
        const test = testMap.get(assignment.test_id);
        assignmentObj.test_id = {
          _id: test._id,
          test_id: test.test_id,
          test_name: test.test_name,
          test_type: test.test_type,
          test_duration: test.test_duration
        };
      }
      
      // Populate assigned_by user
      if (assignment.assigned_by && userMap.has(assignment.assigned_by.toString())) {
        const user = userMap.get(assignment.assigned_by.toString());
        assignmentObj.assigned_by = {
          _id: user._id,
          username: user.username
        };
      }
      
      return assignmentObj;
    });
    
    return res.status(200).json({
      success: true,
      count: testAssignments.length,
      data: populatedAssignments
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving test assignments for candidate',
      error: error.message
    });
  }
};

/**
 * Get single test assignment
 * @route GET /api/test-assignments/:id
 * @access Private
 */
exports.getTestAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    const testAssignment = await TestAssignment.findOne({ assignment_id: assignmentId });
    
    if (!testAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Test assignment not found'
      });
    }
    
    // Fetch related data
    const User = require('../models/user.model');
    const [candidate, test, user] = await Promise.all([
      Candidate.findById(testAssignment.candidate_id).lean(),
      Test.findOne({ test_id: testAssignment.test_id }).lean(),
      User.findById(testAssignment.assigned_by).lean()
    ]);
    
    // Create populated object
    const assignmentObj = testAssignment.toObject();
    
    // Populate candidate
    if (candidate) {
      assignmentObj.candidate_id = {
        _id: candidate._id,
        candidate_name: candidate.cand_name,
        email: candidate.cand_email
      };
    }
    
    // Populate test
    if (test) {
      assignmentObj.test_id = {
        _id: test._id,
        test_id: test.test_id,
        test_name: test.test_name,
        test_type: test.test_type,
        test_duration: test.test_duration,
        instruction: test.instruction,
        closing_remarks: test.closing_remarks
      };
    }
    
    // Populate assigned_by user
    if (user) {
      assignmentObj.assigned_by = {
        _id: user._id,
        username: user.username
      };
    }
    
    return res.status(200).json({
      success: true,
      data: assignmentObj
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving test assignment',
      error: error.message
    });
  }
};

/**
 * Create test assignment
 * @route POST /api/test-assignments
 * @access Private
 */
exports.createTestAssignment = async (req, res) => {
  try {
    // Extract fields from request body
    const {
      assignment_id,
      test_id,
      candidate_id,
      scheduled_date,
      expiry_date
    } = req.body;
    
    // Validate test and candidate exist
    const testExists = await Test.findOne({ test_id });
    const candidateExists = await Candidate.findById(candidate_id);
    
    if (!testExists) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }
    
    if (!candidateExists) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Check if assignment already exists
    const assignmentExists = await TestAssignment.findOne({ 
      assignment_id
    });

    if (assignmentExists) {
      return res.status(400).json({
        success: false,
        message: 'Test assignment already exists'
      });
    }
    
    // Create test assignment
    const testAssignment = await TestAssignment.create({
      assignment_id,
      test_id,
      candidate_id,
      scheduled_date,
      expiry_date,
      assigned_by: req.user._id,
      assignment_status: 1,
      candidate_name: candidateExists.cand_name || 'Unknown Candidate'
    });
    
    // Send notification to candidate if they have a user account
    try {
      if (candidateExists.user_account) {
        const io = req.app.get('io');
        const notificationHelper = new NotificationHelper(io);
        
        const assignmentData = {
          _id: testAssignment.assignment_id,
          test_name: testExists.test_name,
          due_date: expiry_date,
          test_id: test_id
        };
        
        const candidateUser = {
          _id: candidateExists.user_account
        };
        
        await notificationHelper.notifyTestAssignment(assignmentData, candidateUser);
        console.log(`Notification sent to candidate ${candidateExists.cand_name} for test assignment`);
        
        // Also notify admins about the test assignment
        await notificationHelper.notifyAdminTestAssignment(assignmentData, candidateExists, req.user._id);
        console.log(`Admin notifications sent for test assignment to ${candidateExists.cand_name}`);
      }
    } catch (notificationError) {
      console.error('Error sending test assignment notification:', notificationError);
      // Don't fail the assignment if notification fails
    }
    
    return res.status(201).json({
      success: true,
      message: 'Test assigned successfully',
      data: testAssignment
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error assigning test',
      error: error.message
    });
  }
};

/**
 * Update test assignment
 * @route PUT /api/test-assignments/:id
 * @access Private
 */
exports.updateTestAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // Extract fields from request body
    const {
      test_id,
      candidate_id,
      scheduled_date,
      expiry_date,
      completion_status,
      score,
      feedback,
      assignment_status
    } = req.body;
    
    // Find the test assignment
    let testAssignment = await TestAssignment.findOne({ assignment_id: assignmentId });
    
    if (!testAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Test assignment not found'
      });
    }
    
    // Update test assignment
    testAssignment = await TestAssignment.findOneAndUpdate(
      { assignment_id: assignmentId },
      {
        test_id,
        candidate_id,
        scheduled_date,
        expiry_date,
        completion_status,
        score,
        feedback,
        assignment_status,
        updated_at: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Test assignment updated successfully',
      data: testAssignment
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error updating test assignment',
      error: error.message
    });
  }
};

/**
 * Record test start
 * @route PUT /api/test-assignments/:id/start
 * @access Private
 */
exports.startTest = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // Find the test assignment
    let testAssignment = await TestAssignment.findOne({ assignment_id: assignmentId });
    
    if (!testAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Test assignment not found'
      });
    }
    
    // Check if test is within valid date range
    const currentDate = new Date();
    if (currentDate < new Date(testAssignment.scheduled_date) || 
        currentDate > new Date(testAssignment.expiry_date)) {
      return res.status(400).json({
        success: false,
        message: 'Test is not available for taking at this time'
      });
    }
    
    // Check if test is already completed
    if (testAssignment.completion_status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Test has already been completed'
      });
    }
    
    // Update test assignment with start time
    testAssignment = await TestAssignment.findOneAndUpdate(
      { assignment_id: assignmentId },
      {
        start_time: Date.now(),
        completion_status: 'started',
        updated_at: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Test started successfully',
      data: testAssignment
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error starting test',
      error: error.message
    });
  }
};

/**
 * Record test completion (SIMPLE - for basic status updates only)
 * @route PUT /api/test-assignments/:id/complete
 * @access Private
 */
exports.markTestComplete = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { score } = req.body;
    
    // Find the test assignment
    let testAssignment = await TestAssignment.findOne({ assignment_id: assignmentId });
    
    if (!testAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Test assignment not found'
      });
    }
    
    // Update test assignment with completion details
    testAssignment = await TestAssignment.findOneAndUpdate(
      { assignment_id: assignmentId },
      {
        end_time: Date.now(),
        completion_status: 'completed',
        score: score || 0,
        updated_at: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Test completed successfully',
      data: testAssignment
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error completing test',
      error: error.message
    });
  }
};

/**
 * Submit test completion with full domain/subdomain score calculation
 * @route PUT /api/test-assignments/:id/complete-test
 * @access Private
 */
exports.completeTest = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // Find the test assignment
    const testAssignment = await TestAssignment.findOne({ assignment_id: assignmentId });
    
    if (!testAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Test assignment not found'
      });
    }
    
    // Security check - only the assigned candidate can complete the test
    if (req.user.role_id === 4 && 
        (!req.user.candidate_id || 
         req.user.candidate_id.toString() !== testAssignment.candidate_id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to complete this test'
      });
    }
    
    // Check if test is still available
    const now = new Date();
    const expiryDate = new Date(testAssignment.expiry_date);
    
    if (now > expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'This test has expired'
      });
    }
    
    // Check if test assignment has answers
    if (!testAssignment.answers || testAssignment.answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete test: No answers found. Please ensure all questions are answered before submitting.'
      });
    }
    
    console.log(`Calculating scores for assignment ${assignmentId} with ${testAssignment.answers.length} answers`);
    
    // Calculate domain and subdomain scores
    const scoreData = await calculateDomainSubdomainScores(testAssignment);
    
    console.log(`Score calculation completed for assignment ${assignmentId}:`, {
      totalScore: scoreData.totalScore,
      domainScores: scoreData.domainScores.length,
      subdomainScores: scoreData.subdomainScores.length
    });
    
    // Update the test assignment status to completed
    const updatedAssignment = await TestAssignment.findOneAndUpdate(
      { assignment_id: assignmentId },
      {
        completion_status: 'completed',
        end_time: Date.now(),
        score: scoreData.totalScore,
        domain_scores: scoreData.domainScores,
        subdomain_scores: scoreData.subdomainScores,
        updated_at: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    console.log(`Test assignment ${assignmentId} marked as completed with domain/subdomain scores`);
    
    return res.status(200).json({
      success: true,
      message: 'Test completed successfully with domain and subdomain scores calculated',
      data: {
        assignment_id: updatedAssignment.assignment_id,
        completion_status: updatedAssignment.completion_status,
        end_time: updatedAssignment.end_time,
        score: updatedAssignment.score,
        domain_scores: updatedAssignment.domain_scores,
        subdomain_scores: updatedAssignment.subdomain_scores
      }
    });
  } catch (error) {
    console.error('Error completing test with score calculation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error completing test',
      error: error.message
    });
  }
};

/**
 * Delete test assignment
 * @route DELETE /api/test-assignments/:id
 * @access Private
 */
exports.deleteTestAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // Find the test assignment
    const testAssignment = await TestAssignment.findOne({ assignment_id: assignmentId });
    
    if (!testAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Test assignment not found'
      });
    }
    
    // Only allow deletion if test has not been started or completed
    if (testAssignment.completion_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete test assignment that has been started or completed'
      });
    }
    
    await TestAssignment.deleteOne({ assignment_id: assignmentId });
    
    return res.status(200).json({
      success: true,
      message: 'Test assignment deleted successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting test assignment',
      error: error.message
    });
  }
};

/**
 * Create batch test assignments
 * @route POST /api/test-assignments/batch
 * @access Private
 */
exports.createBatchTestAssignments = async (req, res) => {
  try {
    // Extract fields from request body
    const {
      assignments
    } = req.body;
    
    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of assignments'
      });
    }
    
    const results = {
      success: [],
      failures: [],
      supervisor_assignments: [] // Track supervisor feedback assignments
    };
    
    // Process each assignment
    for (const assignment of assignments) {
      const {
        assignment_id,
        test_id,
        candidate_id,
        scheduled_date,
        expiry_date,
        supervisor_id,
        supervisor_test_id,
        auto_assign_supervisor
      } = assignment;
      
      try {
        // Validate test and candidate exist
        const testExists = await Test.findOne({ test_id });
        const candidateExists = await Candidate.findById(candidate_id);
        
        if (!testExists) {
          results.failures.push({
            assignment_id,
            message: `Test with ID ${test_id} not found`
          });
          continue;
        }
        
        if (!candidateExists) {
          results.failures.push({
            assignment_id,
            message: `Candidate with ID ${candidate_id} not found`
          });
          continue;
        }
        
        // Check if assignment already exists
        const assignmentExists = await TestAssignment.findOne({ 
          assignment_id
        });

        if (assignmentExists) {
          results.failures.push({
            assignment_id,
            message: 'Test assignment already exists'
          });
          continue;
        }
        
        // Create test assignment
        const testAssignment = await TestAssignment.create({
          assignment_id,
          test_id,
          candidate_id,
          scheduled_date,
          expiry_date,
          assigned_by: req.user._id,
          assignment_status: 1,
          candidate_name: candidateExists.cand_name || 'Unknown Candidate'
        });
        
        // Send notification to candidate if they have a user account
        try {
          if (candidateExists.user_account) {
            const io = req.app.get('io');
            const notificationHelper = new NotificationHelper(io);
            
            const assignmentData = {
              _id: testAssignment.assignment_id,
              assignment_id: testAssignment.assignment_id,
              test_name: testExists.test_name,
              due_date: expiry_date,
              scheduled_date: scheduled_date,
              expiry_date: expiry_date,
              test_id: test_id
            };
            
            const candidateUser = {
              _id: candidateExists.user_account
            };
            
            // Pass candidate and test data for email sending
            await notificationHelper.notifyTestAssignment(assignmentData, candidateUser, candidateExists, testExists);
            console.log(`Notification and email sent to candidate ${candidateExists.cand_name} for test assignment`);
            
            // Also notify admins about the test assignment
            await notificationHelper.notifyAdminTestAssignment(assignmentData, candidateExists, req.user._id);
            console.log(`Admin notifications sent for test assignment to ${candidateExists.cand_name}`);
          }
        } catch (notificationError) {
          console.error('Error sending test assignment notification:', notificationError);
          // Don't fail the assignment if notification fails
        }
        
        results.success.push({
          assignment_id,
          testAssignment
        });
        
        // Check if we should auto-assign to supervisor
        if (auto_assign_supervisor && 
            supervisor_id && 
            supervisor_test_id) {
          
          // Generate a unique assignment ID for supervisor
          const supervisorAssignmentId = parseInt(assignment_id) + 5000; // Add offset to ensure uniqueness
          
          try {
            // Find supervisor user to get name
            const User = require('../models/user.model');
            const supervisorUser = await User.findById(supervisor_id);
            
            // Check if supervisor assignment already exists
            const supervisorAssignmentExists = await TestAssignment.findOne({ 
              assignment_id: supervisorAssignmentId 
            });
            
            if (!supervisorAssignmentExists) {
              // For debugging
              console.log(`Creating supervisor assignment with test_id: ${supervisor_test_id} for candidate test_id: ${test_id}`);
              
              // Create supervisor feedback test assignment
              const supervisorAssignment = await TestAssignment.create({
                assignment_id: supervisorAssignmentId,
                test_id: supervisor_test_id, // Use the supervisor test ID specified
                candidate_id, // Keep the same candidate ID for reference
                scheduled_date,
                expiry_date,
                assigned_by: req.user._id,
                assignment_status: 1,
                is_supervisor_feedback: true,
                supervisor_id,
                linked_assignment_id: assignment_id,
                candidate_name: candidateExists.cand_name || 'Unknown Candidate',
                supervisor_name: supervisorUser ? supervisorUser.username : 'Unknown Supervisor'
              });
              
              // Update the original assignment to link to the supervisor assignment
              await TestAssignment.findByIdAndUpdate(
                testAssignment._id,
                {
                  $push: { linked_assignments: supervisorAssignmentId }
                }
              );
              
              results.supervisor_assignments.push({
                assignment_id: supervisorAssignmentId,
                candidate_id,
                supervisor_id,
                supervisorAssignment
              });
            }
          } catch (error) {
            console.error(`Error creating supervisor assignment for ${assignment_id}:`, error);
            // Don't fail the main assignment if supervisor assignment fails
          }
        }
      } catch (error) {
        console.error(`Error creating assignment ${assignment_id}:`, error);
        results.failures.push({
          assignment_id,
          message: error.message
        });
      }
    }
    
    return res.status(201).json({
      success: true,
      message: `Created ${results.success.length} test assignments, ${results.supervisor_assignments.length} supervisor assignments, failed ${results.failures.length}`,
      data: results
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error creating batch test assignments',
      error: error.message
    });
  }
};

/**
 * Get test assignments for a specific candidate
 * @route GET /api/test-assignments/candidate/:id
 * @access Private
 */
exports.getCandidateAssignments = async (req, res) => {
  try {
    const candidateId = req.params.id;
    
    // Security check - if user is a candidate (role_id 4), they can only view their own assignments
    // Add debugging to find candidate_id issues
    console.log('getCandidateAssignments - Request params:', req.params);
    console.log('getCandidateAssignments - User data:', {
      id: req.user._id,
      username: req.user.username,
      role_id: req.user.role_id,
      candidate_id: req.user.candidate_id
    });
    
    if (req.user.role_id === 4 && (!req.user.candidate_id || req.user.candidate_id.toString() !== candidateId)) {
      console.log('getCandidateAssignments - Security check failed. User candidate_id:', 
                  req.user.candidate_id, 'Requested candidate_id:', candidateId);
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view assignments for this candidate'
      });
    }
    
    // Find all test assignments for this candidate - EXCLUDE supervisor feedback tests
    const assignments = await TestAssignment.find({ 
      candidate_id: candidateId,
      assignment_status: 1, // Only active assignments
      is_supervisor_feedback: { $ne: true } // Exclude supervisor feedback tests
    }).sort({ scheduled_date: -1 });
    
    // Fetch test details for each assignment
    const populatedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const test = await Test.findOne({ test_id: assignment.test_id });
        return {
          ...assignment.toObject(),
          test: test || { test_name: 'Unknown Test' }
        };
      })
    );
    
    return res.status(200).json({
      success: true,
      count: assignments.length,
      data: populatedAssignments
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving candidate test assignments',
      error: error.message
    });
  }
};

/**
 * Check for candidates nearing probation end date (without creating assignments)
 * @route GET /api/test/check-probation-candidates
 * @access Private - Admin only
 */
exports.checkProbationTests = async (req, res) => {
  try {
    const Candidate = require('../models/candidate.model');
    
    // Get current date
    const now = new Date();
    
    // Set the window for probation end date check (14 days in the future)
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + 14); 
    
    console.log('Checking for candidates with probation ending between:', now.toISOString(), 'and', futureDate.toISOString());
    
    // Find candidates on probation with end date approaching
    const candidates = await Candidate.find({
      candidate_type: 'probation',
      probation_end_date: { 
        $gte: now,
        $lte: futureDate
      }
    }).populate('user_account');
    
    console.log('Found candidates approaching probation end:', candidates.length);
    
    if (candidates.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No candidates with approaching probation end dates found',
        data: []
      });
    }
    
    // Format the candidate data for the response
    const candidateData = candidates.map(candidate => ({
      _id: candidate._id,
      name: candidate.cand_name,
      email: candidate.cand_email,
      probation_end_date: candidate.probation_end_date,
      days_remaining: Math.ceil((new Date(candidate.probation_end_date) - now) / (1000 * 60 * 60 * 24))
    }));
    
    return res.status(200).json({
      success: true,
      message: `Found ${candidates.length} candidates approaching probation end`,
      data: candidateData
    });
    
  } catch (error) {
    console.error('Error checking probation candidates:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking probation candidates',
      error: error.message
    });
  }
};

// Helper function to generate a unique assignment ID
async function generateUniqueAssignmentId() {
  const TestAssignment = require('../models/test-assignment.model');
  
  // Get the highest current assignment_id
  const highestAssignment = await TestAssignment.findOne()
    .sort({ assignment_id: -1 })
    .limit(1);
  
  let nextId = 1000; // Start from 1000 if no assignments exist
  
  if (highestAssignment && highestAssignment.assignment_id) {
    // Increment the highest ID by 1
    nextId = parseInt(highestAssignment.assignment_id) + 1;
  }
  
  return nextId.toString();
}

/**
 * Get supervisor test assignments
 * @route GET /api/test-assignments/supervisor
 * @access Private
 */
exports.getSupervisorAssignments = async (req, res) => {
  try {
    let query = { is_supervisor_feedback: true };
    
    // If user is not an admin, only show assignments for this supervisor
    if (req.user.role_id !== 1) {
      query.supervisor_id = req.user._id.toString();
    }
    
    console.log('Fetching supervisor assignments with query:', query);
    
    const supervisorAssignments = await TestAssignment.find(query)
      .sort({ created_at: -1 });
    
    console.log(`Found ${supervisorAssignments.length} supervisor assignments`);
    
    // Get unique candidate, test, and user IDs
    const candidateIds = [...new Set(supervisorAssignments.map(ta => ta.candidate_id).filter(id => id))];
    const testIds = [...new Set(supervisorAssignments.map(ta => ta.test_id).filter(id => id))];
    const userIds = [...new Set(supervisorAssignments.map(ta => ta.assigned_by).filter(id => id))];
    
    // Fetch related data
    const User = require('../models/user.model');
    const [candidates, tests, users] = await Promise.all([
      Candidate.find({ _id: { $in: candidateIds } }).lean(),
      Test.find({ test_id: { $in: testIds } }).lean(),
      User.find({ _id: { $in: userIds } }).lean()
    ]);
    
    // Create lookup maps
    const candidateMap = new Map(candidates.map(c => [c._id.toString(), c]));
    const testMap = new Map(tests.map(t => [t.test_id, t]));
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    // Populate and format assignments
    const populatedAssignments = supervisorAssignments.map(assignment => {
      const assignmentObj = assignment.toObject();
      
      // Populate candidate
      if (assignment.candidate_id && candidateMap.has(assignment.candidate_id.toString())) {
        const candidate = candidateMap.get(assignment.candidate_id.toString());
        assignmentObj.candidate_id = {
          _id: candidate._id,
          candidate_name: candidate.cand_name,
          email: candidate.cand_email,
          candidate_type: candidate.candidate_type
        };
      }
      
      // Populate test
      if (assignment.test_id && testMap.has(assignment.test_id)) {
        const test = testMap.get(assignment.test_id);
        assignmentObj.test_id = {
          _id: test._id,
          test_id: test.test_id,
          test_name: test.test_name,
          test_type: test.test_type
        };
      }
      
      // Populate assigned_by
      if (assignment.assigned_by && userMap.has(assignment.assigned_by.toString())) {
        const user = userMap.get(assignment.assigned_by.toString());
        assignmentObj.assigned_by = {
          _id: user._id,
          username: user.username
        };
      }
      
      return assignmentObj;
    });
    
    return res.status(200).json({
      success: true,
      count: populatedAssignments.length,
      data: populatedAssignments
    });
  } catch (error) {
    console.error('Error getting supervisor assignments:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving supervisor assignments',
      error: error.message
    });
  }
};

/**
 * Get linked assignments (both candidate and supervisor)
 * @route GET /api/test-assignments/linked/:id
 * @access Private
 */
exports.getLinkedAssignments = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // Find the main assignment
    const mainAssignment = await TestAssignment.findOne({ assignment_id: assignmentId });
    
    if (!mainAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    let linkedAssignments = [];
    
    if (mainAssignment.is_supervisor_feedback) {
      // If this is a supervisor assignment, find the candidate assignment
      const candidateAssignment = await TestAssignment.findOne({ 
        assignment_id: mainAssignment.linked_assignment_id 
      });
      
      if (candidateAssignment) {
        linkedAssignments.push(candidateAssignment);
      }
    } else {
      // If this is a candidate assignment, find supervisor assignments
      if (mainAssignment.linked_assignments && mainAssignment.linked_assignments.length > 0) {
        const supervisorAssignments = await TestAssignment.find({
          assignment_id: { $in: mainAssignment.linked_assignments }
        });
        
        linkedAssignments = supervisorAssignments;
      }
    }
    
    // Get unique test IDs
    const testIds = [
      mainAssignment.test_id,
      ...linkedAssignments.map(a => a.test_id)
    ].filter((id, index, self) => id && self.indexOf(id) === index);
    
    // Fetch test data
    const tests = await Test.find({ test_id: { $in: testIds } }).lean();
    const testMap = new Map(tests.map(t => [t.test_id, t]));
    
    // Format main assignment
    const mainAssignmentObj = mainAssignment.toObject();
    if (mainAssignmentObj.test_id && testMap.has(mainAssignmentObj.test_id)) {
      mainAssignmentObj.test = testMap.get(mainAssignmentObj.test_id);
    }
    
    // Format linked assignments
    const formattedLinkedAssignments = linkedAssignments.map(assignment => {
      const assignmentObj = assignment.toObject();
      if (assignmentObj.test_id && testMap.has(assignmentObj.test_id)) {
        assignmentObj.test = testMap.get(assignmentObj.test_id);
      }
      return assignmentObj;
    });
    
    return res.status(200).json({
      success: true,
      data: {
        mainAssignment: mainAssignmentObj,
        linkedAssignments: formattedLinkedAssignments
      }
    });
  } catch (error) {
    console.error('Error getting linked assignments:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving linked assignments',
      error: error.message
    });
  }
};

/**
 * Get test questions for a specific assignment
 * @route GET /api/test-assignments/:id/questions
 * @access Private
 */
exports.getTestQuestions = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // Find the test assignment
    const testAssignment = await TestAssignment.findOne({ assignment_id: assignmentId });
    
    if (!testAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Test assignment not found'
      });
    }
    
    // Security check - different authorization for different user types
    const isAdmin = req.user.role_id === 1;
    const isCandidate = req.user.role_id === 4;
    const isSupervisor = !isAdmin && !isCandidate; // Any other role is considered supervisor for now
    
    // For regular candidate tests
    if (!testAssignment.is_supervisor_feedback) {
      // Only the assigned candidate or admin can access
      const isAssignedCandidate = isCandidate && req.user.candidate_id && 
                               req.user.candidate_id.toString() === testAssignment.candidate_id.toString();
      
      if (!isAdmin && !isAssignedCandidate) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access these questions'
        });
      }
    } 
    // For supervisor feedback tests
    else {
      // Only the assigned supervisor or admin can access
      const isAssignedSupervisor = isSupervisor && 
                                 testAssignment.supervisor_id === req.user._id.toString();
      
      if (!isAdmin && !isAssignedSupervisor) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access this feedback form'
        });
      }
    }
    
    // Update start time and status if this is the first time accessing the test
    if (testAssignment.completion_status === 'pending') {
      testAssignment.start_time = Date.now();
      testAssignment.completion_status = 'started';
      await testAssignment.save();
    }
    
    // Get the test details
    const test = await Test.findOne({ test_id: testAssignment.test_id });
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }
    
    // Get candidate details if this is a supervisor feedback test
    let candidateData = null;
    if (testAssignment.is_supervisor_feedback && testAssignment.candidate_id) {
      const candidate = await Candidate.findById(testAssignment.candidate_id);
      if (candidate) {
        candidateData = {
          id: candidate._id,
          name: candidate.cand_name,
          email: candidate.cand_email,
          employeeId: candidate.employee_id
        };
      }
    }
    
    // Get organization details for terms and conditions
    let organizationData = null;
    if (testAssignment.candidate_id) {
      const candidate = await Candidate.findById(testAssignment.candidate_id);
      if (candidate && candidate.org_id) {
        const organization = await Organization.findOne({ org_id: candidate.org_id });
        if (organization) {
          organizationData = {
            org_id: organization.org_id,
            org_name: organization.org_name,
            terms_and_conditions: organization.terms_and_conditions
          };
        }
      }
    }
    
    // Get all questions for this test
    const Question = require('../models/question.model');
    const questions = await Question.find({
      test_ids: { $in: [testAssignment.test_id] }
    }).select('-__v -created_by -updated_by -created_at -updated_at');
    
    // Filter out sensitive information from questions
    const sanitizedQuestions = questions.map(question => {
      // Mark correct answers only for admin users
      const sanitizedOptions = question.options.map(option => ({
        _id: option._id,
        option_text: option.option_text,
        // Only include is_correct for admins
        ...(isAdmin ? { is_correct: option.is_correct } : {}),
        // Only include score for admins
        ...(isAdmin ? { score: option.score } : {})
      }));
      
      return {
        ...question.toObject(),
        options: sanitizedOptions
      };
    });
    
    // Include candidate's existing answers if any
    const existingAnswers = testAssignment.answers || [];
    
    // Prepare response data
    const responseData = {
      test: {
        test_id: test.test_id,
        test_name: test.test_name,
        instruction: test.instruction,
        closing_remarks: test.closing_remarks,
        duration_minutes: test.duration_minutes || 60,
        is_supervisor_feedback: testAssignment.is_supervisor_feedback
      },
      questions: sanitizedQuestions,
      answers: existingAnswers,
      start_time: testAssignment.start_time,
      expiry_date: testAssignment.expiry_date
    };
    
    // Add organization data if available
    if (organizationData) {
      responseData.organization = organizationData;
    }
    
    // Add candidate data if this is a supervisor feedback test
    if (candidateData) {
      responseData.candidate = candidateData;
    }
    
    return res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving test questions',
      error: error.message
    });
  }
};

/**
 * Submit answer for a test question
 * @route POST /api/test-assignments/:id/submit-answer
 * @access Private
 */
exports.submitAnswer = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { question_id, answer } = req.body;
    
    if (!question_id || answer === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Question ID and answer are required'
      });
    }
    
    // Find the test assignment
    const testAssignment = await TestAssignment.findOne({ assignment_id: assignmentId });
    
    if (!testAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Test assignment not found'
      });
    }
    
    // Security check - only the assigned candidate can submit answers
    if (req.user.role_id === 4 && 
        (!req.user.candidate_id || 
         req.user.candidate_id.toString() !== testAssignment.candidate_id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to submit answers for this test'
      });
    }
    
    // Check if test is still available
    const now = new Date();
    const expiryDate = new Date(testAssignment.expiry_date);
    
    if (now > expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'This test has expired and cannot accept answers'
      });
    }
    
    if (testAssignment.completion_status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This test is already completed and cannot accept new answers'
      });
    }
    
    // Get question details to calculate score
    const Question = require('../models/question.model');
    const question = await Question.findOne({ question_id: parseInt(question_id) });
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Calculate score based on the selected option
    let scoreObtained = 0;
    let maxScore = 0;
    
        if (question.options && question.options.length > 0) {
      // Find max score from all options
      maxScore = Math.max(...question.options.map(opt => opt.score || 0));
      
      // Find the score for the selected answer
      if (question.question_type === 'single_choice' || question.question_type === 'likert_scale') {
        // First try exact match with option text
        let selectedOption = question.options.find(opt => opt.option_text === answer);
        
        // If no match and it's a numeric answer (for likert scale), try to find by index or score
        if (!selectedOption && question.question_type === 'likert_scale' && !isNaN(answer)) {
          const answerNum = parseInt(answer);
          // Try to match by score value
          selectedOption = question.options.find(opt => opt.score === answerNum);
          // If still no match, try by index (1-based)
          if (!selectedOption && answerNum >= 1 && answerNum <= question.options.length) {
            selectedOption = question.options[answerNum - 1];
          }
        }
        
        scoreObtained = selectedOption ? (selectedOption.score || 0) : 0;
      }
    }
    
    // Update or add the answer
    const answers = testAssignment.answers || [];
    const existingAnswerIndex = answers.findIndex(a => a.question_id === parseInt(question_id));
    
    if (existingAnswerIndex >= 0) {
      // Update existing answer
      answers[existingAnswerIndex].answer = answer;
      answers[existingAnswerIndex].score_obtained = scoreObtained;
      answers[existingAnswerIndex].max_score = maxScore;
      answers[existingAnswerIndex].answered_at = Date.now();
    } else {
      // Add new answer
      answers.push({
        question_id: parseInt(question_id),
        answer,
        score_obtained: scoreObtained,
        max_score: maxScore,
        answered_at: Date.now()
      });
    }
    
    // Update the test assignment
    const updatedAssignment = await TestAssignment.findOneAndUpdate(
      { assignment_id: assignmentId },
      {
        answers,
        updated_at: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        question_id,
        answer
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error submitting answer',
      error: error.message
    });
  }
};

/**
 * Log candidate activity during test
 * @route POST /api/test-assignments/:id/log-activity
 * @access Private
 */
exports.logActivity = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { activity_type, data, timestamp } = req.body;

    // Find the test assignment
    const testAssignment = await TestAssignment.findOne({ assignment_id: assignmentId });

    if (!testAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Test assignment not found'
      });
    }

    // Security check - only the assigned candidate can log activity
    if (req.user.role_id === 4 && 
        (!req.user.candidate_id || 
         req.user.candidate_id.toString() !== testAssignment.candidate_id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to log activity for this test'
      });
    }

    // Initialize activity_log if it doesn't exist
    if (!testAssignment.activity_log) {
      testAssignment.activity_log = [];
    }

    // Add the activity log entry
    testAssignment.activity_log.push({
      activity_type, // 'page_change', 'question_start', 'question_end', 'fullscreen_exit', 'fullscreen_enter', 'option_select'
      data, // Additional data like page number, question id, time spent, etc.
      timestamp: timestamp || Date.now()
    });

    // Track fullscreen violations and offscreen time
    if (activity_type === 'fullscreen_exit') {
      testAssignment.fullscreen_violations = (testAssignment.fullscreen_violations || 0) + 1;
    } else if (activity_type === 'fullscreen_enter' && data.offscreen_duration) {
      testAssignment.total_offscreen_time = (testAssignment.total_offscreen_time || 0) + data.offscreen_duration;
    }

    // Save the updated assignment
    await testAssignment.save();

    return res.status(200).json({
      success: true,
      message: 'Activity logged successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error logging activity',
      error: error.message
    });
  }
};

/**
 * Save current page progress
 * @route PUT /api/test-assignments/:id/save-progress
 * @access Private
 */
exports.saveProgress = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { current_page, total_pages, page_answers } = req.body;

    // Find the test assignment
    const testAssignment = await TestAssignment.findOne({ assignment_id: assignmentId });

    if (!testAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Test assignment not found'
      });
    }

    // Security check - only the assigned candidate can save progress
    if (req.user.role_id === 4 && 
        (!req.user.candidate_id || 
         req.user.candidate_id.toString() !== testAssignment.candidate_id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to save progress for this test'
      });
    }

    // Update the test assignment with progress data
    const updatedAssignment = await TestAssignment.findOneAndUpdate(
      { assignment_id: assignmentId },
      {
        current_page: current_page || 0,
        total_pages: total_pages || 1,
        page_completed: current_page || 0,
        updated_at: Date.now()
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Progress saved successfully',
      data: {
        current_page: updatedAssignment.current_page,
        total_pages: updatedAssignment.total_pages
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error saving progress',
      error: error.message
    });
  }
};

/**
 * Calculate domain and subdomain scores for a test assignment
 * @param {Object} testAssignment - The test assignment object
 * @returns {Object} - Object containing domain scores, subdomain scores, and total score
 */
async function calculateDomainSubdomainScores(testAssignment) {
  try {
    const Question = require('../models/question.model');
    const Domain = require('../models/domain.model');
    const SubDomain = require('../models/subdomain.model');
    
    // Get all question details for this test
    const questionIds = testAssignment.answers.map(answer => answer.question_id);
    const questions = await Question.find({ question_id: { $in: questionIds } });
    
    // Get all domains and subdomains for reference
    const domains = await Domain.find({});
    const subdomains = await SubDomain.find({});
    
    // Create maps for easy lookup
    const domainMap = new Map(domains.map(d => [d.domain_id, d.domain_name]));
    const subdomainMap = new Map(subdomains.map(s => [s.subdomain_id, { name: s.subdomain_name, domain_id: s.domain_id }]));
    
    // Initialize score tracking objects
    const domainScores = new Map();
    const subdomainScores = new Map();
    
    let totalObtained = 0;
    let totalMax = 0;
    
    // Process each answer
    for (const answer of testAssignment.answers) {
      const question = questions.find(q => q.question_id === answer.question_id);
      if (!question) continue;
      
      const obtained = answer.score_obtained || 0;
      const maxScore = answer.max_score || 0;
      
      totalObtained += obtained;
      totalMax += maxScore;
      
      // Process domain scores
      if (question.domain_id) {
        if (!domainScores.has(question.domain_id)) {
          domainScores.set(question.domain_id, {
            domain_id: question.domain_id,
            domain_name: domainMap.get(question.domain_id) || 'Unknown Domain',
            obtained_score: 0,
            max_score: 0,
            percentage: 0
          });
        }
        
        const domainScore = domainScores.get(question.domain_id);
        domainScore.obtained_score += obtained;
        domainScore.max_score += maxScore;
        domainScore.percentage = domainScore.max_score > 0 ? 
          Math.round((domainScore.obtained_score / domainScore.max_score) * 100) : 0;
      }
      
      // Process subdomain scores
      if (question.subdomain_id) {
        if (!subdomainScores.has(question.subdomain_id)) {
          const subdomainInfo = subdomainMap.get(question.subdomain_id);
          subdomainScores.set(question.subdomain_id, {
            subdomain_id: question.subdomain_id,
            subdomain_name: subdomainInfo ? subdomainInfo.name : 'Unknown Subdomain',
            domain_id: subdomainInfo ? subdomainInfo.domain_id : null,
            obtained_score: 0,
            max_score: 0,
            percentage: 0
          });
        }
        
        const subdomainScore = subdomainScores.get(question.subdomain_id);
        subdomainScore.obtained_score += obtained;
        subdomainScore.max_score += maxScore;
        subdomainScore.percentage = subdomainScore.max_score > 0 ? 
          Math.round((subdomainScore.obtained_score / subdomainScore.max_score) * 100) : 0;
      }
    }
    
    // Calculate total percentage
    const totalPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    
    return {
      totalScore: totalPercentage,
      domainScores: Array.from(domainScores.values()),
      subdomainScores: Array.from(subdomainScores.values())
    };
  } catch (error) {
    console.error('Error calculating domain/subdomain scores:', error);
    return {
      totalScore: 0,
      domainScores: [],
      subdomainScores: []
    };
  }
}

/**
 * Get detailed scores for a test assignment
 * @route GET /api/test-assignments/:id/detailed-scores
 * @access Private
 */
exports.getDetailedScores = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // Find the test assignment by MongoDB _id
    const testAssignment = await TestAssignment.findById(assignmentId);
    
    if (!testAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Test assignment not found'
      });
    }
    
    // Check if test is completed
    if (testAssignment.completion_status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Test is not completed yet. Scores are only available for completed tests.'
      });
    }

    // Process domain scores for frontend
    const domain_scores = {};
    if (testAssignment.domain_scores && testAssignment.domain_scores.length > 0) {
      testAssignment.domain_scores.forEach(domain => {
        const domainKey = domain.domain_name?.toLowerCase().replace(/\s+/g, '_') || 'unknown';
        domain_scores[domainKey] = parseFloat(domain.percentage.toFixed(1)) || 0;
      });
    }

    // Process subdomain scores for frontend - ensure they're properly formatted
    const subdomain_scores = [];
    if (testAssignment.subdomain_scores && testAssignment.subdomain_scores.length > 0) {
      testAssignment.subdomain_scores.forEach(subdomain => {
        subdomain_scores.push({
          subdomain_id: subdomain.subdomain_id,
          subdomain_name: subdomain.subdomain_name || 'Unknown Subdomain',
          domain_id: subdomain.domain_id,
          percentage: parseFloat(subdomain.percentage.toFixed(1)) || 0
        });
      });
    }

    // Calculate activity analytics
    const activityAnalytics = {
      totalDuration: 0,
      fullscreenViolations: testAssignment.fullscreen_violations || 0,
      offscreenTime: testAssignment.total_offscreen_time || 0,
      totalPages: testAssignment.total_pages || 1,
      activityLog: testAssignment.activity_log || [],
      questionTimes: {}
    };

    // Calculate total duration from start and end time
    if (testAssignment.start_time && testAssignment.end_time) {
      activityAnalytics.totalDuration = new Date(testAssignment.end_time) - new Date(testAssignment.start_time);
    }

    // Process question times from activity log
    const questionTimeMap = new Map();
    const questionStartTimes = new Map();
    
    console.log('Processing activity analytics for assignment:', testAssignment.assignment_id);
    console.log('Activity log length:', testAssignment.activity_log?.length || 0);
    console.log('Full activity logs:', JSON.stringify(testAssignment.activity_log, null, 2));
    
    if (testAssignment.activity_log && testAssignment.activity_log.length > 0) {
      // Sort activity log by timestamp
      const sortedLogs = testAssignment.activity_log.sort((a, b) => a.timestamp - b.timestamp);
      
      console.log('Processing', sortedLogs.length, 'activity log entries');
      
      for (let i = 0; i < sortedLogs.length; i++) {
        const log = sortedLogs[i];
        
        // Process question_time events (most accurate timing from frontend)
        if (log.activity_type === 'question_time' && log.data?.question_id && log.data?.time_spent) {
          const questionId = log.data.question_id;
          console.log('Found question_time for question:', questionId, 'time:', log.data.time_spent, 'ms');
          
          if (!questionTimeMap.has(questionId)) {
            questionTimeMap.set(questionId, {
              total_time: 0,
              view_count: 0,
              navigation_events: []
            });
          }
          
          const questionData = questionTimeMap.get(questionId);
          questionData.total_time += log.data.time_spent;
          questionData.view_count += 1;
          questionData.navigation_events.push({
            time_spent: log.data.time_spent,
            navigation_type: log.data.navigation_type || 'unknown',
            timestamp: log.timestamp
          });
        }
        // Keep track of question starts for fallback calculation
        else if (log.activity_type === 'question_start' && log.data?.question_id) {
          questionStartTimes.set(log.data.question_id, log.timestamp);
          console.log('Found question_start for question:', log.data.question_id);
        }
      }
      
      // Fallback: Calculate times from question_start/option_select pairs for questions without question_time events
      for (let i = 0; i < sortedLogs.length; i++) {
        const log = sortedLogs[i];
        
        if (log.activity_type === 'option_select' && log.data?.question_id) {
          const questionId = log.data.question_id;
          
          // Only process if we don't already have timing data from question_time events
          if (!questionTimeMap.has(questionId)) {
            const startTime = questionStartTimes.get(questionId);
            
            if (startTime) {
              const timeSpent = log.timestamp - startTime;
              console.log('Fallback calculation for question', questionId, ':', timeSpent, 'ms');
              
              questionTimeMap.set(questionId, {
                total_time: timeSpent,
                view_count: 1,
                navigation_events: [{
                  time_spent: timeSpent,
                  navigation_type: 'answer_selection_fallback',
                  timestamp: log.timestamp,
                  answer: log.data.answer
                }]
              });
            }
          }
        }
      }
      
      // Handle final question on test submission
      const testSubmitLog = sortedLogs.find(log => log.activity_type === 'test_submit');
      if (testSubmitLog) {
        console.log('Processing test_submit event');
        
        // Find the most recent question_start that doesn't have timing data
        for (let j = sortedLogs.length - 1; j >= 0; j--) {
          const prevLog = sortedLogs[j];
          if (prevLog.activity_type === 'question_start' && prevLog.data?.question_id) {
            const questionId = prevLog.data.question_id;
            
            // Only add if this question has no timing data yet
            if (!questionTimeMap.has(questionId)) {
              const timeSpent = testSubmitLog.timestamp - prevLog.timestamp;
              
              console.log('Calculated final question time for', questionId, ':', timeSpent, 'ms');
              
              questionTimeMap.set(questionId, {
                total_time: timeSpent,
                view_count: 1,
                navigation_events: [{
                  time_spent: timeSpent,
                  navigation_type: 'test_completion',
                  timestamp: testSubmitLog.timestamp
                }]
              });
              break; // Only process the most recent unprocessed question
            }
          }
        }
      }
      
      console.log('Processed question times for', questionTimeMap.size, 'questions');
      
      // Convert to the format expected by frontend
      questionTimeMap.forEach((data, questionId) => {
        activityAnalytics.questionTimes[questionId] = {
          time_spent: Math.round(data.total_time), // Total time in milliseconds
          time_spent_seconds: Math.round(data.total_time / 1000), // Total time in seconds
          view_count: data.view_count,
          average_time: data.view_count > 0 ? Math.round(data.total_time / data.view_count) : 0,
          navigation_events: data.navigation_events
        };
        
        console.log('Final question times for', questionId, ':', activityAnalytics.questionTimes[questionId]);
      });
    } else {
      console.log('No activity log found for assignment:', testAssignment.assignment_id);
    }

    // Legacy fallback - process from question_times if available
    if (testAssignment.question_times && testAssignment.question_times.length > 0) {
      testAssignment.question_times.forEach((qt, index) => {
        const questionId = qt.question_id || `question_${index}`;
        
        // Only add if not already processed from activity log
        if (!activityAnalytics.questionTimes[questionId]) {
          activityAnalytics.questionTimes[questionId] = {
            time_spent: qt.time_spent || 0,
            time_spent_seconds: Math.round((qt.time_spent || 0) / 1000),
            view_count: qt.view_count || 1,
            average_time: qt.time_spent || 0,
            navigation_events: []
          };
        }
      });
    }

    // Return the data structure expected by the frontend
    return res.status(200).json({
      success: true,
      data: {
        assignment_id: testAssignment.assignment_id,
        overall_score: parseFloat((testAssignment.overall_score || testAssignment.score || 0).toFixed(1)),
        total_questions: testAssignment.answers ? testAssignment.answers.length : 0,
        total_answered: testAssignment.answers ? testAssignment.answers.filter(a => a.answer).length : 0,
        completion_status: testAssignment.completion_status,
        start_time: testAssignment.start_time,
        end_time: testAssignment.end_time,
        domain_scores: domain_scores,
        subdomain_scores: subdomain_scores,
        // Enhanced analytics data
        activityAnalytics: activityAnalytics
      }
    });
  } catch (error) {
    console.error('Error getting detailed scores:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving detailed scores',
      error: error.message
    });
  }
};

/**
 * Get all results with scores for dashboard
 * @route GET /api/test/results
 * @access Private
 */
exports.getAllResultsWithScores = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {
      completion_status: { $in: ['completed', 'in_progress', 'not_started'] }
    };

    // Get all completed test assignments
    const totalAssignments = await TestAssignment.countDocuments(query);
    const testAssignments = await TestAssignment.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get unique candidate and test IDs
    const candidateIds = [...new Set(testAssignments.map(ta => ta.candidate_id).filter(id => id))];
    const testIds = [...new Set(testAssignments.map(ta => ta.test_id).filter(id => id))];
    
    // Fetch related data
    const [candidates, tests] = await Promise.all([
      Candidate.find({ _id: { $in: candidateIds } }).lean(),
      Test.find({ test_id: { $in: testIds } }).lean()
    ]);
    
    // Create lookup maps
    const candidateMap = new Map(candidates.map(c => [c._id.toString(), c]));
    const testMap = new Map(tests.map(t => [t.test_id, t]));
    
    // Process assignments to include score data
    const results = testAssignments.map(assignment => {
      const candidate = candidateMap.get(assignment.candidate_id?.toString());
      const test = testMap.get(assignment.test_id);
      
      // Ensure we have a valid overall_score
      const score = assignment.overall_score || assignment.score || 0;
      // Format to 1 decimal place for consistency
      const formattedScore = parseFloat(score).toFixed(1);
      
      return {
        _id: assignment._id,
        candidate_name: candidate?.cand_name || assignment.candidate_name || 'Unknown Candidate',
        candidate_email: candidate?.cand_email || 'No Email',
        test_name: test?.test_name || 'Unknown Test',
        completion_status: assignment.completion_status || 'not_started',
        overall_score: parseFloat(formattedScore), // Convert back to number after formatting
        completed_at: assignment.completed_at || assignment.end_time,
        created_at: assignment.created_at,
        test_duration: test?.test_duration
      };
    });
    
    return res.status(200).json({
      success: true,
      count: results.length,
      total: totalAssignments,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalAssignments / limit)
      },
      data: results
    });
  } catch (error) {
    console.error('Error getting all results with scores:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving results',
      error: error.message
    });
  }
};

/**
 * Generate psychometric analysis for a test assignment
 * @route POST /api/test-assignments/:id/psychometric-analysis
 * @access Private
 */
exports.generatePsychometricAnalysis = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // Find the test assignment by MongoDB _id
    const testAssignment = await TestAssignment.findById(assignmentId);
    
    if (!testAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Test assignment not found'
      });
    }
    
    // Check if test is completed
    if (testAssignment.completion_status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Test must be completed before generating psychometric analysis'
      });
    }
    
    // Get candidate details
    const candidate = await Candidate.findById(testAssignment.candidate_id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Get all questions for this test
    const Question = require('../models/question.model');
    const questions = await Question.find({
      test_ids: { $in: [testAssignment.test_id] }
    });
    
    // Get Domain and SubDomain models for proper structure
    const Domain = require('../models/domain.model');
    const SubDomain = require('../models/subdomain.model');
    
    const [domains, subdomains] = await Promise.all([
      Domain.find({}),
      SubDomain.find({})
    ]);
    
    // Create lookup maps
    const domainMap = new Map(domains.map(d => [d.domain_id, d.domain_name]));
    const subdomainMap = new Map(subdomains.map(s => [s.subdomain_id, { name: s.subdomain_name, domain_id: s.domain_id }]));
    
    // Prepare scores array with domains and their subdomains
    const scores = [];
    
    if (testAssignment.domain_scores && testAssignment.domain_scores.length > 0) {
      testAssignment.domain_scores.forEach(domain => {
        // Get related subdomains for this domain
        const relatedSubdomains = (testAssignment.subdomain_scores || [])
          .filter(sub => sub.domain_id === domain.domain_id)
          .map(sub => ({
            name: sub.subdomain_name.toUpperCase(),
            score: Math.round(sub.percentage || 0)
          }));
        
        scores.push({
          name: domain.domain_name,
          score: Math.round(domain.percentage || 0),
          subdomains: relatedSubdomains
        });
      });
    }
    
    // Prepare items with subdomain mapping and answers
    const sub_domains = [];
    const question_selected = [];
    const questionsText = []; // New array for question texts
    
    if (testAssignment.answers && testAssignment.answers.length > 0) {
      testAssignment.answers.forEach(answer => {
        const question = questions.find(q => q.question_id === answer.question_id);
        if (question && question.subdomain_id) {
          const subdomainInfo = subdomainMap.get(question.subdomain_id);
          if (subdomainInfo) {
            sub_domains.push(subdomainInfo.name.toUpperCase());
            question_selected.push(answer.answer);
            if (question.question_text) {
              questionsText.push(question.question_text);
            }
          }
        }
      });
    }
    
    const items = {
      sub_domains: sub_domains,
      question_selected: question_selected,
      questions: questionsText
    };
    
    // Prepare the request payload for the external API
    const requestPayload = {
      scores: scores,
      items: items,
      session_id: testAssignment.assignment_id.toString(),
      candidate_name: candidate.cand_name || 'Unknown Candidate'
    };
    
    console.log('=== DYNAMIC PSYCHOMETRIC ANALYSIS REQUEST ===');
    console.log('Using LIVE data from portal test assignment:');
    console.log({
      candidate_name: candidate.cand_name,
      assignment_id: testAssignment.assignment_id,
      test_completion_status: testAssignment.completion_status,
      domains_extracted: scores.length,
      total_subdomains: scores.reduce((acc, domain) => acc + domain.subdomains.length, 0),
      actual_questions_answered: sub_domains.length,
      candidate_overall_score: testAssignment.score || 0
    });
    
    console.log('Domain scores being sent (from portal calculation):');
    scores.forEach(domain => {
      console.log(`  - ${domain.name}: ${domain.score}% (${domain.subdomains.length} subdomains)`);
    });
    
    console.log('Sample question mappings (from portal answers):');
    sub_domains.slice(0, 5).forEach((subdomain, index) => {
      console.log(`  - Q${index + 1}: ${subdomain} → "${question_selected[index]}" (Question: ${questionsText[index] ? questionsText[index].substring(0, 30) + '...' : 'N/A'})`);
    });
    
    console.log('Full dynamic payload being sent to AI:', JSON.stringify(requestPayload, null, 2));
    console.log('===============================================');
    
    // Make the API call to the external psychometric analysis service
    try {
      const apiResponse = await axios.post('https://npi-ai.nust.edu.pk/analysis/', requestPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 600000 // 60 second timeout for testing
      });
      
      console.log('Psychometric analysis response received:', {
        status: apiResponse.status,
        hasData: !!apiResponse.data
      });
      
      // Store the analysis result in the test assignment for future reference
      const updatedAssignment = await TestAssignment.findByIdAndUpdate(
        testAssignment._id,
        {
          psychometric_analysis: {
            analysis_data: apiResponse.data,
            generated_at: new Date(),
            api_version: '1.0',
            request_payload: requestPayload // Store the payload for debugging
          },
          updated_at: Date.now()
        },
        { new: true }
      );
      
      return res.status(200).json({
        success: true,
        message: 'Psychometric analysis generated successfully',
        data: {
          assignment_id: testAssignment.assignment_id,
          candidate_name: candidate.cand_name,
          analysis: apiResponse.data,
          generated_at: new Date(),
          domains_analyzed: scores.length,
          questions_analyzed: sub_domains.length
        }
      });
      
    } catch (apiError) {
      console.error('Error calling psychometric analysis API:', apiError.message);
      console.error('Request payload that failed:', JSON.stringify(requestPayload, null, 2));
      
      // Return a meaningful error message
      if (apiError.code === 'ECONNABORTED') {
        return res.status(504).json({
          success: false,
          message: 'Psychometric analysis service timeout. Please try again later.',
          error: 'API_TIMEOUT'
        });
      } else if (apiError.response) {
        console.error('API Error Response:', apiError.response.data);
        return res.status(502).json({
          success: false,
          message: `Psychometric analysis service error: ${apiError.response.status}`,
          error: 'API_ERROR',
          details: apiError.response.data || 'Unknown API error'
        });
      } else {
        return res.status(503).json({
          success: false,
          message: 'Unable to connect to psychometric analysis service',
          error: 'API_CONNECTION_ERROR'
        });
      }
    }
    
  } catch (error) {
    console.error('Error generating psychometric analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating psychometric analysis',
      error: error.message
    });
  }
};

/**
 * Get stored psychometric analysis for a test assignment
 * @route GET /api/test-assignments/:id/psychometric-analysis
 * @access Private
 */
exports.getPsychometricAnalysis = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // Find the test assignment by MongoDB _id
    const testAssignment = await TestAssignment.findById(assignmentId);
    
    if (!testAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Test assignment not found'
      });
    }
    
    // Check if psychometric analysis exists
    if (!testAssignment.psychometric_analysis || !testAssignment.psychometric_analysis.analysis_data) {
      return res.status(404).json({
        success: false,
        message: 'Psychometric analysis not found. Please generate analysis first.',
        has_analysis: false
      });
    }
    
    // Get candidate details
    const candidate = await Candidate.findById(testAssignment.candidate_id);
    
    let domains_analyzed = 0;
    let questions_analyzed = 0;
    
    const payload = testAssignment.psychometric_analysis.request_payload;

    // First, try to get counts from the stored payload (most efficient)
    if (payload && payload.scores && payload.items) {
        domains_analyzed = payload.scores.length || 0;
        questions_analyzed = payload.items.sub_domains?.length || 0;
    } else {
        // Fallback for older analysis data that doesn't have the payload stored
        console.log(`No request_payload found for assignment ${testAssignment.assignment_id}. Recalculating counts for backward compatibility.`);
        
        // Fallback for domains_analyzed: count the number of domain scores
        domains_analyzed = testAssignment.domain_scores?.length || 0;

        // Fallback for questions_analyzed: count answers linked to questions with subdomains
        if (testAssignment.answers && testAssignment.answers.length > 0) {
            const Question = require('../models/question.model');
            const questionIdsWithAnswers = testAssignment.answers.map(a => a.question_id);
            const questions = await Question.find({ question_id: { $in: questionIdsWithAnswers } }).select('question_id subdomain_id');
            const questionSubdomainMap = new Map(questions.map(q => [q.question_id, q.subdomain_id]));
            
            questions_analyzed = testAssignment.answers.filter(answer => {
                return questionSubdomainMap.has(answer.question_id) && questionSubdomainMap.get(answer.question_id);
            }).length;
        }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        assignment_id: testAssignment.assignment_id,
        candidate_name: candidate?.cand_name || 'Unknown Candidate',
        analysis: testAssignment.psychometric_analysis.analysis_data,
        generated_at: testAssignment.psychometric_analysis.generated_at,
        api_version: testAssignment.psychometric_analysis.api_version,
        has_analysis: true,
        domains_analyzed,
        questions_analyzed
      }
    });
    
  } catch (error) {
    console.error('Error retrieving psychometric analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving psychometric analysis',
      error: error.message
    });
  }
};