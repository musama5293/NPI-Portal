const User = require('../models/user.model');
const Candidate = require('../models/candidate.model');
const Test = require('../models/test.model');
const Board = require('../models/board.model');
const Job = require('../models/job.model');
const TestAssignment = require('../models/test-assignment.model');
const SupportTicket = require('../models/SupportTicket');
const mongoose = require('mongoose');

/**
 * Get dashboard statistics based on user role
 * @route GET /api/dashboard/stats
 * @access Private
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const userRole = req.user.role_id;
    const userId = req.user.id;
    
    let stats = {};
    
    // Get common statistics that all users should see
    const [
      totalUsers,
      activeUsers,
      totalCandidates,
      activeCandidates,
      totalTests,
      totalBoards,
      totalJobs,
      // Add these basic stats for all users
      candidatesInProbation,
      candidatesByGender,
      testAssignments,
      completedTests,
      pendingTests,
      // Add month-over-month calculations
      lastMonthUsers,
      lastMonthCandidates,
      lastMonthCompletedTests,
      lastMonthProbationCandidates,
      overdueTests
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ user_status: 1 }),
      Candidate.countDocuments(),
      Candidate.countDocuments({ cand_status: 1 }),
      Test.countDocuments({ test_status: 1 }),
      Board.countDocuments(),
      Job.countDocuments({ job_status: 1 }),
      // Basic stats for all users
      Candidate.countDocuments({ candidate_type: 'probation' }),
      Candidate.aggregate([
        { $group: { _id: '$cand_gender', count: { $sum: 1 } } }
      ]),
      TestAssignment.countDocuments(),
      TestAssignment.countDocuments({ completion_status: 'completed' }),
      TestAssignment.countDocuments({ completion_status: 'pending' }),
      // Month-over-month calculations (last 30 days vs 30-60 days ago)
      User.countDocuments({
        $or: [
          { createdAt: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          { created_at: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
        ]
      }),
      Candidate.countDocuments({
        added_on: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      TestAssignment.countDocuments({
        completion_status: 'completed',
        createdAt: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      Candidate.countDocuments({
        candidate_type: 'probation',
        added_on: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      // Overdue tests (expiry_date passed but not completed)
      TestAssignment.countDocuments({
        completion_status: 'pending',
        expiry_date: { $lt: new Date() }
      })
    ]);

    // Calculate percentage changes
    const currentMonthUsers = await User.countDocuments({
      $or: [
        { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        { created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
      ]
    });
    
    const currentMonthCandidates = await Candidate.countDocuments({
      added_on: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    const currentMonthCompletedTests = await TestAssignment.countDocuments({
      completion_status: 'completed',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    const currentMonthProbationCandidates = await Candidate.countDocuments({
      candidate_type: 'probation',
      added_on: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Helper function to calculate percentage change
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Role-specific statistics
    if (userRole === 1) { // Admin
      stats = await getAdminStats();
    } else if (userRole === 3) { // Supervisor
      stats = await getSupervisorStats(userId);
    } else if (userRole === 4) { // Candidate
      stats = await getCandidateStats(userId);
    } else { // Default staff
      stats = await getStaffStats();
    }

    // Add common stats to role-specific stats
    stats.common = {
      totalUsers,
      activeUsers,
      totalCandidates,
      activeCandidates,
      totalTests,
      totalBoards,
      totalJobs
    };

    // Add basic dashboard metrics for all users
    stats.candidatesInProbation = candidatesInProbation;
    stats.candidatesByGender = formatAggregationResult(candidatesByGender);
    stats.testMetrics = {
      totalAssignments: testAssignments,
      completed: completedTests,
      pending: pendingTests,
      overdue: overdueTests
    };

    // Add real percentage changes
    stats.monthlyChanges = {
      candidates: {
        value: calculatePercentageChange(currentMonthCandidates, lastMonthCandidates),
        type: currentMonthCandidates >= lastMonthCandidates ? 'increase' : 'decrease'
      },
      completedTests: {
        value: calculatePercentageChange(currentMonthCompletedTests, lastMonthCompletedTests),
        type: currentMonthCompletedTests >= lastMonthCompletedTests ? 'increase' : 'decrease'
      },
      users: {
        value: calculatePercentageChange(currentMonthUsers, lastMonthUsers),
        type: currentMonthUsers >= lastMonthUsers ? 'increase' : 'decrease'
      },
      probationCandidates: {
        value: calculatePercentageChange(currentMonthProbationCandidates, lastMonthProbationCandidates),
        type: currentMonthProbationCandidates >= lastMonthProbationCandidates ? 'increase' : 'decrease'
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

/**
 * Get admin-specific dashboard statistics
 */
