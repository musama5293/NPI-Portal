const Board = require('../models/board.model');
const Assessment = require('../models/assessment.model');
const Candidate = require('../models/candidate.model');
const Job = require('../models/job.model');
const TestAssignment = require('../models/test-assignment.model');
const Test = require('../models/test.model');
const NotificationHelper = require('../services/notificationHelper');
const mongoose = require('mongoose');

/**
 * Get all boards
 * @route GET /api/boards
 * @access Private
 */
exports.getAllBoards = async (req, res) => {
  try {
    const boards = await Board.find()
      .populate('panel_members', 'username email profile')
      .populate({
        path: 'candidates.candidate_id',
        select: 'cand_name email'
      })
      .lean();
    
    // Fetch job details for each board
    const Organization = require('../models/organization.model');
    const Institute = require('../models/institute.model');
    const Department = require('../models/department.model');
    
    const boardsWithJobDetails = await Promise.all(boards.map(async (board) => {
      const jobDetails = [];
      
      if (board.job_ids && board.job_ids.length > 0) {
        for (const jobId of board.job_ids) {
          const job = await Job.findOne({ job_id: jobId }).lean();
          if (job) {
            // Fetch organization, institute, and department details
            const [org, inst, dept] = await Promise.all([
              Organization.findOne({ org_id: job.org_id }).lean(),
              job.inst_id ? Institute.findOne({ inst_id: job.inst_id }).lean() : null,
              job.dept_id ? Department.findOne({ dept_id: job.dept_id }).lean() : null
            ]);
            
            jobDetails.push({
              job_id: job.job_id,
              job_name: job.job_name,
              org_name: org ? org.org_name : 'Unknown',
              inst_name: inst ? inst.inst_name : null,
              dept_name: dept ? dept.dept_name : null
            });
          }
        }
      }
      
      return {
        ...board,
        candidate_count: board.candidates ? board.candidates.length : 0,
        job_details: jobDetails
      };
    }));
    
    return res.status(200).json({
      success: true,
      count: boards.length,
      data: boardsWithJobDetails
    });
  } catch (error) {
    console.error('Error fetching boards:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching boards',
      error: error.message
    });
  }
};

/**
 * Get a single board
 * @route GET /api/boards/:id
 * @access Private
 */
exports.getBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('panel_members', 'username email profile')
      .populate({
        path: 'candidates.candidate_id',
        select: 'cand_name email'
      })
      .lean();
    
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: board
    });
  } catch (error) {
    console.error('Error fetching board:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching board',
      error: error.message
    });
  }
};

/**
 * Create a new board
 * @route POST /api/boards
 * @access Private
 */
