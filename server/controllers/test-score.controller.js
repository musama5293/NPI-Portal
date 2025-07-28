const TestScore = require('../models/test-score.model');
const TestAssignment = require('../models/test-assignment.model');
const Domain = require('../models/domain.model');
const SubDomain = require('../models/subdomain.model');
const Question = require('../models/question.model');
const Test = require('../models/test.model');
const Candidate = require('../models/candidate.model');

/**
 * Calculate and store test scores
 * @route POST /api/scores/calculate/:testAssignmentId
 * @access Private (Admin)
 */
exports.calculateTestScore = async (req, res) => {
  try {
    const testAssignmentId = req.params.testAssignmentId;
    
    // Get the test assignment
    const testAssignment = await TestAssignment.findById(testAssignmentId);
    if (!testAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Test assignment not found'
      });
    }
    
    // Check if test is already completed
    if (testAssignment.submission_status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Test is not completed yet'
      });
    }
    
    // Get test details
    const test = await Test.findOne({ test_id: testAssignment.test_id });
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }
    
    // Get candidate details
    const candidate = await Candidate.findById(testAssignment.candidate_id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Get all questions for this test that have domain and subdomain assigned
    const questions = await Question.find({ 
      test_ids: { $in: [testAssignment.test_id] },
      domain_id: { $exists: true, $ne: null }
    });
    
    // No questions found with domain assignments
    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No questions with domain assignments found for this test'
      });
    }
    
    // Get all domains and subdomains used in these questions
    const domainIds = [...new Set(questions.map(q => q.domain_id))];
    const subdomainIds = [...new Set(questions.filter(q => q.subdomain_id).map(q => q.subdomain_id))];
    
    const [domains, subdomains] = await Promise.all([
      Domain.find({ domain_id: { $in: domainIds } }),
      SubDomain.find({ subdomain_id: { $in: subdomainIds } })
    ]);
    
    // Create lookup maps
    const domainMap = new Map(domains.map(domain => [domain.domain_id, domain]));
    const subdomainMap = new Map(subdomains.map(subdomain => [subdomain.subdomain_id, subdomain]));
    
    // Initialize domain scores
    const domainScores = [];
    for (const domain of domains) {
      const domainSubdomains = subdomains.filter(sd => sd.domain_id === domain.domain_id);
      
      const subdomainScores = [];
      for (const subdomain of domainSubdomains) {
        subdomainScores.push({
          subdomain_id: subdomain.subdomain_id,
          subdomain_name: subdomain.subdomain_name,
          raw_score: 0,
          max_score: 0, // Will be calculated based on questions
          percentage_score: 0,
          question_responses: []
        });
      }
      
      domainScores.push({
        domain_id: domain.domain_id,
        domain_name: domain.domain_name,
        raw_score: 0,
        max_score: 0, // Will be calculated based on questions
        percentage_score: 0,
        subdomain_scores: subdomainScores
      });
    }
    
    // Process answers from test assignment
    const { answers } = testAssignment;
    let totalRawScore = 0;
    let totalMaxScore = 0;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'No answers found in test assignment'
      });
    }
    
    // Calculate scores
    for (const answer of answers) {
      // Find question
      const question = questions.find(q => q.question_id === answer.question_id);
      if (!question) continue;
      
      // Find domain and subdomain for this question
      const domain = domainMap.get(question.domain_id);
      if (!domain) continue;
      
      // Find domain score object
      const domainScoreObj = domainScores.find(ds => ds.domain_id === domain.domain_id);
      if (!domainScoreObj) continue;
      
      let scoreValue = 0;
      
      // Calculate score for this question
      if (question.is_likert) {
        // For Likert scale questions
        const selectedOption = Number(answer.answer);
        
        if (selectedOption) {
          // Map the Likert value to score
          if (question.is_reversed) {
            // Reverse the score for reversed questions
            switch (question.likert_points) {
              case 3:
                scoreValue = 4 - selectedOption; // 1->3, 2->2, 3->1
                break;
              case 5:
                scoreValue = 6 - selectedOption; // 1->5, 2->4, 3->3, 4->2, 5->1
                break;
              case 7:
                scoreValue = 8 - selectedOption; // 1->7, 2->6, etc.
                break;
              default:
                scoreValue = 6 - selectedOption; // Default to 5-point scale
            }
          } else {
            // Normal scoring
            scoreValue = selectedOption;
          }
        }
      } else {
        // For other question types, get score from selected option
        const selectedOption = question.options.find(opt => 
          opt._id.toString() === answer.answer || 
          opt.option_text === answer.answer
        );
        
        if (selectedOption) {
          scoreValue = selectedOption.score || 0;
        }
      }
      
      // Create response object
      const responseObj = {
        question_id: question.question_id,
        question_text: question.question_text,
        is_reversed: question.is_reversed || false,
        response_value: Number(answer.answer),
        score_value: scoreValue
      };
      
      // Update domain score
      domainScoreObj.raw_score += scoreValue;
      
      // Update subdomain score if applicable
      if (question.subdomain_id) {
        const subdomainScoreObj = domainScoreObj.subdomain_scores.find(
          ss => ss.subdomain_id === question.subdomain_id
        );
        
        if (subdomainScoreObj) {
          subdomainScoreObj.raw_score += scoreValue;
          subdomainScoreObj.question_responses.push(responseObj);
        }
      }
      
      // Add to totals
      totalRawScore += scoreValue;
      totalMaxScore += question.is_likert ? question.likert_points : Math.max(...question.options.map(o => o.score || 0));
    }
    
    // Calculate percentages
    for (const domainScore of domainScores) {
      // Calculate domain percentage
      if (domainScore.max_score > 0) {
        domainScore.percentage_score = Math.round((domainScore.raw_score / domainScore.max_score) * 100);
      }
      
      // Calculate subdomain percentages
      for (const subdomainScore of domainScore.subdomain_scores) {
        if (subdomainScore.max_score > 0) {
          subdomainScore.percentage_score = Math.round((subdomainScore.raw_score / subdomainScore.max_score) * 100);
        }
      }
    }
    
    // Calculate total percentage
    const totalPercentage = totalMaxScore > 0 ? Math.round((totalRawScore / totalMaxScore) * 100) : 0;
    
    // Check if a score already exists for this test assignment
    let testScore = await TestScore.findOne({ test_assignment_id: testAssignmentId });
    
    if (testScore) {
      // Update existing score
      testScore.total_raw_score = totalRawScore;
      testScore.total_max_score = totalMaxScore;
      testScore.total_percentage = totalPercentage;
      testScore.domain_scores = domainScores;
      testScore.updated_at = Date.now();
    } else {
      // Create new score record
      testScore = new TestScore({
        test_assignment_id: testAssignmentId,
        test_id: test.test_id,
        test_name: test.test_name,
        candidate_id: candidate._id,
        candidate_name: candidate.cand_name,
        total_raw_score: totalRawScore,
        total_max_score: totalMaxScore,
        total_percentage: totalPercentage,
        domain_scores: domainScores,
        is_final: true,
        notes: `Score calculated on ${new Date().toISOString()}`
      });
    }
    
    await testScore.save();
    
    return res.status(200).json({
      success: true,
      message: 'Test score calculated successfully',
      data: testScore
    });
  } catch (error) {
    console.error('Error calculating test score:', error);
    return res.status(500).json({
      success: false,
      message: 'Error calculating test score',
      error: error.message
    });
  }
};

