/**
 * ⚡ QUICK TEST - Ultra Magic V2
 * 
 * Creates 3 blog posts to verify system works
 * 
 * Usage: node scripts/quick-test.js
 */

import UltraMagicV2Enhanced from '../src/services/ultra-magic-v2-enhanced.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('⚡ ULTRA MAGIC V2 - QUICK TEST');
console.log('═══════════════════════════════════════════\n');

async function quickTest() {
  try {
    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE_URI);
    console.log('✅ Connected!\n');
    
    // Initialize V2
    const ultraMagic = new UltraMagicV2Enhanced();
    
    console.log('🚀 Creating 3 ultra-optimized blog posts...');
    console.log('⏳ This will take 2-3 minutes...\n');
    console.log('Progress:');
    
    // Execute with minimal config for speed
    const result = await ultraMagic.executeV2TotalDomination({
      contentCount: 3,
      dominationLevel: 'HIGH',
      useFreeSources: true,
      buildInternalWeb: false, // Skip for speed in test
      optimizeCTR: true
    });
    
    console.log('\n═══════════════════════════════════════════');
    console.log('✅ QUICK TEST COMPLETED!');
    console.log('═══════════════════════════════════════════\n');
    
    console.log('📊 RESULTS:');
    console.log(`   Status: ${result.v2_domination_status}`);
    console.log(`   Blogs Created: ${result.phase_3_blogs_generated}`);
    console.log(`   Keywords Targeted: ${result.total_keywords_targeted}`);
    console.log(`   Avg Keywords/Post: ${result.avg_keywords_per_post}\n`);
    
    if (result.v2_domination_status === 'ULTIMATE_SUCCESS') {
      console.log('🎉 SUCCESS! Your V2 system is working perfectly!');
      console.log('\n📋 Next Steps:');
      console.log('   1. Check your blog posts in database');
      console.log('   2. Visit: http://localhost:3000/blog (frontend)');
      console.log('   3. Run full domination: 100 posts');
      console.log('   4. Execute: POST /api/ultra-magic-v2/execute-v2-domination\n');
    } else {
      console.log('⚠️ WARNING: Some issues occurred');
      console.log('   Check the error details above\n');
    }
    
    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Check MongoDB connection string in .env');
    console.error('   2. Verify Gemini API keys are valid');
    console.error('   3. Ensure all npm packages are installed');
    console.error('   4. Run: npm install\n');
    
    process.exit(1);
  }
}

quickTest();
