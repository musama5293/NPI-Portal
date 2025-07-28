const Candidate = require('../models/candidate.model');
const User = require('../models/user.model');
const Board = require('../models/board.model');
const Organization = require('../models/organization.model');
const Institute = require('../models/institute.model');
const Department = require('../models/department.model');

/**
 * Get candidates whose probation is ending soon
 * @route GET /api/probation/ending
 * @access Private (Admin, HR)
 */
exports.getProbationEndingCandidates = async (req, res) => {
  try {
    const { days = 30 } = req.query; // Default to candidates whose probation ends in 30 days
    
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(days));
    
    const candidates = await Candidate.find({
      candidate_type: 'probation',
      probation_end_date: {
        $gte: today,
        $lte: futureDate
      }
    })
    .sort({ probation_end_date: 1 })
    .populate('supervisor_id', 'username profile email')
    .populate({
      path: 'evaluation_history.evaluated_by',
      select: 'username profile'
    })
    .populate({
      path: 'evaluation_history.board_id',
      select: 'board_name board_type board_date'
    });
    
    // Fetch related org, institute, and department data
    const orgIds = [...new Set(candidates.map(c => c.org_id).filter(id => id))];
    const instIds = [...new Set(candidates.map(c => c.inst_id).filter(id => id))];
    const deptIds = [...new Set(candidates.map(c => c.dept_id).filter(id => id))];
    
    // Execute queries in parallel
    const [orgs, insts, depts] = await Promise.all([
      orgIds.length ? Organization.find({ org_id: { $in: orgIds } }) : [],
      instIds.length ? Institute.find({ inst_id: { $in: instIds } }) : [],
      deptIds.length ? Department.find({ dept_id: { $in: deptIds } }) : []
    ]);
    
    // Create lookup maps
    const orgMap = new Map(orgs.map(o => [o.org_id, o]));
    const instMap = new Map(insts.map(i => [i.inst_id, i]));
    const deptMap = new Map(depts.map(d => [d.dept_id, d]));
    
    // Enhance candidate objects with related data
    const enhancedCandidates = candidates.map(candidate => {
      const candidateObj = candidate.toObject();
      
      if (candidate.org_id && orgMap.has(candidate.org_id)) {
        candidateObj.org_id = {
          org_id: candidate.org_id,
          org_name: orgMap.get(candidate.org_id).org_name
        };
      }
      
      if (candidate.inst_id && instMap.has(candidate.inst_id)) {
        candidateObj.inst_id = {
          inst_id: candidate.inst_id,
          inst_name: instMap.get(candidate.inst_id).inst_name
        };
      }
      
      if (candidate.dept_id && deptMap.has(candidate.dept_id)) {
        candidateObj.dept_id = {
          dept_id: candidate.dept_id,
          dept_name: deptMap.get(candidate.dept_id).dept_name
        };
      }
      
      return candidateObj;
    });
    
    return res.status(200).json({
      success: true,
      count: enhancedCandidates.length,
      data: enhancedCandidates
    });
  } catch (error) {
    console.error('Error fetching probation ending candidates:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Update candidate status after board evaluation
 * @route PUT /api/candidates/:id/status-update
 * @access Private (Admin, HR)
 */
exports.updateCandidateStatus = async (req, res) => {
  try {
    const { 
      candidate_type, 
      probation_period, 
      supervisor_id, 
      comments,
      board_id 
    } = req.body;
    
    // Fetch the candidate to check current status
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Calculate probation dates if needed
    let updates = { candidate_type };
    if (candidate_type === 'probation') {
      const today = new Date();
      const endDate = new Date();
      endDate.setMonth(today.getMonth() + parseInt(probation_period));
      
      updates.probation_start_date = today;
      updates.probation_end_date = endDate;
      updates.probation_period = probation_period;
      updates.supervisor_id = supervisor_id;
      updates.hiring_status = 'probation';
    } else if (candidate_type === 'hired') {
      updates.hiring_status = 'hired';
      updates.date_of_joining = new Date(); // Set joining date if not already set
    } else if (candidate_type === 'rejected') {
      updates.hiring_status = 'rejected';
    }
    
    // Add to evaluation history
    const historyEntry = {
      board_id: board_id,
      evaluation_date: new Date(),
      previous_status: candidate.candidate_type,
      new_status: candidate_type,
      comments: comments,
      evaluated_by: req.user.id
    };
    
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { 
        $set: updates,
        $push: { evaluation_history: historyEntry } 
      },
      { new: true }
    ).populate('supervisor_id', 'username profile email');
    
    return res.status(200).json({
      success: true,
      message: `Candidate status updated to ${candidate_type}`,
      data: updatedCandidate
    });
  } catch (error) {
    console.error('Error updating candidate status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get all potential supervisors
 * @route GET /api/supervisors
 * @access Private (Admin, HR)
 */
exports.getSupervisors = async (req, res) => {
  try {
    // Find users who can be supervisors (roles 2 and 3 typically represent managers/leads)
    const supervisors = await User.find({ 
      role_id: { $in: [2, 3] }, // Roles that can be supervisors
      user_status: 1 // Active users only
    }).select('_id username profile email org_id dept_id inst_id');
    
    return res.status(200).json({
      success: true,
      count: supervisors.length,
      data: supervisors
    });
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 