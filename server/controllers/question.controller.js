const Question = require('../models/question.model');
const Domain = require('../models/domain.model');
const SubDomain = require('../models/subdomain.model');
const Test = require('../models/test.model');

/**
 * Get all questions
 * @route GET /api/questions
 * @access Private (Admin)
 */
exports.getAllQuestions = async (req, res) => {
  try {
    const { 
      test_id, 
      domain_id, 
      subdomain_id, 
      question_type, 
      is_likert, 
      is_reversed, 
      probation_flag 
    } = req.query;
    
    // Admin users can see all questions, others only their org's questions
    const filter = req.user.role_id === 1 ? {} : { org_id: req.user.org_id };
    
    if (test_id) {
      filter.test_ids = { $in: [parseInt(test_id)] };
    }
    
    if (domain_id) {
      filter.domain_id = parseInt(domain_id);
    }
    
    if (subdomain_id) {
      filter.subdomain_id = parseInt(subdomain_id);
    }
    
    if (question_type) {
      filter.question_type = question_type;
    }
    
    if (is_likert !== undefined) {
      filter.is_likert = is_likert === 'true';
    }
    
    if (is_reversed !== undefined) {
      filter.is_reversed = is_reversed === 'true';
    }
    
    if (probation_flag !== undefined) {
      filter.probation_flag = probation_flag === 'true';
    }
    
    const questions = await Question.find(filter).sort({ question_id: 1 });
    
    // Get domain and subdomain info for each question (admins can see all)
    const domainIds = [...new Set(questions.filter(q => q.domain_id).map(q => q.domain_id))];
    const subdomainIds = [...new Set(questions.filter(q => q.subdomain_id).map(q => q.subdomain_id))];
    
    const domainFilter = req.user.role_id === 1 
      ? { domain_id: { $in: domainIds } }
      : { domain_id: { $in: domainIds }, org_id: req.user.org_id };
    
    const subdomainFilter = req.user.role_id === 1
      ? { subdomain_id: { $in: subdomainIds } }
      : { subdomain_id: { $in: subdomainIds }, org_id: req.user.org_id };
    
    const [domains, subdomains] = await Promise.all([
      Domain.find(domainFilter),
      SubDomain.find(subdomainFilter)
    ]);
    
    // Create lookup maps
    const domainMap = new Map(domains.map(domain => [domain.domain_id, domain]));
    const subdomainMap = new Map(subdomains.map(subdomain => [subdomain.subdomain_id, subdomain]));
    
    // Add domain and subdomain info to each question
    const questionsWithInfo = questions.map(question => {
      const questionObj = question.toObject();
      
      if (question.domain_id && domainMap.has(question.domain_id)) {
        const domain = domainMap.get(question.domain_id);
        questionObj.domain = {
          domain_id: domain.domain_id,
          domain_name: domain.domain_name
        };
      }
      
      if (question.subdomain_id && subdomainMap.has(question.subdomain_id)) {
        const subdomain = subdomainMap.get(question.subdomain_id);
        questionObj.subdomain = {
          subdomain_id: subdomain.subdomain_id,
          subdomain_name: subdomain.subdomain_name
        };
      }
      
      return questionObj;
    });
    
    return res.status(200).json({
      success: true,
      count: questionsWithInfo.length,
      data: questionsWithInfo
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving questions',
      error: error.message
    });
  }
};

/**
 * Get single question
 * @route GET /api/questions/:id
 * @access Private
 */
