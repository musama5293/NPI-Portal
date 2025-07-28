const mongoose = require('mongoose');
const Role = require('../models/role.model');

const MONGO_URI = 'mongodb://localhost:27017/npi_portal';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find all roles to check what exists
      const allRoles = await Role.find();
      console.log('All roles:', allRoles);
      
      // Update the role with ID 4 to be the Candidate role
      const result = await Role.findOneAndUpdate(
        { role_id: 4 },
        {
          role_name: 'Candidate',
          description: 'Candidate with test-taking access only',
          permissions: ['view_self', 'edit_self', 'take_tests'],
          role_status: 1,
          user_type: 'candidate'
        },
        { new: true }
      );
      
      if (result) {
        console.log('Candidate role updated:', result);
      } else {
        console.log('No role with ID 4 found to update');
      }
    } catch (error) {
      console.error('Error updating role:', error.message);
    } finally {
      mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 