const Job = require('../models/job.model');
const Institute = require('../models/institute.model');
const Department = require('../models/department.model');
const Category = require('../models/category.model');
const Organization = require('../models/organization.model');
const User = require('../models/user.model');

/**
 * Get all jobs
 * @route GET /api/jobs
 * @access Private
 */
exports.getAllJobs = async (req, res) => {
  try {
    // Get all jobs
    const jobs = await Job.find()
      .sort({ job_name: 1 });
    
    // Get unique institute, department, category, organization, and creator IDs
    const instituteIds = [...new Set(jobs.map(job => job.inst_id).filter(id => id))];
    const departmentIds = [...new Set(jobs.map(job => job.dept_id).filter(id => id))];
    const categoryIds = [...new Set(jobs.map(job => job.cat_id).filter(id => id))];
    const orgIds = [...new Set(jobs.map(job => job.org_id).filter(id => id))];
    const creatorIds = [...new Set(jobs.map(job => job.created_by).filter(id => id))];
    
    // Fetch related data
    const [institutes, departments, categories, organizations, creators] = await Promise.all([
      Institute.find({ inst_id: { $in: instituteIds } }).lean(),
      Department.find({ dept_id: { $in: departmentIds } }).lean(),
      Category.find({ cat_id: { $in: categoryIds } }).lean(),
      Organization.find({ org_id: { $in: orgIds } }).lean(),
      User.find({ _id: { $in: creatorIds } }).select('username email').lean()
    ]);
    
    // Create lookup maps
    const instituteMap = new Map(institutes.map(i => [i.inst_id, i]));
    const departmentMap = new Map(departments.map(d => [d.dept_id, d]));
    const categoryMap = new Map(categories.map(c => [c.cat_id, c]));
    const orgMap = new Map(organizations.map(o => [o.org_id, o]));
    const creatorMap = new Map(creators.map(u => [u._id.toString(), u]));
    
    // Populate the jobs
    const populatedJobs = jobs.map(job => {
      const jobObj = job.toObject();
      
      // Populate organization
      if (job.org_id && orgMap.has(job.org_id)) {
        const organization = orgMap.get(job.org_id);
        jobObj.organization = {
          _id: organization._id,
          org_id: organization.org_id,
          org_name: organization.org_name
        };
      }
      
      // Populate institute
      if (job.inst_id && instituteMap.has(job.inst_id)) {
        const institute = instituteMap.get(job.inst_id);
        jobObj.institute = {
          _id: institute._id,
          inst_id: institute.inst_id,
          inst_name: institute.inst_name
        };
      }
      
      // Populate department
      if (job.dept_id && departmentMap.has(job.dept_id)) {
        const department = departmentMap.get(job.dept_id);
        jobObj.department = {
          _id: department._id,
          dept_id: department.dept_id,
          dept_name: department.dept_name
        };
      }
      
      // Populate category
      if (job.cat_id && categoryMap.has(job.cat_id)) {
        const category = categoryMap.get(job.cat_id);
        jobObj.category = {
          _id: category._id,
          cat_id: category.cat_id,
          cat_name: category.cat_name
        };
      }
      
      // Populate creator
      if (job.created_by && creatorMap.has(job.created_by.toString())) {
        const creator = creatorMap.get(job.created_by.toString());
        jobObj.created_by = {
          _id: creator._id,
          username: creator.username,
          email: creator.email
        };
      }
      
      return jobObj;
    });
    
    return res.status(200).json({
      success: true,
      count: jobs.length,
      data: populatedJobs
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving jobs',
      error: error.message
    });
  }
};

/**
 * Get single job
 * @route GET /api/jobs/:id
 * @access Private
 */
exports.getJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    
    const job = await Job.findOne({ job_id: jobId });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Fetch related data
    const [institute, department, category, organization, creator] = await Promise.all([
      job.inst_id ? Institute.findOne({ inst_id: job.inst_id }).lean() : null,
      job.dept_id ? Department.findOne({ dept_id: job.dept_id }).lean() : null,
      job.cat_id ? Category.findOne({ cat_id: job.cat_id }).lean() : null,
      job.org_id ? Organization.findOne({ org_id: job.org_id }).lean() : null,
      job.created_by ? User.findById(job.created_by).select('username email').lean() : null
    ]);
    
    // Create populated object
    const jobObj = job.toObject();
    
    // Populate organization
    if (organization) {
      jobObj.organization = {
        _id: organization._id,
        org_id: organization.org_id,
        org_name: organization.org_name
      };
    }
    
    // Populate institute
    if (institute) {
      jobObj.institute = {
        _id: institute._id,
        inst_id: institute.inst_id,
        inst_name: institute.inst_name
      };
    }
    
    // Populate department
    if (department) {
      jobObj.department = {
        _id: department._id,
        dept_id: department.dept_id,
        dept_name: department.dept_name
      };
    }
    
    // Populate category
    if (category) {
      jobObj.category = {
        _id: category._id,
        cat_id: category.cat_id,
        cat_name: category.cat_name
      };
    }
    
    // Populate creator
    if (creator) {
      jobObj.creator = {
        _id: creator._id,
        username: creator.username,
        email: creator.email
      };
    }
    
    return res.status(200).json({
      success: true,
      data: jobObj
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving job',
      error: error.message
    });
  }
};

/**
 * Create job
 * @route POST /api/jobs
 * @access Private
 */
exports.createJob = async (req, res) => {
  try {
    // Generate a unique job_id
    const highestJob = await Job.findOne().sort({ job_id: -1 }).limit(1);
    let nextJobId = 1000; // Start from 1000 if no jobs exist
    
    if (highestJob && highestJob.job_id) {
      nextJobId = parseInt(highestJob.job_id) + 1;
    }
    
    // Create job with next available ID
    const job = await Job.create({
      ...req.body,
      job_id: nextJobId
    });
    
    return res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error creating job',
      error: error.message
    });
  }
};

/**
 * Update job
 * @route PUT /api/jobs/:id
 * @access Private
 */
exports.updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    
    // Find the job
    let job = await Job.findOne({ job_id: jobId });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Update job
    job = await Job.findOneAndUpdate(
      { job_id: jobId },
      {
        ...req.body,
        updated_at: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error updating job',
      error: error.message
    });
  }
};

/**
 * Delete job
 * @route DELETE /api/jobs/:id
 * @access Private
 */
exports.deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    
    // Find the job
    const job = await Job.findOne({ job_id: jobId });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if job has associated candidates
    const Candidate = require('../models/candidate.model');
    const associatedCandidates = await Candidate.countDocuments({ 
      $or: [
        { job_id: jobId },
        { applied_job_id: jobId },
        { current_job_id: jobId }
      ]
    });
    
    if (associatedCandidates > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete job as it has ${associatedCandidates} associated candidates`
      });
    }
    
    // Delete job
    await Job.deleteOne({ job_id: jobId });
    
    return res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting job',
      error: error.message
    });
  }
};

/**
 * Get candidates for a specific job
 * @route GET /api/jobs/:id/candidates
 * @access Private
 */
exports.getJobCandidates = async (req, res) => {
  try {
    const jobId = req.params.id;
    
    const job = await Job.findOne({ job_id: jobId });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    const Candidate = require('../models/candidate.model');
    // Find candidates who have an application for the specified job_id.
    const candidates = await Candidate.find({ applied_job_id: jobId }).lean();
    
    return res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (error) {
    console.error(`Error fetching candidates for job ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching candidates',
      error: error.message
    });
  }
}; 