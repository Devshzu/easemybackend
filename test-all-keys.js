import { config } from './src/config/env.config.js';

console.log('=== TESTING ALL GEMINI API KEYS ===\n');

const keys = config.blogAutomation.geminiKeys;
const model = config.blogAutomation.geminiModel;

async function testKey(key, index) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say hello' }] }]
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Key ${index + 1}: WORKING (${key.substring(0, 15)}...)`);
      console.log(`   Response: ${data.candidates[0].content.parts[0].text}\n`);
      return true;
    } else {
      if (response.status === 429) {
        console.log(`❌ Key ${index + 1}: QUOTA EXCEEDED (${key.substring(0, 15)}...)`);
        console.log(`   Error: ${data.error.message.substring(0, 100)}...\n`);
      } else {
        console.log(`❌ Key ${index + 1}: ERROR ${response.status} (${key.substring(0, 15)}...)`);
        console.log(`   Error: ${data.error.message}\n`);
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Key ${index + 1}: FAILED (${key.substring(0, 15)}...)`);
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

console.log(`Testing ${keys.length} keys with model: ${model}\n`);
console.log('─'.repeat(60) + '\n');

for (let i = 0; i < keys.length; i++) {
  await testKey(keys[i], i);
  // Small delay between tests
  await new Promise(resolve => setTimeout(resolve, 500));
}

console.log('─'.repeat(60));
console.log('\n✅ Testing complete!');