exports.getQuestion = async (req, res) => {
  try {
    // Admin users can access any question, others only their org's questions
    const questionFilter = req.user.role_id === 1
      ? { question_id: req.params.id }
      : { question_id: req.params.id, org_id: req.user.org_id };
    
    const question = await Question.findOne(questionFilter);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Get domain and subdomain info (admins can access any, others filtered by org)
    const domainFilter = req.user.role_id === 1
      ? question.domain_id ? { domain_id: question.domain_id } : null
      : question.domain_id ? { domain_id: question.domain_id, org_id: req.user.org_id } : null;
    
    const subdomainFilter = req.user.role_id === 1
      ? question.subdomain_id ? { subdomain_id: question.subdomain_id } : null
      : question.subdomain_id ? { subdomain_id: question.subdomain_id, org_id: req.user.org_id } : null;
    
    const [domain, subdomain, tests] = await Promise.all([
      domainFilter ? Domain.findOne(domainFilter) : null,
      subdomainFilter ? SubDomain.findOne(subdomainFilter) : null,
      question.test_ids?.length ? Test.find({ test_id: { $in: question.test_ids } }) : []
    ]);
    
    const questionObj = question.toObject();
    
    // Add domain info if available
    if (domain) {
      questionObj.domain = {
        domain_id: domain.domain_id,
        domain_name: domain.domain_name
      };
    }
    
    // Add subdomain info if available
    if (subdomain) {
      questionObj.subdomain = {
        subdomain_id: subdomain.subdomain_id,
        subdomain_name: subdomain.subdomain_name
      };
    }
    
    // Add test info if available
    if (tests?.length) {
      questionObj.tests = tests.map(test => ({
        test_id: test.test_id,
        test_name: test.test_name
      }));
    }
    
    return res.status(200).json({
      success: true,
      data: questionObj
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving question',
      error: error.message
    });
  }
};

/**
 * Create question
 * @route POST /api/questions
 * @access Private (Admin)
 */
exports.createQuestion = async (req, res) => {
  try {
    const {
      question_text,
      question_text_urdu,
      help_text,
      question_type,
      category,
      domain_id,
      subdomain_id,
      is_likert,
      is_reversed,
      likert_points,
      probation_flag,
      test_ids,
      options,
      difficulty_level,
      question_status
    } = req.body;
    
    // Validate domain and subdomain if provided (admins can access any, others filtered by org)
    let targetOrgId = req.user.org_id; // Default to user's organization
    
    if (domain_id) {
      const domainFilter = req.user.role_id === 1
        ? { domain_id }
        : { domain_id, org_id: req.user.org_id };
      
      const domain = await Domain.findOne(domainFilter);
      
      if (!domain) {
        return res.status(404).json({
          success: false,
          message: req.user.role_id === 1 
            ? 'Domain not found' 
            : 'Domain not found in your organization'
        });
      }
      
      // For questions, inherit organization from domain
      targetOrgId = domain.org_id;
    }
    
    if (subdomain_id) {
      const subdomainFilter = req.user.role_id === 1
        ? { subdomain_id }
        : { subdomain_id, org_id: req.user.org_id };
      
      const subdomain = await SubDomain.findOne(subdomainFilter);
      
      if (!subdomain) {
        return res.status(404).json({
          success: false,
          message: req.user.role_id === 1 
            ? 'SubDomain not found' 
            : 'SubDomain not found in your organization'
        });
      }
      
      // Check if subdomain belongs to the specified domain
      if (domain_id && subdomain.domain_id !== parseInt(domain_id)) {
        return res.status(400).json({
          success: false,
          message: 'SubDomain does not belong to the specified Domain'
        });
      }
      
      // For questions, inherit organization from subdomain
      targetOrgId = subdomain.org_id;
    }
    
    // For Likert scale questions, create standard options if not provided
    let questionOptions = options;
    
    if (is_likert && (!options || options.length === 0)) {
      const points = parseInt(likert_points || 5);
      
      // Create standard Likert scale options
      switch (points) {
        case 3:
          questionOptions = [
            { option_text: 'Disagree', is_correct: false, score: 1 },
            { option_text: 'Neutral', is_correct: false, score: 2 },
            { option_text: 'Agree', is_correct: false, score: 3 }
          ];
          break;
        case 5:
          questionOptions = [
            { option_text: 'Strongly Disagree', is_correct: false, score: is_reversed ? 5 : 1 },
            { option_text: 'Disagree', is_correct: false, score: is_reversed ? 4 : 2 },
            { option_text: 'Neutral', is_correct: false, score: 3 },
            { option_text: 'Agree', is_correct: false, score: is_reversed ? 2 : 4 },
            { option_text: 'Strongly Agree', is_correct: false, score: is_reversed ? 1 : 5 }
          ];
          break;
        case 7:
          questionOptions = [
            { option_text: 'Strongly Disagree', is_correct: false, score: is_reversed ? 7 : 1 },
            { option_text: 'Disagree', is_correct: false, score: is_reversed ? 6 : 2 },
            { option_text: 'Somewhat Disagree', is_correct: false, score: is_reversed ? 5 : 3 },
            { option_text: 'Neutral', is_correct: false, score: 4 },
            { option_text: 'Somewhat Agree', is_correct: false, score: is_reversed ? 3 : 5 },
            { option_text: 'Agree', is_correct: false, score: is_reversed ? 2 : 6 },
            { option_text: 'Strongly Agree', is_correct: false, score: is_reversed ? 1 : 7 }
          ];
          break;
        default:
          questionOptions = [
            { option_text: 'Strongly Disagree', is_correct: false, score: is_reversed ? 5 : 1 },
            { option_text: 'Disagree', is_correct: false, score: is_reversed ? 4 : 2 },
            { option_text: 'Neutral', is_correct: false, score: 3 },
            { option_text: 'Agree', is_correct: false, score: is_reversed ? 2 : 4 },
            { option_text: 'Strongly Agree', is_correct: false, score: is_reversed ? 1 : 5 }
          ];
      }
    }
    
    // Get the largest question_id and add 1, or start with 1
    const lastQuestion = await Question.findOne().sort({ question_id: -1 });
    const question_id = lastQuestion ? lastQuestion.question_id + 1 : 1;
    
    const question = await Question.create({
      question_id,
      question_text,
      question_text_urdu: question_text_urdu || '',
      help_text: help_text || '',
      question_type: is_likert ? 'likert_scale' : (question_type || 'single_choice'),
      category,
      domain_id,
      subdomain_id,
      is_likert: is_likert || false,
      is_reversed: is_reversed || false,
      likert_points: likert_points || 5,
      probation_flag: probation_flag || false,
      test_ids: test_ids || [],
      options: questionOptions || [],
      difficulty_level: difficulty_level || 3,
      question_status: question_status !== undefined ? question_status : 1,
      org_id: targetOrgId,  // Inherit organization from domain/subdomain or use user's org
      created_by: req.user.id
    });
    
    return res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error creating question',
      error: error.message
    });
  }
};