const getAdminStats = async () => {
  try {
    const [
      usersByRole,
      candidatesByStatus,
      candidatesByType,
      recentRegistrations,
      boardsByStatus,
      boardsByType,
      supportTickets,
      supportTicketsByStatus,
      supportTicketsByPriority,
      jobsWithApplications,
      jobMetrics,
      recentBoardActivity,
      userActivityMetrics
    ] = await Promise.all([
      // Users by role
      User.aggregate([
        { $group: { _id: '$role_id', count: { $sum: 1 } } }
      ]),
      
      // Candidates by hiring status
      Candidate.aggregate([
        { $group: { _id: '$hiring_status', count: { $sum: 1 } } }
      ]),

      // Candidates by type (initial, probation, hired)
      Candidate.aggregate([
        { $group: { _id: '$candidate_type', count: { $sum: 1 } } }
      ]),
      
      // Recent registrations (last 30 days)
      User.countDocuments({
        $or: [
          { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          { created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
        ]
      }),
      
      // Boards by status
      Board.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Boards by type
      Board.aggregate([
        { $group: { _id: '$board_type', count: { $sum: 1 } } }
      ]),
      
      // Support tickets total
      SupportTicket.countDocuments(),

      // Support tickets by status
      SupportTicket.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Support tickets by priority
      SupportTicket.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),

      // Jobs with application counts
      Job.aggregate([
        {
          $lookup: {
            from: 'candidates',
            localField: 'job_id',
            foreignField: 'applied_job_id',
            as: 'applicants'
          }
        },
        {
          $project: {
            job_name: 1,
            job_status: 1,
            applicant_count: { $size: '$applicants' }
          }
        }
      ]),

      // Job metrics
      Job.aggregate([
        {
          $group: {
            _id: null,
            totalJobs: { $sum: 1 },
            activeJobs: { $sum: { $cond: [{ $eq: ['$job_status', 1] }, 1, 0] } },
            avgPositions: { $avg: '$total_positions' }
          }
        }
      ]),

      // Recent board activity (last 7 days)
      Board.find({
        created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).sort({ created_at: -1 }).limit(5).populate('created_by', 'username profile'),

      // User activity metrics
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: [{ $eq: ['$user_status', 1] }, 1, 0] } },
            candidateUsers: { $sum: { $cond: [{ $eq: ['$role_id', 4] }, 1, 0] } },
            adminUsers: { $sum: { $cond: [{ $eq: ['$role_id', 1] }, 1, 0] } },
            supervisorUsers: { $sum: { $cond: [{ $eq: ['$role_id', 3] }, 1, 0] } }
          }
        }
      ])
    ]);

    return {
      usersByRole: formatAggregationResult(usersByRole),
      candidatesByStatus: formatAggregationResult(candidatesByStatus),
      candidatesByType: formatAggregationResult(candidatesByType),
      recentRegistrations,
      boardsByStatus: formatAggregationResult(boardsByStatus),
      boardsByType: formatAggregationResult(boardsByType),
      supportTickets: {
        total: supportTickets,
        byStatus: formatAggregationResult(supportTicketsByStatus),
        byPriority: formatAggregationResult(supportTicketsByPriority),
        newMessages: await getNewSupportMessages(), // Add real-time message count
        resolved: formatAggregationResult(supportTicketsByStatus).resolved || 0
      },
      jobMetrics: {
        summary: jobMetrics[0] || { totalJobs: 0, activeJobs: 0, avgPositions: 0 },
        withApplications: jobsWithApplications
      },
      recentBoardActivity,
      userActivityMetrics: userActivityMetrics[0] || { 
        totalUsers: 0, activeUsers: 0, candidateUsers: 0, adminUsers: 0, supervisorUsers: 0 
      }
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    throw error;
  }
};

/**
 * Get supervisor-specific dashboard statistics
 */
