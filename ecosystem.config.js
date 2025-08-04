module.exports = {
  apps: [
    {
      name: 'npi-backend',
      script: './server/server.js',
      cwd: '/var/www/npi-portal/Portal',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    }
    // Frontend is now served by Nginx as static files
  ]
}; 