/**
 * Update question
 * @route PUT /api/questions/:id
 * @access Private (Admin)
 */
exports.updateQuestion = async (req, res) => {
  try {
    const {
      question_text,
      question_text_urdu,
      help_text,
      question_type,
      category,
      domain_id,
      subdomain_id,
      is_likert,
      is_reversed,
      likert_points,
      probation_flag,
      test_ids,
      options,
      difficulty_level,
      question_status
    } = req.body;
    
    // Admin users can update any question, others only their org's questions
    const questionFilter = req.user.role_id === 1
      ? { question_id: req.params.id }
      : { question_id: req.params.id, org_id: req.user.org_id };
    
    const question = await Question.findOne(questionFilter);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Validate domain and subdomain if provided (admins can access any, others filtered by org)
    if (domain_id) {
      const domainFilter = req.user.role_id === 1
        ? { domain_id }
        : { domain_id, org_id: req.user.org_id };
      
      const domain = await Domain.findOne(domainFilter);
      
      if (!domain) {
        return res.status(404).json({
          success: false,
          message: req.user.role_id === 1 
            ? 'Domain not found' 
            : 'Domain not found in your organization'
        });
      }
    }
    
    if (subdomain_id) {
      const subdomainFilter = req.user.role_id === 1
        ? { subdomain_id }
        : { subdomain_id, org_id: req.user.org_id };
      
      const subdomain = await SubDomain.findOne(subdomainFilter);
      
      if (!subdomain) {
        return res.status(404).json({
          success: false,
          message: req.user.role_id === 1 
            ? 'SubDomain not found' 
            : 'SubDomain not found in your organization'
        });
      }
      
      // Check if subdomain belongs to the specified domain
      if (domain_id && subdomain.domain_id !== parseInt(domain_id)) {
        return res.status(400).json({
          success: false,
          message: 'SubDomain does not belong to the specified Domain'
        });
      }
    }
    
    // For Likert scale questions, create standard options if options is empty
    let questionOptions = options;
    const isLikertNow = is_likert !== undefined ? is_likert : question.is_likert;
    const isReversedNow = is_reversed !== undefined ? is_reversed : question.is_reversed;
    
    if (isLikertNow && (!options || options.length === 0)) {
      const points = parseInt(likert_points || question.likert_points || 5);
      
      // Create standard Likert scale options
      switch (points) {
        case 3:
          questionOptions = [
            { option_text: 'Disagree', is_correct: false, score: 1 },
            { option_text: 'Neutral', is_correct: false, score: 2 },
            { option_text: 'Agree', is_correct: false, score: 3 }
          ];
          break;
        case 5:
          questionOptions = [
            { option_text: 'Strongly Disagree', is_correct: false, score: isReversedNow ? 5 : 1 },
            { option_text: 'Disagree', is_correct: false, score: isReversedNow ? 4 : 2 },
            { option_text: 'Neutral', is_correct: false, score: 3 },
            { option_text: 'Agree', is_correct: false, score: isReversedNow ? 2 : 4 },
            { option_text: 'Strongly Agree', is_correct: false, score: isReversedNow ? 1 : 5 }
          ];
          break;
        case 7:
          questionOptions = [
            { option_text: 'Strongly Disagree', is_correct: false, score: isReversedNow ? 7 : 1 },
            { option_text: 'Disagree', is_correct: false, score: isReversedNow ? 6 : 2 },
            { option_text: 'Somewhat Disagree', is_correct: false, score: isReversedNow ? 5 : 3 },
            { option_text: 'Neutral', is_correct: false, score: 4 },
            { option_text: 'Somewhat Agree', is_correct: false, score: isReversedNow ? 3 : 5 },
            { option_text: 'Agree', is_correct: false, score: isReversedNow ? 2 : 6 },
            { option_text: 'Strongly Agree', is_correct: false, score: isReversedNow ? 1 : 7 }
          ];
          break;
        default:
          questionOptions = [
            { option_text: 'Strongly Disagree', is_correct: false, score: isReversedNow ? 5 : 1 },
            { option_text: 'Disagree', is_correct: false, score: isReversedNow ? 4 : 2 },
            { option_text: 'Neutral', is_correct: false, score: 3 },
            { option_text: 'Agree', is_correct: false, score: isReversedNow ? 2 : 4 },
            { option_text: 'Strongly Agree', is_correct: false, score: isReversedNow ? 1 : 5 }
          ];
      }
    }
    
    // Update question
    const updatedQuestion = await Question.findOneAndUpdate(
      { question_id: req.params.id },
      {
        question_text: question_text || question.question_text,
        question_text_urdu: question_text_urdu !== undefined ? question_text_urdu : question.question_text_urdu,
        help_text: help_text !== undefined ? help_text : question.help_text,
        question_type: isLikertNow ? 'likert_scale' : (question_type || question.question_type),
        category: category || question.category,
        domain_id: domain_id !== undefined ? domain_id : question.domain_id,
        subdomain_id: subdomain_id !== undefined ? subdomain_id : question.subdomain_id,
        is_likert: isLikertNow,
        is_reversed: isReversedNow,
        likert_points: likert_points !== undefined ? likert_points : question.likert_points,
        probation_flag: probation_flag !== undefined ? probation_flag : question.probation_flag,
        test_ids: test_ids || question.test_ids,
        options: questionOptions || question.options,
        difficulty_level: difficulty_level || question.difficulty_level,
        question_status: question_status !== undefined ? question_status : question.question_status,
        updated_by: req.user.id,
        updated_at: Date.now()
      },
      { new: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      data: updatedQuestion
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error updating question',
      error: error.message
    });
  }
};