const getSupervisorStats = async (supervisorId) => {
  try {
    const [
      supervisedCandidates,
      candidatesInProbation,
      pendingEvaluations,
      completedEvaluations,
      myBoardsCount
    ] = await Promise.all([
      // Candidates supervised by this supervisor
      Candidate.countDocuments({ supervisor_id: supervisorId }),
      
      // Supervised candidates in probation
      Candidate.countDocuments({ 
        supervisor_id: supervisorId, 
        candidate_type: 'probation' 
      }),
      
      // Pending evaluations (assuming board assignments)
      Board.countDocuments({ 
        panel_members: supervisorId,
        status: 'active'
      }),
      
      // Completed evaluations
      Board.countDocuments({ 
        panel_members: supervisorId,
        status: 'completed'
      }),
      
      // Total boards this supervisor is part of
      Board.countDocuments({ panel_members: supervisorId })
    ]);

    return {
      teamMetrics: {
        supervisedCandidates,
        candidatesInProbation,
        pendingEvaluations,
        completedEvaluations
      },
      boardParticipation: {
        totalBoards: myBoardsCount,
        pendingEvaluations,
        completedEvaluations
      }
    };
  } catch (error) {
    console.error('Error getting supervisor stats:', error);
    throw error;
  }
};

/**
 * Get candidate-specific dashboard statistics
 */
const getCandidateStats = async (userId) => {
  try {
    // Find candidate record for this user
    const candidate = await Candidate.findOne({ user_account: userId });
    
    if (!candidate) {
      return {
        applicationStatus: 'not_found',
        testMetrics: { assigned: 0, completed: 0, pending: 0 },
        boardStatus: 'none'
      };
    }

    const [
      assignedTests,
      completedTests,
      pendingTests,
      candidateBoards
    ] = await Promise.all([
      // Tests assigned to this candidate
      TestAssignment.countDocuments({ candidate_id: candidate._id }),
      
      // Completed tests
      TestAssignment.countDocuments({ 
        candidate_id: candidate._id, 
        completion_status: 'completed' 
      }),
      
      // Pending tests
      TestAssignment.countDocuments({ 
        candidate_id: candidate._id, 
        completion_status: 'pending' 
      }),
      
      // Boards this candidate is assigned to
      Board.countDocuments({ candidate_ids: candidate._id })
    ]);

    return {
      applicationStatus: candidate.hiring_status,
      candidateType: candidate.candidate_type,
      probationEndDate: candidate.probation_end_date,
      testMetrics: {
        assigned: assignedTests,
        completed: completedTests,
        pending: pendingTests
      },
      boardStatus: candidateBoards > 0 ? 'assigned' : 'none',
      personalInfo: {
        name: candidate.cand_name,
        email: candidate.cand_email,
        mobile: candidate.cand_mobile_no,
        department: candidate.dept_id,
        organization: candidate.org_id
      }
    };
  } catch (error) {
    console.error('Error getting candidate stats:', error);
    throw error;
  }
};

/**
 * Get staff-specific dashboard statistics
 */
