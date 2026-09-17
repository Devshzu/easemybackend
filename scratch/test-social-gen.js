import { connectDB, disconnectDB } from '../src/config/db.js';
import { generateManualSocialPost } from '../src/modules/social/social.generator.js';

async function runTest() {
  await connectDB();
  try {
    console.log('🚀 Starting test AI LinkedIn post & image generation...');
    const post = await generateManualSocialPost({
      topic: 'How AI Agents and Custom Web Development are Transforming Modern Businesses',
      category: 'technology',
      generationType: 'TRENDING',
      platform: 'LINKEDIN',
    });
    console.log('\n========================================');
    console.log('✅ SUCCESS! GENERATED LINKEDIN POST');
    console.log('========================================');
    console.log('📌 ID:', post._id);
    console.log('📌 Category:', post.category);
    console.log('📌 Generation Type:', post.generationType);
    console.log('📌 Hook:', post.hook);
    console.log('📌 Hashtags:', post.hashtags.join(', '));
    console.log('🖼️ Generated Image URL (with Logo Overlay):', post.imageUrl);
    console.log('\n📝 CONTENT:\n', post.content);
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Generation Error:', err);
  } finally {
    await disconnectDB();
  }
}

runTest();