/**
 * Get all test scores
 * @route GET /api/scores
 * @access Private (Admin)
 */
exports.getAllTestScores = async (req, res) => {
  try {
    const { test_id, candidate_id } = req.query;
    const filter = {};
    
    // Apply filters if provided
    if (test_id) filter.test_id = parseInt(test_id);
    if (candidate_id) filter.candidate_id = candidate_id;
    
    const testScores = await TestScore.find(filter)
      .sort({ created_at: -1 })
      .select('-domain_scores.subdomain_scores.question_responses');
    
    return res.status(200).json({
      success: true,
      count: testScores.length,
      data: testScores
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving test scores',
      error: error.message
    });
  }
};

/**
 * Get single test score
 * @route GET /api/scores/:id
 * @access Private
 */
exports.getTestScore = async (req, res) => {
  try {
    const testScore = await TestScore.findById(req.params.id);
    
    if (!testScore) {
      return res.status(404).json({
        success: false,
        message: 'Test score not found'
      });
    }
    
    // Check if the requesting user is the owner or an admin
    const isCandidate = req.user.role_id === 4;
    const isAdmin = req.user.role_id === 1;
    const isOwner = isCandidate && testScore.candidate_id.toString() === req.user.candidate_id?.toString();
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this test score'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: testScore
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving test score',
      error: error.message
    });
  }
};

/**
 * Get test score by test assignment ID
 * @route GET /api/scores/assignment/:testAssignmentId
 * @access Private
 */
exports.getTestScoreByAssignment = async (req, res) => {
  try {
    const testAssignmentId = req.params.testAssignmentId;
    
    const testScore = await TestScore.findOne({ test_assignment_id: testAssignmentId });
    
    if (!testScore) {
      return res.status(404).json({
        success: false,
        message: 'Test score not found for this assignment'
      });
    }
    
    // Check if the requesting user is the owner or an admin
    const isCandidate = req.user.role_id === 4;
    const isAdmin = req.user.role_id === 1;
    const isOwner = isCandidate && testScore.candidate_id.toString() === req.user.candidate_id?.toString();
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this test score'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: testScore
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving test score',
      error: error.message
    });
  }
};

/**
 * Delete test score
 * @route DELETE /api/scores/:id
 * @access Private (Admin)
 */
exports.deleteTestScore = async (req, res) => {
  try {
    const testScore = await TestScore.findById(req.params.id);
    
    if (!testScore) {
      return res.status(404).json({
        success: false,
        message: 'Test score not found'
      });
    }
    
    await TestScore.findByIdAndDelete(req.params.id);
    
    return res.status(200).json({
      success: true,
      message: 'Test score deleted successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting test score',
      error: error.message
    });
  }
}; 