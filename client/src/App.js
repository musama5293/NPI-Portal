import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
// Import ThemeProvider
import ThemeProvider from './theme/ThemeProvider';
// Import date picker providers
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Import components
import Login from './components/auth/Login';
import OTPVerification from './components/auth/OTPVerification';
import ResetPassword from './components/auth/ResetPassword';
import HelpPage from './components/auth/HelpPage';

// Import pages
import Dashboard from './pages/Dashboard';
import UserList from './pages/UserList';
import UserForm from './pages/UserForm';
import RoleList from './pages/RoleList';
import RoleForm from './pages/RoleForm';
import UserProfile from './pages/UserProfile';
import CandidateList from './pages/CandidateList';
import OrganizationList from './pages/OrganizationList';
import OrganizationForm from './pages/OrganizationForm';
import InstituteList from './pages/InstituteList';
import InstituteForm from './pages/InstituteForm';
import DepartmentList from './pages/DepartmentList';
import DepartmentForm from './pages/DepartmentForm';
import TestList from './pages/TestList';
import TestForm from './pages/TestForm';
import TestQuestions from './pages/TestQuestions';
import CategoryList from './pages/CategoryList';
import TestAssignmentList from './pages/TestAssignmentList';
import TestAssignmentForm from './pages/TestAssignmentForm';
import BatchTestAssignmentForm from './pages/BatchTestAssignmentForm';
import MyTests from './pages/MyTests';
import Results from './pages/Results';
import ResultsDashboard from './pages/ResultsDashboard';
// Import job management pages
import JobList from './pages/JobList';
import JobForm from './pages/JobForm';
import JobCandidates from './pages/JobCandidates';
// Import new pages for domains, subdomains, and questions
import DomainList from './pages/DomainList';
import DomainForm from './pages/DomainForm';
import SubdomainList from './pages/SubdomainList';
import SubdomainForm from './pages/SubdomainForm';
import QuestionList from './pages/QuestionList';
import QuestionForm from './pages/QuestionForm';
import QuestionSelectionPage from './pages/QuestionSelectionPage';

// Import board management pages
import BoardList from './pages/BoardList';
import BoardForm from './pages/BoardForm';
import BoardCandidates from './pages/BoardCandidates';
import CandidateAssessment from './pages/CandidateAssessment';
import ProbationDashboard from './pages/ProbationDashboard';

// Add the new import:
import CandidateProfile from './pages/CandidateProfile';
import CandidateProfileEdit from './pages/CandidateProfileEdit';
import TakeTest from './pages/TakeTest';
import SupervisorTests from './pages/SupervisorTests';
import CandidateImport from './pages/CandidateImport';

// Import support system pages
import SupportDashboard from './pages/SupportDashboard';
import AdminSupportDashboard from './pages/AdminSupportDashboard';

// Import email management pages
import EmailDashboard from './pages/EmailDashboard';
import EmailTemplateList from './pages/EmailTemplateList';
import EmailTemplateForm from './pages/EmailTemplateForm';
import EmailLogsList from './pages/EmailLogsList';

// Import RoleUpdater component
import RoleUpdater from './components/common/RoleUpdater';

// Test backend connectivity
const API_URL = 'http://localhost:5000';

// Loading component
const LoadingScreen = () => (
  <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh'
  }}>
    <p>Loading...</p>
  </div>
);

// Temporary Dashboard component for testing
const TempDashboard = () => {
  const { user } = useAuth();
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      <p>Authentication successful! This is a temporary dashboard.</p>
      {user && (
        <div>
          <p>Welcome, {user.username}!</p>
          <p>Email: {user.email}</p>
          <p>Role ID: {user.role_id}</p>
        </div>
      )}
      <LogoutButton />
    </div>
  );
};

// Simple Logout Button
const LogoutButton = () => {
  const { logout } = useAuth();
  return (
    <button onClick={logout} style={{ padding: '10px', marginTop: '20px' }}>
      Logout
    </button>
  );
};

