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
    },
    {
      name: 'npi-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/npi-portal/Portal/client',
      env: {
        NODE_ENV: 'development',
        PORT: 5001,
        HOST: '0.0.0.0',
        DANGEROUSLY_DISABLE_HOST_CHECK: 'true'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '../logs/frontend-error.log',
      out_file: '../logs/frontend-out.log',
      log_file: '../logs/frontend-combined.log',
      time: true
    }
  ]
}; 