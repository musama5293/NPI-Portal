const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/npi_portal',
  JWT_SECRET: process.env.JWT_SECRET || 'npi_secret_key_with_high_entropy_value',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'smtp.gmail.com',
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@npi.com',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'your_security_cipherSeed'
}; 