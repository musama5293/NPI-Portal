import axios from 'axios';
import { API_URL } from '../config/config';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Domain API calls
export const getDomains = () => api.get('/domains');
export const getDomain = (id) => api.get(`/domains/${id}`);
export const createDomain = (domain) => api.post('/domains', domain);
export const updateDomain = (id, domain) => api.put(`/domains/${id}`, domain);
export const deleteDomain = (id) => api.delete(`/domains/${id}`);

// Subdomain API calls
export const getSubdomains = (domainId = null) => {
  const url = domainId ? `/subdomains?domain_id=${domainId}` : '/subdomains';
  return api.get(url);
};
export const getSubdomain = (id) => api.get(`/subdomains/${id}`);
export const createSubdomain = (subdomain) => api.post('/subdomains', subdomain);
export const updateSubdomain = (id, subdomain) => api.put(`/subdomains/${id}`, subdomain);
export const deleteSubdomain = (id) => api.delete(`/subdomains/${id}`);

// Question API calls
export const getQuestions = (params = {}) => api.get('/questions', { params });
export const getQuestion = (id) => api.get(`/questions/${id}`);
export const createQuestion = (question) => api.post('/questions', question);
export const updateQuestion = (id, question) => api.put(`/questions/${id}`, question);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);

// Test API calls - Using exact endpoint path from TestList.js
export const getTests = (params = {}) => api.get('/test/tests', { params });
export const getTest = (id) => api.get(`/test/tests/${id}`);
export const createTest = (test) => api.post('/test/tests', test);
export const updateTest = (id, test) => api.put(`/test/tests/${id}`, test);
export const deleteTest = (id) => api.delete(`/test/tests/${id}`);
export const assignQuestionsToTest = (testId, questionIds) => 
  api.post(`/questions/assign/${testId}`, { question_ids: questionIds });

// New function to unlink questions from a test
export const unlinkQuestionsFromTest = (testId, questionIds) => 
  api.post(`/questions/unlink/${testId}`, { question_ids: questionIds });

// Test Score API calls
export const getTestScores = (params = {}) => api.get('/scores', { params });
export const getTestScore = (id) => api.get(`/scores/${id}`);
export const getTestScoreByAssignment = (assignmentId) => 
  api.get(`/scores/assignment/${assignmentId}`);
export const calculateTestScore = (assignmentId) => 
  api.post(`/scores/calculate/${assignmentId}`);
export const deleteTestScore = (id) => api.delete(`/scores/${id}`);

// BOARD MANAGEMENT API CALLS

/**
 * Get all evaluation boards
 */
export const getBoards = (params) => {
  return api.get('/boards', { params });
};

/**
 * Get a specific board by ID
 */
export const getBoard = (boardId) => {
  return api.get(`/boards/${boardId}`);
};

/**
 * Create a new evaluation board
 */
export const createBoard = (boardData) => {
  return api.post('/boards', boardData);
};

/**
 * Update an existing board
 */
export const updateBoard = (boardId, boardData) => {
  return api.put(`/boards/${boardId}`, boardData);
};

/**
 * Delete a board
 */
export const deleteBoard = (boardId) => {
  return api.delete(`/boards/${boardId}`);
};

/**
 * Get candidates assigned to a specific board
 */
export const getBoardCandidates = (boardId) => {
  return api.get(`/boards/${boardId}/candidates`);
};

/**
 * Get candidates by job ID (useful for adding to boards)
 */
export const getCandidatesByJob = (jobId, params) => {
  return api.get(`/jobs/${jobId}/candidates`, { params });
};

/**
 * Assign candidates to a board
 */
export const assignCandidatesToBoard = (boardId, candidateIds) => {
  return api.post(`/boards/${boardId}/candidates`, { candidate_ids: candidateIds });
};

/**
 * Remove a candidate from a board
 */
export const removeCandidateFromBoard = (boardId, candidateId) => {
  return api.delete(`/boards/${boardId}/candidates/${candidateId}`);
};

/**
 * Get candidate assessment for a specific board
 */
export const getBoardAssessment = (boardId, candidateId) => {
  return api.get(`/boards/${boardId}/candidates/${candidateId}/assessment`);
};

/**
 * Save candidate assessment for a board
 */
export const saveAssessment = (boardId, candidateId, assessmentData) => {
  return api.post(`/boards/${boardId}/candidates/${candidateId}/assessment`, assessmentData);
};

// User API calls
export const getUsers = () => api.get('/users');
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (userData) => api.post('/users', userData);
export const updateUser = (id, userData) => api.put(`/users/${id}`, userData);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Job API calls
export const getJobs = () => api.get('/jobs');
export const getJob = (id) => api.get(`/jobs/${id}`);
export const createJob = (jobData) => api.post('/jobs', jobData);
export const updateJob = (id, jobData) => api.put(`/jobs/${id}`, jobData);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);

// Candidate API calls
export const getCandidates = (params = {}) => {
  console.log("API call params:", params);
  
  // Special handling for job-related filters
  if (params.job_id) {
    // Convert to number if possible
    const jobIdValue = !isNaN(Number(params.job_id)) ? Number(params.job_id) : params.job_id;
    params.applied_job_id = jobIdValue;
  }
  
  return api.get('/candidates', { params });
};
export const getCandidate = (id) => api.get(`/candidates/${id}`);
export const createCandidate = (candidateData) => api.post('/candidates', candidateData);
export const updateCandidate = (id, candidateData) => api.put(`/candidates/${id}`, candidateData);
export const deleteCandidate = (id) => api.delete(`/candidates/${id}`);

// New function to get supervisors
export const getSupervisors = () => api.get('/users/supervisors');

// Organization API calls
export const getOrganizations = () => api.get('/organizations');
export const getOrganization = (id) => api.get(`/organizations/${id}`);

// Department API calls  
export const getDepartments = (orgId = null) => {
  const url = orgId ? `/departments?org_id=${orgId}` : '/departments';
  return api.get(url);
};
export const getDepartment = (id) => api.get(`/departments/${id}`);

// Institute API calls
export const getInstitutes = (orgId = null) => {
  const url = orgId ? `/institutes?org_id=${orgId}` : '/institutes';
  return api.get(url);
};
export const getInstitute = (id) => api.get(`/institutes/${id}`);

// Category API calls
export const getCategories = () => api.get('/test/categories');
export const getCategory = (id) => api.get(`/test/categories/${id}`);

// Probation Management API calls
export const getProbationEndingCandidates = (days = 30) => {
  return api.get(`/probations/ending?days=${days}`);
};

export const updateCandidateStatus = (candidateId, statusData) => {
  return api.put(`/probations/candidates/${candidateId}/status`, statusData);
};

// Test Assignment API calls
export const getTestAssignments = (params) => {
  return api.get('/test/test-assignments', { params });
};

export const getSupervisorAssignments = () => api.get('/test/test-assignments/supervisor');

export const getLinkedAssignments = (assignmentId) => api.get(`/test/test-assignments/linked/${assignmentId}`);

export const deleteTestAssignment = (assignmentId) => api.delete(`/test/test-assignments/${assignmentId}`);

export default api; 