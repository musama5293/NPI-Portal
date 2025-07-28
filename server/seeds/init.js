const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const config = require('../config/db');
const User = require('../models/user.model');
const Role = require('../models/role.model');

// Connect to MongoDB
mongoose.connect(config.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Create default roles
const createRoles = async () => {
  try {
    // Check if roles already exist
    const count = await Role.countDocuments();
    
    if (count === 0) {
      // Create default roles
      await Role.create([
        {
          role_id: 1,
          role_name: 'Admin',
          description: 'Administrator with full access',
          permissions: ['all'],
          role_status: 1
        },
        {
          role_id: 2,
          role_name: 'User',
          description: 'Regular user with limited access',
          permissions: ['view_self', 'edit_self'],
          role_status: 1
        },
        {
          role_id: 3,
          role_name: 'Faculty',
          description: 'Faculty member with test management access',
          permissions: ['view_self', 'edit_self', 'manage_tests'],
          role_status: 1
        },
        {
          role_id: 4,
          role_name: 'Candidate',
          description: 'Candidate with test-taking access only',
          permissions: ['view_self', 'edit_self', 'take_tests'],
          role_status: 1,
          user_type: 'candidate'
        }
      ]);
      
      console.log('Default roles created successfully');
    } else {
      console.log('Roles already exist');
    }
  } catch (error) {
    console.error('Error creating roles:', error);
  }
};

// Create admin user
const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Create admin user
      await User.create({
        username: 'admin',
        email: 'admin@npi.edu',
        password: hashedPassword,
        mobile_no: '1234567890',
        org_id: 1000,
        role_id: 1,
        user_status: 1,
        pass_flag: 1, // Require password change on first login
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        }
      });
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Run seeds
const runSeeds = async () => {
  await createRoles();
  await createAdminUser();
  
  // Disconnect from MongoDB
  mongoose.disconnect();
  
  console.log('Seed completed successfully');
};

runSeeds(); 