// Protected Route component
const ProtectedRoute = ({ children, requiredRole, pagePermission }) => {
  const { isAuthenticated, loading, hasRole, user, hasPagePermission, userRole } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated()) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" />;
  }
  
  // Admin always has access to everything except role-specific sections
  if (user?.role_id === 1) {
    console.log("Admin user, granting access");
    return children;
  }
  
  // Display full permission info for debugging
  console.log("User permissions check detail:", {
    userId: user?.id,
    username: user?.username,
    roleId: user?.role_id,
    roleName: userRole?.role_name,
    currentUrl: window.location.pathname,
    requiredPermission: pagePermission,
    fullPermissions: userRole,
    hasRequiredPermission: pagePermission ? hasPagePermission(pagePermission) : "No permission required"
  });
  
  // If page requires a permission
  if (pagePermission) {
    const hasPermission = hasPagePermission(pagePermission);
    console.log(`Checking permission ${pagePermission}: ${hasPermission ? 'GRANTED' : 'DENIED'}`);
    
    if (!hasPermission) {
      console.log("Permission denied for:", pagePermission, "User permissions:", userRole);
      
      // Redirect based on role
      if (user?.role_id === 3) {
        return <Navigate to="/supervisor-tests" />;
      } else if (user?.role_id === 4) {
        return <Navigate to="/my-assessments" />;
      } else {
        return <Navigate to="/" />;
      }
    }
  }
  
  // If we still have a requiredRole check (for backward compatibility)
  if (requiredRole && !hasRole(requiredRole)) {
    console.log("Role check failed: Required role:", requiredRole, "User role:", user?.role_id);
    return <Navigate to="/" />;
  }
  
  // Access granted
  return children;
};

