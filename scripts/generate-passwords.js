#!/usr/bin/env node

/**
 * Password Generation Script for WipeOut Security Configuration
 * 
 * This script helps generate secure passwords and hashes for the WipeOut application.
 * Run with: node scripts/generate-passwords.js
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

console.log('🔐 WipeOut Security Configuration Generator\n');

// Generate secure random passwords
function generateSecurePassword(length = 32) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

// Generate encryption key (exactly 32 characters)
function generateEncryptionKey() {
  return crypto.randomBytes(16).toString('hex'); // 32 hex characters
}

// Generate JWT secret
function generateJWTSecret() {
  return crypto.randomBytes(32).toString('base64'); // Base64 encoded 32 bytes
}

async function main() {
  try {
    // Generate passwords
    const postgresPassword = generateSecurePassword(24);
    const redisPassword = generateSecurePassword(24);
    const adminPassword = generateSecurePassword(16);
    const grafanaPassword = generateSecurePassword(16);
    
    // Generate keys
    const jwtSecret = generateJWTSecret();
    const encryptionKey = generateEncryptionKey();
    
    // Generate admin password hash
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    
    console.log('Generated secure configuration values:\n');
    
    console.log('# Database Configuration');
    console.log(`POSTGRES_PASSWORD=${postgresPassword}`);
    console.log('');
    
    console.log('# Redis Configuration');
    console.log(`REDIS_PASSWORD=${redisPassword}`);
    console.log('');
    
    console.log('# Security Configuration');
    console.log(`JWT_SECRET=${jwtSecret}`);
    console.log(`ENCRYPTION_KEY=${encryptionKey}`);
    console.log('');
    
    console.log('# Admin User Configuration');
    console.log(`# Admin username: admin`);
    console.log(`# Admin password: ${adminPassword}`);
    console.log(`ADMIN_PASSWORD_HASH=${adminPasswordHash}`);
    console.log('');
    
    console.log('# Grafana Configuration');
    console.log(`GRAFANA_ADMIN_PASSWORD=${grafanaPassword}`);
    console.log('');
    
    console.log('📋 Instructions:');
    console.log('1. Copy the values above to your .env file');
    console.log('2. Keep the admin password safe - you\'ll need it to log in');
    console.log('3. Never commit the .env file to version control');
    console.log('4. Set proper file permissions: chmod 600 .env');
    console.log('');
    
    console.log('🔒 Security Notes:');
    console.log('- All passwords are cryptographically secure');
    console.log('- The encryption key is exactly 32 characters');
    console.log('- The JWT secret is base64 encoded for security');
    console.log('- The admin password is bcrypt hashed with salt rounds 10');
    console.log('');
    
    console.log('⚠️  Important:');
    console.log('- Store these values securely');
    console.log('- Use a password manager for production');
    console.log('- Rotate passwords regularly');
    console.log('- Monitor for unauthorized access');
    
  } catch (error) {
    console.error('❌ Error generating passwords:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateSecurePassword,
  generateEncryptionKey,
  generateJWTSecret
};
