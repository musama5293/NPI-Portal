/**
 * Migration Script: Add Organization Binding to Domains and Subdomains
 * 
 * This script adds org_id field to existing domains and subdomains to enable multi-tenancy.
 * 
 * Run this with: node scripts/migrate-org-binding.js
 */

const mongoose = require('mongoose');
const config = require('../config/config');

// Connect to MongoDB
mongoose.connect(config.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const migrateOrgBinding = async () => {
  try {
    console.log('🚀 Starting organization binding migration...');
    
    const db = mongoose.connection.db;
    
    // Get collections
    const domainsCollection = db.collection('domains');
    const subdomainsCollection = db.collection('subdomains');
    
    // Check current data
    const domainsCount = await domainsCollection.countDocuments();
    const subdomainsCount = await subdomainsCollection.countDocuments();
    
    console.log(`📊 Found ${domainsCount} domains and ${subdomainsCount} subdomains to migrate`);
    
    // Update domains without org_id (set default org_id to 1000)
    console.log('🔧 Updating domains...');
    const domainUpdateResult = await domainsCollection.updateMany(
      { org_id: { $exists: false } },
      { $set: { org_id: 1000 } }
    );
    
    console.log(`✅ Updated ${domainUpdateResult.modifiedCount} domains with org_id`);
    
    // Update subdomains without org_id (set default org_id to 1000)
    console.log('🔧 Updating subdomains...');
    const subdomainUpdateResult = await subdomainsCollection.updateMany(
      { org_id: { $exists: false } },
      { $set: { org_id: 1000 } }
    );
    
    console.log(`✅ Updated ${subdomainUpdateResult.modifiedCount} subdomains with org_id`);
    
    // Create additional indexes for better performance with org_id
    console.log('📚 Creating org-specific indexes...');
    
    try {
      await domainsCollection.createIndex(
        { org_id: 1, domain_id: 1 },
        { name: 'org_domain_idx', background: true }
      );
      console.log('✅ Created org_domain_idx index');
    } catch (error) {
      console.log('⚠️  Index might already exist:', error.message);
    }
    
    try {
      await subdomainsCollection.createIndex(
        { org_id: 1, domain_id: 1, subdomain_id: 1 },
        { name: 'org_subdomain_idx', background: true }
      );
      console.log('✅ Created org_subdomain_idx index');
    } catch (error) {
      console.log('⚠️  Index might already exist:', error.message);
    }
    
    // Verify migration results
    console.log('🔍 Verifying migration results...');
    
    const domainsWithOrgId = await domainsCollection.countDocuments({ org_id: { $exists: true } });
    const subdomainsWithOrgId = await subdomainsCollection.countDocuments({ org_id: { $exists: true } });
    
    console.log(`📊 Final counts:`);
    console.log(`   - Domains with org_id: ${domainsWithOrgId}/${domainsCount}`);
    console.log(`   - Subdomains with org_id: ${subdomainsWithOrgId}/${subdomainsCount}`);
    
    if (domainsWithOrgId === domainsCount && subdomainsWithOrgId === subdomainsCount) {
      console.log('✅ Migration completed successfully!');
      console.log('🎉 All domains and subdomains now have organization binding!');
    } else {
      console.log('⚠️  Some documents may not have been updated properly.');
    }
    
    // Show some sample data
    console.log('\n📋 Sample migrated data:');
    const sampleDomain = await domainsCollection.findOne();
    const sampleSubdomain = await subdomainsCollection.findOne();
    
    if (sampleDomain) {
      console.log('Sample Domain:', {
        domain_id: sampleDomain.domain_id,
        domain_name: sampleDomain.domain_name,
        org_id: sampleDomain.org_id
      });
    }
    
    if (sampleSubdomain) {
      console.log('Sample Subdomain:', {
        subdomain_id: sampleSubdomain.subdomain_id,
        subdomain_name: sampleSubdomain.subdomain_name,
        domain_id: sampleSubdomain.domain_id,
        org_id: sampleSubdomain.org_id
      });
    }
    
    console.log('\n🎯 Multi-tenancy is now enabled!');
    console.log('   - Each organization will only see their own domains and subdomains');
    console.log('   - Auto-generated IDs continue to work');
    console.log('   - Duplicate names are allowed across different organizations');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
};

// Handle connection events
mongoose.connection.on('connected', async () => {
  console.log('🔗 MongoDB Connected: ' + mongoose.connection.host);
  
  try {
    await migrateOrgBinding();
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

console.log('🚀 Starting organization binding migration...'); 