const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB } = require('./config/db');
const config = require('./config/db');
const SupportSocketHandler = require('./socket/supportSocket');

// Route imports
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const roleRoutes = require('./routes/role.routes');
const testRoutes = require('./routes/test.routes');
const candidateRoutes = require('./routes/candidate.routes');
const organizationRoutes = require('./routes/organization.routes');
const instituteRoutes = require('./routes/institute.routes');
const departmentRoutes = require('./routes/department.routes');
const jobRoutes = require('./routes/job.routes');
// New route imports
const domainRoutes = require('./routes/domain.routes');
const subdomainRoutes = require('./routes/subdomain.routes');
const questionRoutes = require('./routes/question.routes');
const testScoreRoutes = require('./routes/test-score.routes');
const boardRoutes = require('./routes/board.routes');
const probationRoutes = require('./routes/probation.routes');
const supportRoutes = require('./routes/support.routes');
const notificationRoutes = require('./routes/notification.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const emailTemplateRoutes = require('./routes/email-template.routes');
const emailManagementRoutes = require('./routes/email-management.routes');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5001'],
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Initialize Support Socket Handler
const supportSocketHandler = new SupportSocketHandler(io);

// Handle socket connections
io.on('connection', (socket) => {
  supportSocketHandler.handleConnection(socket);
});

// Make io instance available to the app for notifications
app.set('io', io);

// Connect to database
connectDB();

// CORS configuration - updated to accept requests from port 5001
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5001','http://10.250.7.238:5001','http://npi-ai.nust.edu.pk:5001'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/test', testRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api', jobRoutes); // Job routes - includes /jobs and /job-slots
// New routes
app.use('/api/domains', domainRoutes);
app.use('/api/subdomains', subdomainRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/scores', testScoreRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/probations', probationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/email-management', emailManagementRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to NUST Personality Index API',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: config.NODE_ENV === 'development' ? err.message : 'Server error'
  });
});

// Start server
const PORT = config.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
  console.log(`WebSocket server ready for real-time support communication`);
});