import UltraMagicV2Enhanced from './src/services/ultra-magic-v2-enhanced.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing Single Blog Generation with Gemini 3.6-flash\n');

async function testSingleBlog() {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const ultraMagic = new UltraMagicV2Enhanced();
    
    console.log('📝 Generating 1 blog post...\n');
    
    const result = await ultraMagic.executeV2TotalDomination({
      contentCount: 1,
      dominationLevel: 'HIGH',
      useFreeSources: false, // Skip keyword discovery for speed
      buildInternalWeb: false,
      optimizeCTR: true
    });
    
    console.log('\n✅ RESULT:');
    console.log(JSON.stringify(result, null, 2));
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testSingleBlog();
