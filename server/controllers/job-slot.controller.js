const JobSlot = require('../models/job-slot.model');
const Job = require('../models/job.model');
const Category = require('../models/category.model');

/**
 * Get all job slots
 * @route GET /api/job-slots
 * @access Private
 */
exports.getAllJobSlots = async (req, res) => {
  try {
    // Get all job slots
    const jobSlots = await JobSlot.find()
      .sort({ slot_name: 1 });
    
    // Get unique job and category IDs
    const jobIds = [...new Set(jobSlots.map(slot => slot.job_id).filter(id => id))];
    const categoryIds = [...new Set(jobSlots.map(slot => slot.cat_id).filter(id => id))];
    
    // Fetch related data
    const [jobs, categories] = await Promise.all([
      Job.find({ job_id: { $in: jobIds } }).lean(),
      Category.find({ cat_id: { $in: categoryIds } }).lean()
    ]);
    
    // Create lookup maps
    const jobMap = new Map(jobs.map(j => [j.job_id, j]));
    const categoryMap = new Map(categories.map(c => [c.cat_id, c]));
    
    // Populate the job slots
    const populatedSlots = jobSlots.map(slot => {
      const slotObj = slot.toObject();
      
      // Populate job
      if (slot.job_id && jobMap.has(slot.job_id)) {
        const job = jobMap.get(slot.job_id);
        slotObj.job = {
          _id: job._id,
          job_id: job.job_id,
          job_name: job.job_name
        };
      }
      
      // Populate category
      if (slot.cat_id && categoryMap.has(slot.cat_id)) {
        const category = categoryMap.get(slot.cat_id);
        slotObj.category = {
          _id: category._id,
          cat_id: category.cat_id,
          cat_name: category.cat_name
        };
      }
      
      return slotObj;
    });
    
    return res.status(200).json({
      success: true,
      count: jobSlots.length,
      data: populatedSlots
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving job slots',
      error: error.message
    });
  }
};

/**
 * Get single job slot
 * @route GET /api/job-slots/:id
 * @access Private
 */
exports.getJobSlot = async (req, res) => {
  try {
    const slotId = req.params.id;
    
    const jobSlot = await JobSlot.findOne({ slot_id: slotId });
    
    if (!jobSlot) {
      return res.status(404).json({
        success: false,
        message: 'Job slot not found'
      });
    }
    
    // Fetch related data
    const [job, category] = await Promise.all([
      jobSlot.job_id ? Job.findOne({ job_id: jobSlot.job_id }).lean() : null,
      jobSlot.cat_id ? Category.findOne({ cat_id: jobSlot.cat_id }).lean() : null
    ]);
    
    // Create populated object
    const slotObj = jobSlot.toObject();
    
    // Populate job
    if (job) {
      slotObj.job = {
        _id: job._id,
        job_id: job.job_id,
        job_name: job.job_name
      };
    }
    
    // Populate category
    if (category) {
      slotObj.category = {
        _id: category._id,
        cat_id: category.cat_id,
        cat_name: category.cat_name
      };
    }
    
    return res.status(200).json({
      success: true,
      data: slotObj
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving job slot',
      error: error.message
    });
  }
};

/**
 * Create job slot
 * @route POST /api/job-slots
 * @access Private
 */
exports.createJobSlot = async (req, res) => {
  try {
    // Generate a unique slot_id
    const highestSlot = await JobSlot.findOne().sort({ slot_id: -1 }).limit(1);
    let nextSlotId = 1000; // Start from 1000 if no slots exist
    
    if (highestSlot && highestSlot.slot_id) {
      nextSlotId = parseInt(highestSlot.slot_id) + 1;
    }
    
    // Create job slot with next available ID
    const jobSlot = await JobSlot.create({
      ...req.body,
      slot_id: nextSlotId
    });
    
    return res.status(201).json({
      success: true,
      message: 'Job slot created successfully',
      data: jobSlot
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error creating job slot',
      error: error.message
    });
  }
};

/**
 * Update job slot
 * @route PUT /api/job-slots/:id
 * @access Private
 */
exports.updateJobSlot = async (req, res) => {
  try {
    const slotId = req.params.id;
    
    // Find the job slot
    let jobSlot = await JobSlot.findOne({ slot_id: slotId });
    
    if (!jobSlot) {
      return res.status(404).json({
        success: false,
        message: 'Job slot not found'
      });
    }
    
    // Update job slot
    jobSlot = await JobSlot.findOneAndUpdate(
      { slot_id: slotId },
      {
        ...req.body,
        updated_at: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Job slot updated successfully',
      data: jobSlot
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error updating job slot',
      error: error.message
    });
  }
};

/**
 * Delete job slot
 * @route DELETE /api/job-slots/:id
 * @access Private
 */
exports.deleteJobSlot = async (req, res) => {
  try {
    const slotId = req.params.id;
    
    // Find the job slot
    const jobSlot = await JobSlot.findOne({ slot_id: slotId });
    
    if (!jobSlot) {
      return res.status(404).json({
        success: false,
        message: 'Job slot not found'
      });
    }
    
    // Check if job slot has associated candidates
    const Candidate = require('../models/candidate.model');
    const associatedCandidates = await Candidate.countDocuments({ slot_id: slotId });
    
    if (associatedCandidates > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete job slot as it has ${associatedCandidates} associated candidates`
      });
    }
    
    // Delete job slot
    await JobSlot.deleteOne({ slot_id: slotId });
    
    return res.status(200).json({
      success: true,
      message: 'Job slot deleted successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting job slot',
      error: error.message
    });
  }
};

/**
 * Get job slots by job
 * @route GET /api/jobs/:id/slots
 * @access Private
 */
exports.getSlotsByJob = async (req, res) => {
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
    
    // Find slots for this job
    const slots = await JobSlot.find({ job_id: jobId }).sort({ slot_name: 1 });
    
    return res.status(200).json({
      success: true,
      count: slots.length,
      data: slots
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving job slots',
      error: error.message
    });
  }
}; 