const getStaffStats = async () => {
  try {
    const [
      totalCandidates,
      recentApplications,
      activeTests,
      pendingReviews
    ] = await Promise.all([
      Candidate.countDocuments(),
      Candidate.countDocuments({
        added_on: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      Test.countDocuments({ test_status: 1 }),
      TestAssignment.countDocuments({ completion_status: 'pending' })
    ]);

    return {
      workMetrics: {
        totalCandidates,
        recentApplications,
        activeTests,
        pendingReviews
      }
    };
  } catch (error) {
    console.error('Error getting staff stats:', error);
    throw error;
  }
};

/**
 * Get recruitment pipeline analytics
 * @route GET /api/dashboard/recruitment
 * @access Private
 */
exports.getRecruitmentPipeline = async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const pipeline = await Candidate.aggregate([
      {
        $facet: {
          // Overall pipeline counts
          pipelineCounts: [
            { $group: { _id: '$hiring_status', count: { $sum: 1 } } }
          ],
          
          // Recent pipeline activity
          recentActivity: [
            { $match: { added_on: { $gte: startDate } } },
            { $group: { _id: '$hiring_status', count: { $sum: 1 } } }
          ],
          
          // Monthly trends
          monthlyTrends: [
            { $match: { added_on: { $gte: startDate } } },
            {
              $group: {
                _id: {
                  month: { $month: '$added_on' },
                  year: { $year: '$added_on' },
                  status: '$hiring_status'
                },
                count: { $sum: 1 }
              }
            }
          ],
          
          // Department-wise distribution
          departmentDistribution: [
            { $group: { _id: '$dept_id', count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    const result = pipeline[0];

    res.json({
      success: true,
      data: {
        pipeline: formatAggregationResult(result.pipelineCounts),
        recentActivity: formatAggregationResult(result.recentActivity),
        monthlyTrends: result.monthlyTrends,
        departmentDistribution: formatAggregationResult(result.departmentDistribution),
        timeframe
      }
    });

  } catch (error) {
    console.error('Error fetching recruitment pipeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recruitment pipeline data',
      error: error.message
    });
  }
};

/**
 * Get recent activities
 * @route GET /api/dashboard/activities
 * @access Private
 */
exports.getRecentActivities = async (req, res) => {
  try {
    const { limit = 15 } = req.query;
    
    // Get recent activities from different collections
    const [
      recentUsers,
      recentCandidates,
      recentTestAssignments,
      recentBoards,
      recentSupportTickets,
      recentJobs,
      completedTests,
      candidateStatusChanges
    ] = await Promise.all([
      User.find({ 
        $or: [
          { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          { created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
        ]
      }).sort({ createdAt: -1 }).limit(3).select('username email role_id createdAt created_at profile'),
      
      Candidate.find({ 
        added_on: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
      }).sort({ added_on: -1 }).limit(3).select('cand_name cand_email hiring_status candidate_type added_on'),
      
      TestAssignment.find({ 
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
      }).sort({ createdAt: -1 }).limit(3).populate('test_id candidate_id', 'test_name cand_name'),
      
      Board.find({ 
        created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
      }).sort({ created_at: -1 }).limit(3).select('board_name board_type status created_at').populate('created_by', 'username profile'),
      
      SupportTicket.find({ 
        created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
      }).sort({ created_at: -1 }).limit(3).select('ticket_id subject status priority user_name created_at'),
      
      Job.find({ 
        created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
      }).sort({ created_at: -1 }).limit(2).select('job_name job_description job_status created_at'),
      
      TestAssignment.find({ 
        completion_status: 'completed',
        updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).sort({ updatedAt: -1 }).limit(3).populate('test_id candidate_id', 'test_name cand_name'),
      
      Candidate.find({ 
        $or: [
          { candidate_type: 'hired', updated_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          { hiring_status: { $in: ['selected', 'hired'] }, updated_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
        ]
      }).sort({ updated_at: -1 }).limit(2).select('cand_name hiring_status candidate_type updated_at')
    ]);

    // Combine and format all activities
    const activities = [];

    // Add user registration activities
    recentUsers.forEach(user => {
      const displayName = user.profile?.firstName 
        ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim() 
        : user.username;
      activities.push({
        id: `user_${user._id}`,
        type: 'user_created',
        title: 'New User Registration',
        description: `${displayName} registered as ${getRoleName(user.role_id)}`,
        time: user.createdAt || user.created_at,
        icon: 'person_add',
        color: 'primary'
      });
    });

    // Add candidate activities
    recentCandidates.forEach(candidate => {
      const typeLabel = candidate.candidate_type === 'initial' ? 'Initial Application' : 
                       candidate.candidate_type === 'probation' ? 'Probation Candidate' : 'Hired Candidate';
      activities.push({
        id: `candidate_${candidate._id}`,
        type: 'candidate_registered',
        title: 'New Candidate Registered',
        description: `${candidate.cand_name} joined as ${typeLabel}`,
        time: candidate.added_on,
        icon: 'person_add',
        color: 'success'
      });
    });

    // Add test assignment activities
    recentTestAssignments.forEach(assignment => {
      if (assignment.test_id && assignment.candidate_id) {
        activities.push({
          id: `test_assignment_${assignment._id}`,
          type: 'test_assigned',
          title: 'Test Assigned',
          description: `${assignment.candidate_id.cand_name} was assigned ${assignment.test_id.test_name}`,
          time: assignment.createdAt,
          icon: 'assignment',
          color: 'info'
        });
      }
    });

    // Add board creation activities
    recentBoards.forEach(board => {
      const creatorName = board.created_by?.profile?.firstName 
        ? `${board.created_by.profile.firstName} ${board.created_by.profile.lastName || ''}`.trim()
        : board.created_by?.username || 'System';
      const boardTypeLabel = board.board_type === 'initial' ? 'Initial Interview' :
                           board.board_type === 'probation' ? 'Probation Evaluation' : 'Assessment';
      activities.push({
        id: `board_${board._id}`,
        type: 'board_created',
        title: 'Evaluation Board Created',
        description: `${creatorName} created ${boardTypeLabel} board: ${board.board_name}`,
        time: board.created_at,
        icon: 'groups',
        color: 'secondary'
      });
    });

    // Add support ticket activities
    recentSupportTickets.forEach(ticket => {
      const priorityLabel = ticket.priority === 'urgent' ? 'URGENT' : ticket.priority.toUpperCase();
      activities.push({
        id: `support_${ticket._id}`,
        type: 'support_ticket',
        title: 'Support Ticket Created',
        description: `${ticket.user_name} created ${priorityLabel} ticket: ${ticket.subject}`,
        time: ticket.created_at,
        icon: 'support_agent',
        color: ticket.priority === 'urgent' ? 'error' : 'warning'
      });
    });

    // Add job posting activities
    recentJobs.forEach(job => {
      activities.push({
        id: `job_${job._id}`,
        type: 'job_posted',
        title: 'New Job Posted',
        description: `Job opening for ${job.job_name} is now available`,
        time: job.created_at,
        icon: 'work',
        color: 'info'
      });
    });

    // Add test completion activities
    completedTests.forEach(assignment => {
      if (assignment.test_id && assignment.candidate_id) {
        activities.push({
          id: `test_completed_${assignment._id}`,
          type: 'test_completed',
          title: 'Test Completed',
          description: `${assignment.candidate_id.cand_name} completed ${assignment.test_id.test_name}`,
          time: assignment.updatedAt,
          icon: 'check_circle',
          color: 'success'
        });
      }
    });

    // Add candidate status change activities
    candidateStatusChanges.forEach(candidate => {
      const statusLabel = candidate.hiring_status === 'selected' ? 'Selected for Hiring' :
                         candidate.hiring_status === 'hired' ? 'Successfully Hired' :
                         candidate.candidate_type === 'hired' ? 'Permanent Employee' : 'Status Updated';
      activities.push({
        id: `status_change_${candidate._id}`,
        type: 'status_change',
        title: 'Candidate Status Updated',
        description: `${candidate.cand_name} has been ${statusLabel}`,
        time: candidate.updated_at,
        icon: 'trending_up',
        color: 'success'
      });
    });

    // Sort all activities by time (most recent first) and limit
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const limitedActivities = activities.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: limitedActivities
    });

  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities',
      error: error.message
    });
  }
};

/**
 * Get system alerts and notifications
 * @route GET /api/dashboard/alerts
 * @access Private
 */
exports.getSystemAlerts = async (req, res) => {
  try {
    const alerts = [];
    
    // Check for candidates with expiring probation
    const expiringProbation = await Candidate.find({
      candidate_type: 'probation',
      probation_end_date: {
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      }
    }).select('cand_name probation_end_date');

    expiringProbation.forEach(candidate => {
      alerts.push({
        id: `probation_${candidate._id}`,
        type: 'warning',
        title: 'Probation Ending Soon',
        message: `${candidate.cand_name}'s probation ends on ${candidate.probation_end_date?.toDateString()}`,
        priority: 'high',
        actionUrl: `/candidates/${candidate._id}`
      });
    });

    // Check for pending test assignments
    const pendingTests = await TestAssignment.countDocuments({ completion_status: 'pending' });
    if (pendingTests > 10) {
      alerts.push({
        id: 'pending_tests',
        type: 'info',
        title: 'High Volume of Pending Tests',
        message: `${pendingTests} tests are pending completion`,
        priority: 'medium',
        actionUrl: '/test-assignments'
      });
    }

    // Check for inactive users
    const inactiveUsers = await User.countDocuments({ user_status: 0 });
    if (inactiveUsers > 0) {
      alerts.push({
        id: 'inactive_users',
        type: 'info',
        title: 'Inactive Users',
        message: `${inactiveUsers} users are currently inactive`,
        priority: 'low',
        actionUrl: '/users'
      });
    }

    res.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    console.error('Error fetching system alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system alerts',
      error: error.message
    });
  }
};

// Helper functions
const formatAggregationResult = (aggregationResult) => {
  return aggregationResult.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});
};

const getRoleName = (roleId) => {
  switch (roleId) {
    case 1: return 'Admin';
    case 2: return 'Staff';
    case 3: return 'Supervisor';
    case 4: return 'Candidate';
    default: return 'Unknown';
  }
};

/**
 * Get count of new support messages (messages from last 24 hours)
 */
const getNewSupportMessages = async () => {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const ticketsWithNewMessages = await SupportTicket.find({
      'messages.timestamp': { $gte: yesterday }
    });
    
    let newMessageCount = 0;
    ticketsWithNewMessages.forEach(ticket => {
      const recentMessages = ticket.messages.filter(
        message => new Date(message.timestamp) >= yesterday
      );
      newMessageCount += recentMessages.length;
    });
    
    return newMessageCount;
  } catch (error) {
    console.error('Error counting new support messages:', error);
    return 0;
  }
}; 