const mongoose = require('mongoose');
const Role = require('../models/role.model');

const MONGO_URI = 'mongodb://127.0.0.1:27017/npi_portal';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Create Candidate role
      const candidateRole = await Role.create({
        role_id: 4,
        role_name: 'Candidate',
        description: 'Candidate with test-taking access only',
        permissions: ['view_self', 'edit_self', 'take_tests'],
        role_status: 1
      });
      
      console.log('Candidate role created:', candidateRole);
    } catch (error) {
      console.error('Error creating role:', error.message);
    } finally {
      mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 