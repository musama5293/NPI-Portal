const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  getAllUsers,
  getUsers,
  getUser,
  createUser,
  updateUser,
  updatePassword,
  deleteUser,
  getUserProfile,
  updateProfile,
  setAdminOrganizations,
  bulkImportCandidates,
  generateImportTemplate,
  processExcelImport,
  registerCandidate,
  getSupervisors
} = require('../controllers/user.controller');
const { protect, hasPermission } = require('../middleware/auth');

// Configure multer for memory storage (for Excel processing)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

// Protected routes - user profile (all authenticated users can access their own profile)
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfile);

// Admin only - set default organizations for admin users
router.post('/set-admin-orgs', protect, hasPermission('access_user_management'), setAdminOrganizations);

// Bulk import routes
router.post('/bulk-import', protect, hasPermission('access_user_management'), bulkImportCandidates);
router.get('/import-template', protect, hasPermission('access_user_management'), generateImportTemplate);
router.get('/job-reference', protect, hasPermission('access_user_management'), async (req, res) => {
  try {
    const Excel = require('exceljs');
    const Job = require('../models/job.model');
    const Organization = require('../models/organization.model');
    const Institute = require('../models/institute.model');
    const Department = require('../models/department.model');
    const Category = require('../models/category.model');
    
    // Create a new workbook and add a worksheet
    const workbook = new Excel.Workbook();
    const jobRefSheet = workbook.addWorksheet('Job Reference');
    
    // Define columns
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
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=job_reference.xlsx');
    
    // Write to response
    await workbook.xlsx.write(res);
  } catch (error) {
    console.error('Error generating job reference:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating job reference',
      error: error.message
    });
  }
});
router.post('/upload-import', protect, hasPermission('access_user_management'), upload.single('file'), processExcelImport);
router.post('/register-candidate', protect, hasPermission('access_user_management'), registerCandidate);

// User management routes
router.get('/', protect, hasPermission('access_user_management'), getAllUsers);
router.get('/all', protect, hasPermission('access_user_management'), getUsers);

// New route to get all supervisors - MUST be before the /:id route
router.get('/supervisors', protect, getSupervisors);

router.get('/:id', protect, hasPermission('access_user_management'), getUser);
router.post('/', protect, hasPermission('access_user_management'), createUser);
router.put('/:id', protect, hasPermission('access_user_management'), updateUser);
router.delete('/:id', protect, hasPermission('access_user_management'), deleteUser);

// Update password - allow users to update their own password, otherwise require permission
router.put('/:id/password', protect, (req, res, next) => {
  // Allow users to update their own password
  if (req.user.id === req.params.id) {
    return next();
  }
  // For updating other users' passwords, require permission
  hasPermission('access_user_management')(req, res, next);
}, updatePassword);

module.exports = router; 