exports.createBoard = async (req, res) => {
  try {
    const { 
      board_name, 
      board_description, 
      board_date, 
      job_id,
      job_ids
    } = req.body;
    
    // Handle both single job_id and multiple job_ids
    const jobIdsToProcess = job_ids && job_ids.length > 0 ? job_ids : (job_id ? [job_id] : []);
    
    if (jobIdsToProcess.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one job must be selected to create a board.' });
    }
    
    // Fetch all selected jobs
    const jobs = await Promise.all(
      jobIdsToProcess.map(async (id) => {
        const job = await Job.findOne({ job_id: id });
    if (!job) {
          console.warn(`Job with ID ${id} not found.`);
        }
        return job;
      })
    ).then(results => results.filter(Boolean)); // Remove null/undefined values
    
    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'None of the selected jobs were found.' });
    }

    // Collect all candidates from all selected jobs
    let allCandidates = [];
    let candidateJobMap = {}; // To track which job each candidate is from
    
    for (const job of jobs) {
      const jobCandidates = await Candidate.find({ applied_job_id: job.job_id });
      
      if (jobCandidates && jobCandidates.length > 0) {
        // Store job association for each candidate
        jobCandidates.forEach(candidate => {
          candidateJobMap[candidate._id.toString()] = job.job_id;
        });
        
        allCandidates = [...allCandidates, ...jobCandidates];
      } else {
        console.log(`No candidates found for job ID ${job.job_id}.`);
      }
    }
    
    // Remove duplicates (in case a candidate is associated with multiple jobs)
    const uniqueCandidates = Array.from(
      new Map(allCandidates.map(item => [item._id.toString(), item])).values()
    );
    
    // Format candidates properly for the board schema
    const formattedCandidates = uniqueCandidates.map(c => ({
      candidate_id: c._id,
      assessment_status: 'not_started',
      assigned_date: new Date(),
      job_id: candidateJobMap[c._id.toString()]
    }));

    const boardData = {
      board_name,
      board_description,
      board_date,
      job_ids: jobIdsToProcess,
      job_id: jobIdsToProcess[0], // For backward compatibility
      candidates: formattedCandidates,
      created_by: req.user.id,
      evaluation_required_from: [{
          role: 'hr',
          user_id: req.user.id,
          status: 'pending'
      }]
    };
    
    const newBoard = await Board.create(boardData);

    // Assign tests to candidates
    if (formattedCandidates.length > 0) {
      const lastAssignment = await TestAssignment.findOne().sort({ assignment_id: -1 });
      let nextAssignmentId = (lastAssignment && lastAssignment.assignment_id ? parseInt(lastAssignment.assignment_id) : 0) + 1;

      // Create test assignments for all candidates
      const assignments = [];
      
      for (const candidate of formattedCandidates) {
        const candidateJobId = candidate.job_id;
        const job = jobs.find(j => j.job_id === candidateJobId);
        
        if (job && job.test_id) {
          assignments.push({
        assignment_id: nextAssignmentId++,
        candidate_id: candidate.candidate_id,
            test_id: job.test_id,
            job_id: candidateJobId,
        board_id: newBoard._id,
        assigned_by: req.user.id,
        assignment_status: 1,
        scheduled_date: new Date(),
        expiry_date: new Date(new Date().setDate(new Date().getDate() + 30)), // Default 30-day expiry
          });
        }
      }

      if (assignments.length > 0) {
      await TestAssignment.insertMany(assignments);
      
      // Send notifications to candidates about test assignments
      try {
          // Group assignments by test_id for efficient test lookup
          const testAssignmentGroups = {};
          assignments.forEach(assignment => {
            if (!testAssignmentGroups[assignment.test_id]) {
              testAssignmentGroups[assignment.test_id] = [];
            }
            testAssignmentGroups[assignment.test_id].push(assignment);
          });
          
          // Get all test details at once
          const testIds = Object.keys(testAssignmentGroups);
          const tests = await Test.find({ test_id: { $in: testIds } });
          const testDetailsMap = {};
          tests.forEach(test => {
            testDetailsMap[test.test_id] = test;
          });
          
        const io = req.app.get('io');
        const notificationHelper = new NotificationHelper(io);
        
          for (const testId in testAssignmentGroups) {
            const testAssignments = testAssignmentGroups[testId];
            const testDetails = testDetailsMap[testId];
            
            if (!testDetails) continue;
            
            for (const assignment of testAssignments) {
              const candidate = uniqueCandidates.find(c => c._id.toString() === assignment.candidate_id.toString());
              
              if (candidate && candidate.user_account) {
            try {
              const assignmentData = {
                _id: assignment.assignment_id,
                test_name: testDetails.test_name,
                due_date: assignment.expiry_date,
                test_id: testId
              };
              
              const candidateUser = {
                _id: candidate.user_account
              };
              
              await notificationHelper.notifyTestAssignment(assignmentData, candidateUser);
              console.log(`Notification sent to candidate ${candidate.cand_name} for board test assignment`);
              
              // Also notify admins about the test assignment
              await notificationHelper.notifyAdminTestAssignment(assignmentData, candidate, req.user.id);
              console.log(`Admin notifications sent for board test assignment to ${candidate.cand_name}`);
            } catch (candidateNotificationError) {
              console.error(`Error sending notification to candidate ${candidate.cand_name}:`, candidateNotificationError);
              // Continue with other candidates if one fails
                }
            }
          }
        }
      } catch (notificationError) {
        console.error('Error sending board test assignment notifications:', notificationError);
        // Don't fail the board creation if notifications fail
        }
      }
    }
    
    const populatedBoard = await Board.findById(newBoard._id)
      .populate({
        path: 'candidates.candidate_id',
        select: 'cand_name email'
      });
    
    return res.status(201).json({
      success: true,
      message: 'Board and test assignments created successfully.',
      data: populatedBoard
    });

  } catch (error) {
    console.error('Error creating board:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating board.',
      error: error.stack
    });
  }
};

