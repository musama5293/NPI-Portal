// Create a file called fixPassword.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const User = require('./models/User');
    
    // Find any existing user (using testuser as example)
    const user = await User.findOne({ username: 'testuser' });
    
    if (!user) {
      console.log('User testuser not found! Creating it...');
      
      // Load Role model and find admin role
      const Role = require('./models/Role');
      const adminRole = await Role.findOne({ name: 'Admin' });
      
      if (!adminRole) {
        console.error('Admin role not found!');
        process.exit(1);
      }
      
      // Create user with DIRECT password (will be hashed by pre-save)
      const newUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'test123',  // Simple password for testing
        mobileNo: '1234567890',
        role: adminRole._id,
        status: true
      });
      
      await newUser.save();
      console.log('Created new user with username: testuser, password: test123');
    } else {
      // Reset password directly
      user.password = 'test123';  // Simple password for testing
      await user.save();
      
      // Double-check password verification
      const isMatch = await user.comparePassword('test123');
      console.log('Password verification check:', isMatch);
      
      console.log('Updated user password. New credentials:');
      console.log('Username: testuser');
      console.log('Password: test123');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });