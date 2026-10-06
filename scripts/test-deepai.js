import 'dotenv/config';

const apiKey = process.env.DEEPAI_API_KEY;

if (!apiKey) {
  console.error('Missing DEEPAI_API_KEY. Add it to backend/.env or set it in your shell.');
  process.exit(1);
}

const form = new FormData();
form.append('text', 'a serene mountain lake at sunrise');

const response = await fetch('https://api.deepai.org/api/text2img', {
  method: 'POST',
  headers: {
    'api-key': apiKey
  },
  body: form
});

const result = await response.json();

if (!response.ok || !result.output_url) {
  console.error(`DeepAI request failed (${response.status}):`);
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(result.output_url);