/**
 * Update a board
 * @route PUT /api/boards/:id
 * @access Private
 */
exports.updateBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }
    
    // Update board with new data
    Object.assign(board, req.body);
    await board.save();
    
    return res.status(200).json({
      success: true,
      data: board
    });
  } catch (error) {
    console.error('Error updating board:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error updating board',
      error: error.message
    });
  }
};

/**
 * Delete a board
 * @route DELETE /api/boards/:id
 * @access Private
 */
exports.deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }
    
    // Delete all assessments associated with this board
    await Assessment.deleteMany({ board_id: req.params.id });
    
    // Delete the board itself
    await Board.deleteOne({ _id: req.params.id });
    
    return res.status(200).json({
      success: true,
      message: 'Board and related assessments deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting board:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting board',
      error: error.message
    });
  }
};

/**
 * Get candidates assigned to a board
 * @route GET /api/boards/:boardId/candidates
 * @access Private
 */
exports.getBoardCandidates = async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }
    
    if (!board.candidates || board.candidates.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Get candidate IDs from the board
    const candidateIds = board.candidates.map(c => c.candidate_id);
    
    // Fetch candidate details
    const candidates = await Candidate.find({
      _id: { $in: candidateIds }
    }).lean();
    
    console.log(`\n=== Board ${req.params.boardId} Candidates Debug ===`);
    
    // Get job IDs from the board - handle both old and new format
    const jobIds = board.job_ids && board.job_ids.length > 0 ? board.job_ids : (board.job_id ? [board.job_id] : []);
    console.log(`Board job_ids: ${jobIds.join(', ')}`);
    console.log(`Candidate IDs: ${candidateIds.map(id => id.toString())}`);
    
    // Fetch test assignments - first try to find assignments with board_id
    let testAssignments = await TestAssignment.find({
      candidate_id: { $in: candidateIds },
      board_id: req.params.boardId,
      assignment_status: 1
    }).lean();
    
    console.log(`Test assignments with board_id: ${testAssignments.length}`);
    
    // If no assignments found with board_id, try to find by job_ids
    if (testAssignments.length === 0 && jobIds.length > 0) {
      testAssignments = await TestAssignment.find({
        candidate_id: { $in: candidateIds },
        job_id: { $in: jobIds },
        assignment_status: 1
      }).lean();
      
      console.log(`Test assignments with job_ids: ${testAssignments.length}`);
      
      // Update these assignments to include board_id for future queries
      if (testAssignments.length > 0) {
        await TestAssignment.updateMany(
          {
            candidate_id: { $in: candidateIds },
            job_id: { $in: jobIds },
            assignment_status: 1,
            board_id: { $exists: false }
          },
          { $set: { board_id: req.params.boardId } }
        );
        console.log(`Updated ${testAssignments.length} test assignments with board_id`);
      }
    }
    
    console.log(`Total test assignments found: ${testAssignments.length}`);
    testAssignments.forEach(ta => {
      console.log(`Assignment ${ta.assignment_id}: candidate ${ta.candidate_id}, status: ${ta.completion_status}, board_id: ${ta.board_id}`);
    });
    
    // Map assessment status and test scores to candidates
    const candidatesWithStatus = candidates.map(candidate => {
      const boardCandidate = board.candidates.find(c => c.candidate_id.equals(candidate._id));
      const testAssignment = testAssignments.find(ta => ta.candidate_id.toString() === candidate._id.toString());
      
      console.log(`Candidate ${candidate.cand_name} (${candidate._id}): test assignment found: ${!!testAssignment}, status: ${testAssignment?.completion_status || 'none'}`);
      
      return {
        ...candidate,
        assessment_status: boardCandidate ? boardCandidate.assessment_status : 'not_started',
        assigned_date: boardCandidate ? boardCandidate.assigned_date : null,
        job_id: boardCandidate?.job_id || candidate.current_job_id || candidate.applied_job_id,
        test_scores: testAssignment ? {
          _id: testAssignment._id, // Add MongoDB _id for API calls
          completion_status: testAssignment.completion_status,
          overall_score: testAssignment.score || 0,
          domain_scores: testAssignment.completion_status === 'completed' ? (testAssignment.domain_scores || []) : [],
          subdomain_scores: testAssignment.completion_status === 'completed' ? (testAssignment.subdomain_scores || []) : [],
          completion_date: testAssignment.end_time,
          assignment_id: testAssignment.assignment_id,
          expiry_date: testAssignment.expiry_date,
          scheduled_date: testAssignment.scheduled_date
        } : null
      };
    });
    
    console.log(`=== End Board Debug ===\n`);
    
    return res.status(200).json({
      success: true,
      data: candidatesWithStatus
    });
  } catch (error) {
    console.error('Error fetching board candidates:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching board candidates',
      error: error.message
    });
  }
};

