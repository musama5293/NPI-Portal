const crypto = require('crypto');
const config = require('../config/config');

/**
 * Encrypt text
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text
 */
exports.encryptText = (text) => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(config.ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + encrypted;
};

/**
 * Decrypt text
 * @param {string} encryptedText - Text to decrypt
 * @returns {string} - Decrypted text
 */
exports.decryptText = (encryptedText) => {
  if (!encryptedText) return false;
  
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(config.ENCRYPTION_KEY, 'salt', 32);
    
    const iv = Buffer.from(encryptedText.slice(0, 32), 'hex');
    const encrypted = encryptedText.slice(32);
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return false;
  }
};

/**
 * Safe base64 encode
 * @param {string} string - String to encode
 * @returns {string} - Encoded string
 */
exports.safeB64encode = (string) => {
  if (!string) return '';
  
  const data = Buffer.from(string).toString('base64');
  return data.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * Safe base64 decode
 * @param {string} string - String to decode
 * @returns {string} - Decoded string
 */
exports.safeB64decode = (string) => {
  if (!string) return '';
  
  const data = string.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = 4 - (data.length % 4);
  
  const paddedData = padLength < 4 ? data + '='.repeat(padLength) : data;
  return Buffer.from(paddedData, 'base64').toString('utf8');
}; 