/**
 * Delete question
 * @route DELETE /api/questions/:id
 * @access Private (Admin)
 */
exports.deleteQuestion = async (req, res) => {
  try {
    // Admin users can delete any question, others only their org's questions
    const questionFilter = req.user.role_id === 1
      ? { question_id: req.params.id }
      : { question_id: req.params.id, org_id: req.user.org_id };
    
    const question = await Question.findOne(questionFilter);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    await Question.findByIdAndDelete(question._id);
    
    return res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting question',
      error: error.message
    });
  }
};

/**
 * Assign questions to a test
 * @route POST /api/questions/assign/:testId
 * @access Private (Admin)
 */
exports.assignQuestionsToTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const { question_ids } = req.body;
    
    if (!question_ids || !Array.isArray(question_ids) || question_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question IDs array is required and must not be empty'
      });
    }
    
    // Get Test model
    const Test = require('../models/test.model');
    
    // Find the test
    const test = await Test.findOne({ test_id: testId });
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: `Test with ID ${testId} not found`
      });
    }
    
    // Find all questions to verify they exist
    const Question = require('../models/question.model');
    const questions = await Question.find({
      question_id: { $in: question_ids }
    });
    
    if (questions.length !== question_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more questions do not exist'
      });
    }
    
    // Update each question to add the test_id if it doesn't already have it
    const updateResults = await Promise.all(
      questions.map(async (question) => {
        // If the question doesn't have test_ids array or the test_id is not in the array
        if (!question.test_ids || !question.test_ids.includes(testId)) {
          const updatedTestIds = question.test_ids ? 
            [...question.test_ids, testId] : 
            [testId];
            
          return await Question.findByIdAndUpdate(
            question._id,
            { $set: { test_ids: updatedTestIds } },
            { new: true }
          );
        }
        return question; // Return original question if already assigned
      })
    );
    
    return res.status(200).json({
      success: true,
      message: `Successfully assigned ${questions.length} questions to test "${test.test_name}"`,
      data: {
        test_id: test.test_id,
        test_name: test.test_name,
        question_count: questions.length
      }
    });
  } catch (error) {
    console.error('Error assigning questions to test:', error);
    return res.status(500).json({
      success: false,
      message: 'Error assigning questions to test',
      error: error.message
    });
  }
};