/**
 * Assign candidates to a board
 * @route POST /api/boards/:boardId/candidates
 * @access Private
 */
exports.assignCandidatesToBoard = async (req, res) => {
  try {
    const { candidate_ids } = req.body;
    
    if (!candidate_ids || !Array.isArray(candidate_ids) || candidate_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide candidate IDs to assign'
      });
    }
    
    const board = await Board.findById(req.params.boardId);
    
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }
    
    // Get job IDs from the board - handle both old and new format
    const jobIds = board.job_ids && board.job_ids.length > 0 ? board.job_ids : (board.job_id ? [board.job_id] : []);
    
    if (jobIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No jobs associated with this board'
      });
    }
    
    // Get all jobs associated with the board
    const jobs = await Promise.all(
      jobIds.map(async (id) => {
        const job = await Job.findOne({ job_id: id });
        if (!job) {
          console.warn(`Job with ID ${id} not found.`);
        }
        return job;
      })
    ).then(results => results.filter(Boolean)); // Remove null/undefined values
    
    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'None of the board jobs were found'
      });
    }
    
    // Initialize candidates array if it doesn't exist
    if (!board.candidates) {
      board.candidates = [];
    }
    
    // Get current candidate IDs in the board
    const currentCandidateIds = board.candidates.map(c => c.candidate_id.toString());
    
    // Filter out candidates that are already assigned
    const newCandidateIds = candidate_ids.filter(
      id => !currentCandidateIds.includes(id.toString())
    );
    
    if (newCandidateIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All candidates are already assigned to this board',
        data: board
      });
    }
    
    // Get candidate details to determine their job association
    const candidatesToAssign = await Candidate.find({ _id: { $in: newCandidateIds } });
    
    // Create a map to track which job each candidate is from
    const candidateJobMap = {};
    
    // Track new jobs that need to be added to the board
    const newJobIds = [];
    
    // First, try to match candidates to the board's jobs or identify new jobs to add
    candidatesToAssign.forEach(candidate => {
      const candidateJobId = candidate.current_job_id || candidate.applied_job_id;
      
      // Check if the candidate's job is one of the board's jobs
      if (candidateJobId) {
        // Assign the candidate to their job
        candidateJobMap[candidate._id.toString()] = candidateJobId;
        
        // If this job is not already in the board's job list, add it
        if (!jobIds.includes(candidateJobId) && !newJobIds.includes(candidateJobId)) {
          newJobIds.push(candidateJobId);
        }
      } else {
        // If candidate has no job, assign to the first job (default)
        candidateJobMap[candidate._id.toString()] = jobIds[0];
      }
    });
    
    // If we found new jobs, add them to the board's job_ids
    if (newJobIds.length > 0) {
      console.log(`Adding ${newJobIds.length} new jobs to board ${board._id}: ${newJobIds.join(', ')}`);
      
      // Update board's job_ids - handle both old and new format
      if (board.job_ids && Array.isArray(board.job_ids)) {
        // New format with job_ids array
        board.job_ids = [...board.job_ids, ...newJobIds];
      } else if (board.job_id) {
        // Old format with single job_id - convert to array
        board.job_ids = [board.job_id, ...newJobIds];
        // Keep job_id for backward compatibility
        board.job_id = board.job_id;
      } else {
        // No jobs at all - unlikely but handle it
        board.job_ids = newJobIds;
        board.job_id = newJobIds[0]; // Set first job as the primary for backward compatibility
      }
      
      // Fetch the newly added jobs to include in test assignments
      const newJobs = await Promise.all(
        newJobIds.map(async (id) => {
          const job = await Job.findOne({ job_id: id });
          if (job) {
            console.log(`Added job "${job.job_name}" (ID: ${job.job_id}) to board with test ID: ${job.test_id || 'none'}`);
          } else {
            console.warn(`New job with ID ${id} not found.`);
          }
          return job;
        })
      ).then(results => results.filter(Boolean));
      
      // Add new jobs to our jobs array for test assignments
      jobs.push(...newJobs);
    }
    
    // Add new candidates to the board with their job association
    const newCandidates = newCandidateIds.map(id => ({
      candidate_id: id,
      assessment_status: 'not_started',
      assigned_date: new Date(),
      job_id: candidateJobMap[id.toString()]
    }));
    
    board.candidates.push(...newCandidates);
    await board.save();
    
    // Assign tests to the newly added candidates based on their associated job
    if (newCandidateIds.length > 0) {
      const lastAssignment = await TestAssignment.findOne().sort({ assignment_id: -1 });
      let nextAssignmentId = (lastAssignment && lastAssignment.assignment_id ? parseInt(lastAssignment.assignment_id) : 0) + 1;

      const assignments = [];
      const testDetailsMap = {};
      
      // Create test assignments for all candidates
      for (const candidate of newCandidates) {
        const candidateJobId = candidate.job_id;
        const job = jobs.find(j => j.job_id === candidateJobId);
        
        if (job && job.test_id) {
          assignments.push({
        assignment_id: nextAssignmentId++,
        candidate_id: candidate.candidate_id,
            test_id: job.test_id,
            job_id: candidateJobId,
        board_id: board._id,
        assigned_by: req.user.id,
        assignment_status: 1,
        scheduled_date: new Date(),
        expiry_date: new Date(new Date().setDate(new Date().getDate() + 30)), // Default 30-day expiry
          });
        }
      }

      if (assignments.length > 0) {
      await TestAssignment.insertMany(assignments);
      
        // Send notifications to candidates about test assignments
        try {
          // Group assignments by test_id for efficient test lookup
          const testAssignmentGroups = {};
          assignments.forEach(assignment => {
            if (!testAssignmentGroups[assignment.test_id]) {
              testAssignmentGroups[assignment.test_id] = [];
            }
            testAssignmentGroups[assignment.test_id].push(assignment);
          });
          
          // Get all test details at once
          const testIds = Object.keys(testAssignmentGroups);
          const tests = await Test.find({ test_id: { $in: testIds } });
          tests.forEach(test => {
            testDetailsMap[test.test_id] = test;
          });
          
        const io = req.app.get('io');
        const notificationHelper = new NotificationHelper(io);
        
          for (const testId in testAssignmentGroups) {
            const testAssignments = testAssignmentGroups[testId];
            const testDetails = testDetailsMap[testId];
            
            if (!testDetails) continue;
            
            for (const assignment of testAssignments) {
              const candidate = candidatesToAssign.find(c => c._id.toString() === assignment.candidate_id.toString());
              
              if (candidate && candidate.user_account) {
            try {
              const assignmentData = {
                _id: assignment.assignment_id,
                test_name: testDetails.test_name,
                due_date: assignment.expiry_date,
                test_id: testId
              };
              
              const candidateUser = {
                _id: candidate.user_account
              };
              
              await notificationHelper.notifyTestAssignment(assignmentData, candidateUser);
                  console.log(`Notification sent to candidate ${candidate.cand_name} for board test assignment`);
              
              // Also notify admins about the test assignment
              await notificationHelper.notifyAdminTestAssignment(assignmentData, candidate, req.user.id);
                  console.log(`Admin notifications sent for board test assignment to ${candidate.cand_name}`);
            } catch (candidateNotificationError) {
              console.error(`Error sending notification to candidate ${candidate.cand_name}:`, candidateNotificationError);
              // Continue with other candidates if one fails
                }
            }
          }
        }
      } catch (notificationError) {
          console.error('Error sending board test assignment notifications:', notificationError);
        // Don't fail the assignment if notifications fail
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `${newCandidateIds.length} candidates assigned to board successfully`,
      data: board
    });
  } catch (error) {
    console.error('Error assigning candidates to board:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error assigning candidates',
      error: error.message
    });
  }
};