const App = () => {
  // Test backend connection when the app loads
  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        const response = await axios.get(API_URL);
        console.log('Backend connection successful:', response.data);
      } catch (error) {
        console.error('Backend connection failed:', error);
      }
    };

    testBackendConnection();
  }, []);

  return (
    <Router>
      <ThemeProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AuthProvider>
            <RoleUpdater />
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<OTPVerification />} />
              <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/help" element={<HelpPage />} />
              
          {/* Dashboard */}
              <Route path="/" element={
                <ProtectedRoute pagePermission="access_dashboard">
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute pagePermission="access_dashboard">
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* User Profile */}
          <Route path="/profile" element={
            <ProtectedRoute pagePermission="access_user_profile">
              <UserProfile />
            </ProtectedRoute>
          } />
          
          {/* User Management - Admin Only */}
          <Route path="/users" element={
            <ProtectedRoute pagePermission="access_user_management">
              <UserList />
            </ProtectedRoute>
          } />
          <Route path="/users/create" element={
            <ProtectedRoute pagePermission="access_user_management">
              <UserForm />
            </ProtectedRoute>
          } />
          <Route path="/users/import" element={
            <ProtectedRoute pagePermission="access_user_management">
              <CandidateImport />
            </ProtectedRoute>
          } />
          <Route path="/users/edit/:id" element={
            <ProtectedRoute pagePermission="access_user_management">
              <UserForm />
            </ProtectedRoute>
          } />
          
          {/* Role Management - Admin Only */}
          <Route path="/roles" element={
            <ProtectedRoute pagePermission="access_role_management">
              <RoleList />
            </ProtectedRoute>
          } />
          <Route path="/roles/create" element={
            <ProtectedRoute pagePermission="access_role_management">
              <RoleForm />
            </ProtectedRoute>
          } />
          <Route path="/roles/edit/:id" element={
            <ProtectedRoute pagePermission="access_role_management">
              <RoleForm />
            </ProtectedRoute>
          } />
          
          {/* Candidate Management */}
          <Route path="/candidates" element={
            <ProtectedRoute pagePermission="access_candidate_management">
              <CandidateList />
            </ProtectedRoute>
          } />
          
          <Route path="/candidates/profile/:id" element={
            <ProtectedRoute pagePermission="access_candidate_management">
              <CandidateProfile />
            </ProtectedRoute>
          } />
          
          {/* Organization Management */}
          <Route path="/organizations" element={
            <ProtectedRoute pagePermission="access_organization_management">
              <OrganizationList />
            </ProtectedRoute>
          } />
          <Route path="/organizations/create" element={
            <ProtectedRoute pagePermission="access_organization_management">
              <OrganizationForm />
            </ProtectedRoute>
          } />
          <Route path="/organizations/edit/:id" element={
            <ProtectedRoute pagePermission="access_organization_management">
              <OrganizationForm />
            </ProtectedRoute>
          } />
          
          {/* Institute Management */}
          <Route path="/institutes" element={
            <ProtectedRoute pagePermission="access_institute_management">
              <InstituteList />
            </ProtectedRoute>
          } />
          <Route path="/institutes/create" element={
            <ProtectedRoute pagePermission="access_institute_management">
              <InstituteForm />
            </ProtectedRoute>
          } />
          <Route path="/institutes/edit/:id" element={
            <ProtectedRoute pagePermission="access_institute_management">
              <InstituteForm />
            </ProtectedRoute>
          } />
          
          {/* Department Management */}
          <Route path="/departments" element={
            <ProtectedRoute pagePermission="access_department_management">
              <DepartmentList />
            </ProtectedRoute>
          } />
          <Route path="/departments/create" element={
            <ProtectedRoute pagePermission="access_department_management">
              <DepartmentForm />
            </ProtectedRoute>
          } />
          <Route path="/departments/edit/:id" element={
            <ProtectedRoute pagePermission="access_department_management">
              <DepartmentForm />
            </ProtectedRoute>
          } />
          
          {/* Domain Management */}
          <Route path="/domains" element={
            <ProtectedRoute pagePermission="access_domain_management">
              <DomainList />
            </ProtectedRoute>
          } />
          <Route path="/domains/create" element={
            <ProtectedRoute pagePermission="access_domain_management">
              <DomainForm />
            </ProtectedRoute>
          } />
          <Route path="/domains/edit/:id" element={
            <ProtectedRoute pagePermission="access_domain_management">
              <DomainForm />
            </ProtectedRoute>
          } />
          
          {/* Subdomain Management */}
          <Route path="/subdomains" element={
            <ProtectedRoute pagePermission="access_subdomain_management">
              <SubdomainList />
            </ProtectedRoute>
          } />
          <Route path="/subdomains/create" element={
            <ProtectedRoute pagePermission="access_subdomain_management">
              <SubdomainForm />
            </ProtectedRoute>
          } />
          <Route path="/subdomains/edit/:id" element={
            <ProtectedRoute pagePermission="access_subdomain_management">
              <SubdomainForm />
            </ProtectedRoute>
          } />
          
          {/* Question Management */}
          <Route path="/questions" element={
            <ProtectedRoute pagePermission="access_question_management">
              <QuestionList />
            </ProtectedRoute>
          } />
          <Route path="/questions/create" element={
            <ProtectedRoute pagePermission="access_question_management">
              <QuestionForm />
            </ProtectedRoute>
          } />
          <Route path="/questions/edit/:id" element={
            <ProtectedRoute pagePermission="access_question_management">
              <QuestionForm />
            </ProtectedRoute>
          } />
          <Route path="/questions/select-for-test/:testId" element={
            <ProtectedRoute pagePermission="access_question_management">
              <QuestionSelectionPage />
            </ProtectedRoute>
          } />
          
          {/* Test Management */}
          <Route path="/tests" element={
            <ProtectedRoute pagePermission="access_test_management">
              <TestList />
            </ProtectedRoute>
          } />
          <Route path="/tests/create" element={
            <ProtectedRoute pagePermission="access_test_management">
              <TestForm />
            </ProtectedRoute>
          } />
          <Route path="/tests/edit/:id" element={
            <ProtectedRoute pagePermission="access_test_management">
              <TestForm />
            </ProtectedRoute>
          } />
          <Route path="/test-questions/:testId" element={
            <ProtectedRoute pagePermission="access_test_management">
              <TestQuestions />
            </ProtectedRoute>
          } />
          
          {/* Test Assignment Management */}
          <Route path="/test-assignments" element={
            <ProtectedRoute pagePermission="access_test_assignment">
              <TestAssignmentList />
            </ProtectedRoute>
          } />
          <Route path="/test-assignments/create" element={
            <ProtectedRoute pagePermission="access_test_assignment">
              <TestAssignmentForm />
            </ProtectedRoute>
          } />
          <Route path="/test-assignments/edit/:id" element={
            <ProtectedRoute pagePermission="access_test_assignment">
              <TestAssignmentForm />
            </ProtectedRoute>
          } />
          <Route path="/test-assignments/batch" element={
            <ProtectedRoute pagePermission="access_test_assignment">
              <BatchTestAssignmentForm />
            </ProtectedRoute>
          } />
          
          {/* Category Management */}
          <Route path="/categories" element={
            <ProtectedRoute pagePermission="access_category_management">
              <CategoryList />
            </ProtectedRoute>
          } />
          <Route path="/categories/create" element={
            <ProtectedRoute pagePermission="access_category_management">
              <CategoryList />
            </ProtectedRoute>
          } />
          <Route path="/categories/edit/:id" element={
            <ProtectedRoute pagePermission="access_category_management">
              <CategoryList />
            </ProtectedRoute>
          } />
          
          {/* Supervisor Tests */}
          <Route path="/supervisor-tests" element={
            <ProtectedRoute pagePermission="access_supervisor_tests">
              <SupervisorTests />
            </ProtectedRoute>
          } />
          
          {/* Candidate Tests */}
          <Route path="/my-assessments" element={
            <ProtectedRoute pagePermission="access_candidate_tests">
              <MyTests />
            </ProtectedRoute>
          } />
          <Route path="/my-profile/edit" element={
            <ProtectedRoute pagePermission="access_user_profile">
              <CandidateProfileEdit />
            </ProtectedRoute>
          } />
          <Route path="/take-test/:id" element={
            <ProtectedRoute pagePermission="access_candidate_tests">
              <TakeTest />
            </ProtectedRoute>
          } />
          <Route path="/results" element={
            <ProtectedRoute pagePermission="access_candidate_tests">
              <Results />
                </ProtectedRoute>
          } />
          <Route path="/results-dashboard" element={
            <ProtectedRoute pagePermission="access_test_management">
              <ResultsDashboard />
                </ProtectedRoute>
          } />
          
          {/* Job Management */}
          <Route path="/jobs" element={
            <ProtectedRoute pagePermission="access_job_management">
              <JobList />
            </ProtectedRoute>
          } />
          <Route path="/jobs/create" element={
            <ProtectedRoute pagePermission="access_job_management">
              <JobForm />
            </ProtectedRoute>
          } />
          <Route path="/jobs/edit/:id" element={
            <ProtectedRoute pagePermission="access_job_management">
              <JobForm />
            </ProtectedRoute>
          } />
          <Route path="/jobs/candidates/:id" element={
            <ProtectedRoute pagePermission="access_job_management">
              <JobCandidates />
            </ProtectedRoute>
          } />
          
          {/* Board Management */}
          <Route path="/boards" element={
            <ProtectedRoute pagePermission="access_evaluation_boards">
              <BoardList />
            </ProtectedRoute>
          } />
          <Route path="/boards/create" element={
            <ProtectedRoute pagePermission="access_evaluation_boards">
              <BoardForm />
            </ProtectedRoute>
          } />
          <Route path="/boards/edit/:id" element={
            <ProtectedRoute pagePermission="access_evaluation_boards">
              <BoardForm />
            </ProtectedRoute>
          } />
          <Route path="/boards/:boardId/candidates" element={
            <ProtectedRoute pagePermission="access_evaluation_boards">
              <BoardCandidates />
            </ProtectedRoute>
          } />
          <Route path="/boards/:boardId/candidates/:candidateId/assessment" element={
            <ProtectedRoute pagePermission="access_evaluation_boards">
              <CandidateAssessment />
                </ProtectedRoute>
          } />
          
          {/* Probation Dashboard */}
          <Route path="/probation-dashboard" element={
            <ProtectedRoute pagePermission="access_probation_dashboard">
              <ProbationDashboard />
                </ProtectedRoute>
          } />
          
          {/* Support System */}
          <Route path="/support" element={
            <ProtectedRoute pagePermission="access_candidate_tests">
              <SupportDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin-support" element={
            <ProtectedRoute pagePermission="access_user_management">
              <AdminSupportDashboard />
                </ProtectedRoute>
          } />
          
          {/* Email Management System */}
          <Route path="/email-dashboard" element={
            <ProtectedRoute pagePermission="access_user_management">
              <EmailDashboard />
            </ProtectedRoute>
          } />
          <Route path="/email-templates" element={
            <ProtectedRoute pagePermission="access_user_management">
              <EmailTemplateList />
            </ProtectedRoute>
          } />
          <Route path="/email-templates/new" element={
            <ProtectedRoute pagePermission="access_user_management">
              <EmailTemplateForm />
            </ProtectedRoute>
          } />
          <Route path="/email-templates/:id/edit" element={
            <ProtectedRoute pagePermission="access_user_management">
              <EmailTemplateForm />
            </ProtectedRoute>
          } />
          <Route path="/email-logs" element={
            <ProtectedRoute pagePermission="access_user_management">
              <EmailLogsList />
                </ProtectedRoute>
          } />
          
          {/* Redirect all other routes to dashboard */}
          <Route path="*" element={<Navigate to="/" />} />
            </Routes>
      </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;