/**
 * Unlink questions from a test
 * @route POST /api/questions/unlink/:testId
 * @access Private (Admin)
 */
exports.unlinkQuestionsFromTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const { question_ids } = req.body;
    
    if (!question_ids || !Array.isArray(question_ids) || question_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question IDs array is required and must not be empty'
      });
    }
    
    // Find the test to verify it exists
    const Test = require('../models/test.model');
    const test = await Test.findOne({ test_id: testId });
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: `Test with ID ${testId} not found`
      });
    }
    
    // Find all questions to verify they exist
    const questions = await Question.find({
      question_id: { $in: question_ids }
    });
    
    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'None of the specified questions were found'
      });
    }
    
    // Update each question to remove the test_id
    const updateResults = await Promise.all(
      questions.map(async (question) => {
        // If the question has test_ids array and the test_id is in the array
        if (question.test_ids && question.test_ids.includes(parseInt(testId))) {
          const updatedTestIds = question.test_ids.filter(id => id !== parseInt(testId));
          
          return await Question.findByIdAndUpdate(
            question._id,
            { $set: { test_ids: updatedTestIds } },
            { new: true }
          );
        }
        return question; // Return original question if not assigned to the test
      })
    );
    
    const unlinkedCount = updateResults.filter(q => 
      !q.test_ids.includes(parseInt(testId))
    ).length;
    
    return res.status(200).json({
      success: true,
      message: `Successfully unlinked ${unlinkedCount} questions from test "${test.test_name}"`,
      data: {
        test_id: test.test_id,
        test_name: test.test_name,
        unlinked_count: unlinkedCount
      }
    });
  } catch (error) {
    console.error('Error unlinking questions from test:', error);
    return res.status(500).json({
      success: false,
      message: 'Error unlinking questions from test',
      error: error.message
    });
  }
}; 