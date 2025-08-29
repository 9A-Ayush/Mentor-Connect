import mongoose from 'mongoose';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { Message, Conversation } from '../models/Message.js';
import dotenv from 'dotenv';

dotenv.config();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log('✅ Database connection successful', 'green');
    return true;
  } catch (error) {
    log('❌ Database connection failed', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
};

const checkEnvironmentVariables = () => {
  log('\n🔧 Checking Environment Variables...', 'blue');
  
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName}: Set`, 'green');
    } else {
      log(`❌ ${varName}: Missing`, 'red');
      allPresent = false;
    }
  });
  
  return allPresent;
};

const checkDatabaseData = async () => {
  log('\n📊 Checking Database Data...', 'blue');
  
  try {
    const userCount = await User.countDocuments();
    const studentCount = await User.countDocuments({ role: 'student' });
    const mentorCount = await User.countDocuments({ role: 'mentor' });
    const sessionCount = await Session.countDocuments();
    const conversationCount = await Conversation.countDocuments();
    const messageCount = await Message.countDocuments();
    
    log(`✅ Total Users: ${userCount}`, 'green');
    log(`  - Students: ${studentCount}`, 'green');
    log(`  - Mentors: ${mentorCount}`, 'green');
    log(`✅ Sessions: ${sessionCount}`, 'green');
    log(`✅ Conversations: ${conversationCount}`, 'green');
    log(`✅ Messages: ${messageCount}`, 'green');
    
    if (userCount === 0) {
      log('⚠️  No users found. Run: node scripts/seedData.js', 'yellow');
      return false;
    }
    
    return true;
  } catch (error) {
    log('❌ Database data check failed', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
};

const checkModels = async () => {
  log('\n🏗️  Checking Database Models...', 'blue');
  
  try {
    // Test User model
    const sampleUser = await User.findOne();
    if (sampleUser) {
      log('✅ User model: Working', 'green');
      log(`  Sample user: ${sampleUser.name} (${sampleUser.role})`, 'green');
    } else {
      log('⚠️  User model: No data found', 'yellow');
    }
    
    // Test Session model
    const sampleSession = await Session.findOne().populate('student mentor');
    if (sampleSession) {
      log('✅ Session model: Working', 'green');
      log(`  Sample session: ${sampleSession.topic} (${sampleSession.status})`, 'green');
    } else {
      log('⚠️  Session model: No data found', 'yellow');
    }
    
    // Test Message models
    const sampleConversation = await Conversation.findOne();
    if (sampleConversation) {
      log('✅ Conversation model: Working', 'green');
    } else {
      log('⚠️  Conversation model: No data found', 'yellow');
    }
    
    return true;
  } catch (error) {
    log('❌ Model check failed', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
};

const checkCloudinaryConfig = () => {
  log('\n☁️  Checking Cloudinary Configuration...', 'blue');
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  if (cloudName && apiKey && apiSecret) {
    log('✅ Cloudinary: Configured', 'green');
    log(`  Cloud Name: ${cloudName}`, 'green');
    log(`  API Key: ${apiKey.substring(0, 6)}...`, 'green');
    return true;
  } else {
    log('❌ Cloudinary: Not properly configured', 'red');
    return false;
  }
};

const checkJWTConfig = () => {
  log('\n🔐 Checking JWT Configuration...', 'blue');
  
  const jwtSecret = process.env.JWT_SECRET;
  
  if (jwtSecret) {
    if (jwtSecret.length >= 32) {
      log('✅ JWT Secret: Properly configured', 'green');
      return true;
    } else {
      log('⚠️  JWT Secret: Too short (should be at least 32 characters)', 'yellow');
      return false;
    }
  } else {
    log('❌ JWT Secret: Not configured', 'red');
    return false;
  }
};

const generateReport = (checks) => {
  log('\n📋 HEALTH CHECK REPORT', 'bold');
  log('=' * 50, 'blue');
  
  const passed = checks.filter(check => check.passed).length;
  const total = checks.length;
  
  checks.forEach(check => {
    const status = check.passed ? '✅ PASS' : '❌ FAIL';
    const color = check.passed ? 'green' : 'red';
    log(`${status} ${check.name}`, color);
  });
  
  log('\n📊 SUMMARY', 'bold');
  log(`Passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 ALL SYSTEMS OPERATIONAL!', 'green');
    log('The Mentor Connect platform is ready to use.', 'green');
    log('\n🚀 Next Steps:', 'blue');
    log('1. Start the backend: npm run dev', 'blue');
    log('2. Start the frontend: npm run dev', 'blue');
    log('3. Visit: http://localhost:5173', 'blue');
    log('4. Test with provided accounts in TEST_GUIDE.md', 'blue');
  } else {
    log('\n⚠️  ISSUES DETECTED!', 'yellow');
    log('Please fix the failed checks before proceeding.', 'yellow');
    log('Refer to the error messages above for details.', 'yellow');
  }
};

const runHealthCheck = async () => {
  log('🏥 MENTOR CONNECT HEALTH CHECK', 'bold');
  log('=' * 50, 'blue');
  log(`Timestamp: ${new Date().toISOString()}`, 'blue');
  
  const checks = [];
  
  // Environment variables check
  const envCheck = checkEnvironmentVariables();
  checks.push({ name: 'Environment Variables', passed: envCheck });
  
  // JWT configuration check
  const jwtCheck = checkJWTConfig();
  checks.push({ name: 'JWT Configuration', passed: jwtCheck });
  
  // Cloudinary configuration check
  const cloudinaryCheck = checkCloudinaryConfig();
  checks.push({ name: 'Cloudinary Configuration', passed: cloudinaryCheck });
  
  // Database connection check
  const dbConnection = await connectDB();
  checks.push({ name: 'Database Connection', passed: dbConnection });
  
  if (dbConnection) {
    // Database data check
    const dataCheck = await checkDatabaseData();
    checks.push({ name: 'Database Data', passed: dataCheck });
    
    // Models check
    const modelsCheck = await checkModels();
    checks.push({ name: 'Database Models', passed: modelsCheck });
  }
  
  // Generate final report
  generateReport(checks);
  
  // Close database connection
  await mongoose.connection.close();
  
  // Exit with appropriate code
  const allPassed = checks.every(check => check.passed);
  process.exit(allPassed ? 0 : 1);
};

// Run the health check
runHealthCheck().catch(error => {
  log('❌ Health check failed with error:', 'red');
  log(error.message, 'red');
  process.exit(1);
});
