 /**
 * Migration Script: Add Organization Binding to Questions
 * 
 * This script adds org_id field to existing questions to enable multi-tenancy.
 * Questions inherit org_id from their domain or subdomain.
 * 
 * Run this with: node scripts/migrate-questions-org.js
 */

const mongoose = require('mongoose');
const config = require('../config/config');

// Connect to MongoDB
mongoose.connect(config.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const migrateQuestionsOrg = async () => {
  try {
    console.log('🚀 Starting questions organization binding migration...');
    
    const db = mongoose.connection.db;
    
    // Get collections
    const questionsCollection = db.collection('questions');
    const domainsCollection = db.collection('domains');
    const subdomainsCollection = db.collection('subdomains');
    
    // Check current data
    const questionsCount = await questionsCollection.countDocuments();
    const questionsWithoutOrg = await questionsCollection.countDocuments({ org_id: { $exists: false } });
    
    console.log(`📊 Found ${questionsCount} total questions`);
    console.log(`📊 Found ${questionsWithoutOrg} questions without org_id`);
    
    if (questionsWithoutOrg === 0) {
      console.log('✅ All questions already have organization binding!');
      return;
    }
    
    // Get all domains and subdomains with their org_ids
    const domains = await domainsCollection.find({}, { domain_id: 1, org_id: 1 }).toArray();
    const subdomains = await subdomainsCollection.find({}, { subdomain_id: 1, org_id: 1 }).toArray();
    
    console.log(`📋 Found ${domains.length} domains and ${subdomains.length} subdomains for reference`);
    
    // Create lookup maps
    const domainOrgMap = new Map(domains.map(d => [d.domain_id, d.org_id]));
    const subdomainOrgMap = new Map(subdomains.map(s => [s.subdomain_id, s.org_id]));
    
    // Get questions that need org_id assignment
    const questionsToUpdate = await questionsCollection.find({ org_id: { $exists: false } }).toArray();
    
    let updatedCount = 0;
    let defaultOrgCount = 0;
    
    console.log('🔧 Processing questions...');
    
    for (const question of questionsToUpdate) {
      let targetOrgId = 1000; // Default organization
      let source = 'default';
      
      // Try to get org_id from subdomain first (more specific)
      if (question.subdomain_id && subdomainOrgMap.has(question.subdomain_id)) {
        targetOrgId = subdomainOrgMap.get(question.subdomain_id);
        source = 'subdomain';
      }
      // Fall back to domain org_id
      else if (question.domain_id && domainOrgMap.has(question.domain_id)) {
        targetOrgId = domainOrgMap.get(question.domain_id);
        source = 'domain';
      }
      
      // Update the question
      await questionsCollection.updateOne(
        { _id: question._id },
        { $set: { org_id: targetOrgId } }
      );
      
      updatedCount++;
      
      if (source === 'default') {
        defaultOrgCount++;
      }
      
      if (updatedCount % 50 === 0) {
        console.log(`   Processed ${updatedCount}/${questionsToUpdate.length} questions...`);
      }
    }
    
    console.log(`✅ Updated ${updatedCount} questions with org_id`);
    console.log(`   - From subdomain: ${updatedCount - defaultOrgCount - domainOrgMap.size}`);
    console.log(`   - From domain: ${Array.from(new Set(questionsToUpdate.filter(q => q.domain_id && domainOrgMap.has(q.domain_id)).map(q => domainOrgMap.get(q.domain_id)))).length}`);
    console.log(`   - Default org (1000): ${defaultOrgCount}`);
    
    // Create additional indexes for better performance with org_id
    console.log('📚 Creating question org-specific indexes...');
    
    try {
      await questionsCollection.createIndex(
        { org_id: 1, question_status: 1 },
        { name: 'questions_org_status_idx', background: true }
      );
      console.log('✅ Created questions_org_status_idx index');
    } catch (error) {
      console.log('⚠️  Index might already exist:', error.message);
    }
    
    try {
      await questionsCollection.createIndex(
        { org_id: 1, domain_id: 1 },
        { name: 'questions_org_domain_idx', background: true }
      );
      console.log('✅ Created questions_org_domain_idx index');
    } catch (error) {
      console.log('⚠️  Index might already exist:', error.message);
    }
    
    try {
      await questionsCollection.createIndex(
        { org_id: 1, subdomain_id: 1 },
        { name: 'questions_org_subdomain_idx', background: true }
      );
      console.log('✅ Created questions_org_subdomain_idx index');
    } catch (error) {
      console.log('⚠️  Index might already exist:', error.message);
    }
    
    // Verify migration results
    console.log('🔍 Verifying migration results...');
    
    const finalQuestionsWithOrg = await questionsCollection.countDocuments({ org_id: { $exists: true } });
    const questionsWithoutOrgAfter = await questionsCollection.countDocuments({ org_id: { $exists: false } });
    
    console.log(`📊 Final counts:`);
    console.log(`   - Questions with org_id: ${finalQuestionsWithOrg}/${questionsCount}`);
    console.log(`   - Questions without org_id: ${questionsWithoutOrgAfter}`);
    
    if (questionsWithoutOrgAfter === 0) {
      console.log('✅ Migration completed successfully!');
      console.log('🎉 All questions now have organization binding!');
    } else {
      console.log('⚠️  Some questions may not have been updated properly.');
    }
    
    // Show some sample data
    console.log('\n📋 Sample migrated data:');
    const sampleQuestions = await questionsCollection.find({ org_id: { $exists: true } }).limit(3).toArray();
    
    sampleQuestions.forEach((question, index) => {
      console.log(`Sample Question ${index + 1}:`, {
        question_id: question.question_id,
        question_text: question.question_text.substring(0, 50) + '...',
        domain_id: question.domain_id,
        subdomain_id: question.subdomain_id,
        org_id: question.org_id
      });
    });
    
    console.log('\n🎯 Question multi-tenancy is now enabled!');
    console.log('   - Each organization will only see their own questions');
    console.log('   - Questions inherit organization from domain/subdomain');
    console.log('   - Auto-generated IDs continue to work');
    console.log('   - Admins can access all questions globally');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
};