/**
 * Remove a candidate from a board
 * @route DELETE /api/boards/:boardId/candidates/:candidateId
 * @access Private
 */
exports.removeCandidateFromBoard = async (req, res) => {
  try {
    const { boardId, candidateId } = req.params;
    
    const board = await Board.findById(boardId);
    
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }
    
    if (!board.candidates || board.candidates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No candidates found in this board'
      });
    }
    
    // Filter out the candidate to remove
    const initialCount = board.candidates.length;
    board.candidates = board.candidates.filter(c => !c.candidate_id.equals(candidateId));
    
    if (board.candidates.length === initialCount) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found in this board'
      });
    }
    
    // Delete assessments for this candidate in this board
    await Assessment.deleteMany({
      board_id: boardId,
      candidate_id: candidateId
    });
    
    await board.save();
    
    return res.status(200).json({
      success: true,
      message: 'Candidate removed from board successfully'
    });
  } catch (error) {
    console.error('Error removing candidate from board:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error removing candidate',
      error: error.message
    });
  }
};

/**
 * Get assessment for a candidate in a board
 * @route GET /api/boards/:boardId/candidates/:candidateId/assessment
 * @access Private
 */
exports.getAssessment = async (req, res) => {
  try {
    const { boardId, candidateId } = req.params;
    
    // Check if the board and candidate exist
    const [board, candidate] = await Promise.all([
      Board.findById(boardId),
      Candidate.findById(candidateId)
    ]);
    
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Find assessment for this user (evaluator), candidate, and board
    const assessment = await Assessment.findOne({
      board_id: boardId,
      candidate_id: candidateId,
      evaluator_id: req.user.id
    });
    
    if (!assessment) {
      return res.status(200).json({
        success: true,
        message: 'No assessment found, create a new one',
        data: null
      });
    }
    
    return res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching assessment',
      error: error.message
    });
  }
};

