import { config } from './src/config/env.config.js';

console.log('=== GEMINI CONFIG DEBUG ===');
console.log('Model:', config.blogAutomation.geminiModel);
console.log('Keys Count:', config.blogAutomation.geminiKeys.length);
console.log('First Key:', config.blogAutomation.geminiKeys[0].substring(0, 20) + '...');
console.log('\n=== TEST URL ===');
const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.blogAutomation.geminiModel}:generateContent`;
console.log(testUrl);

console.log('\n=== TESTING API CALL ===');
const testKey = config.blogAutomation.geminiKeys[0];
fetch(`${testUrl}?key=${testKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: 'Say hi' }] }]
  })
})
.then(r => {
  console.log('Status:', r.status);
  return r.json();
})
.then(d => console.log('Response:', JSON.stringify(d, null, 2)))
.catch(e => console.error('Error:', e.message));