/**
 * Save or update assessment for a candidate
 * @route POST /api/boards/:boardId/candidates/:candidateId/assessment
 * @access Private
 */
exports.saveAssessment = async (req, res) => {
  try {
    const { boardId, candidateId } = req.params;
    const assessmentData = req.body;
    
    // Check if the board and candidate exist and the candidate is assigned to the board
    const board = await Board.findById(boardId);
    
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }
    
    const candidateExists = board.candidates.some(c => c.candidate_id.equals(candidateId));
    if (!candidateExists) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found in this board'
      });
    }
    
    // Find existing assessment or create a new one
    let assessment = await Assessment.findOne({
      board_id: boardId,
      candidate_id: candidateId,
      evaluator_id: req.user.id
    });
    
    if (assessment) {
      // Update existing assessment
      Object.assign(assessment, {
        scores: assessmentData.scores || assessment.scores,
        notes: assessmentData.notes || assessment.notes,
        decision: assessmentData.decision || assessment.decision,
        status: assessmentData.status || assessment.status
      });
    } else {
      // Create new assessment
      assessment = new Assessment({
        board_id: boardId,
        candidate_id: candidateId,
        evaluator_id: req.user.id,
        scores: assessmentData.scores || {},
        notes: assessmentData.notes || '',
        decision: assessmentData.decision || '',
        status: assessmentData.status || 'in_progress'
      });
    }
    
    await assessment.save();
    
    // Update candidate status in the board
    const candidateIndex = board.candidates.findIndex(c => c.candidate_id.equals(candidateId));
    if (candidateIndex !== -1) {
      board.candidates[candidateIndex].assessment_status = assessment.status;
      await board.save();
    }
    
    return res.status(200).json({
      success: true,
      message: 'Assessment saved successfully',
      data: assessment
    });
  } catch (error) {
    console.error('Error saving assessment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error saving assessment',
      error: error.message
    });
  }
}; 