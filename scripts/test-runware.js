import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import WebSocket from 'ws';

const apiKey = process.env.RUNWARE_API_KEY;
const model = process.env.RUNWARE_MODEL || 'runware:100@1';
const prompt = process.env.RUNWARE_PROMPT || 'a serene mountain lake at sunrise';
const timeoutMs = 120000;

if (!apiKey) {
  console.error('Missing RUNWARE_API_KEY. Add it to backend/.env or set it in your shell.');
  process.exit(1);
}

const socket = new WebSocket('wss://ws-api.runware.ai/v1');
const taskUUID = randomUUID();
const timeout = setTimeout(() => {
  socket.close();
  console.error(`Runware request timed out after ${timeoutMs / 1000} seconds.`);
  process.exit(1);
}, timeoutMs);

const finish = (exitCode, message) => {
  clearTimeout(timeout);
  socket.close();
  if (exitCode === 0) {
    console.log(message);
  } else {
    console.error(message);
  }
  process.exit(exitCode);
};

const sendImageRequest = () => {
  socket.send(JSON.stringify([{
    taskType: 'imageInference',
    taskUUID,
    model,
    positivePrompt: prompt,
    width: 1024,
    height: 1024,
    numberResults: 1,
    outputType: 'URL'
  }]));
};

socket.addEventListener('open', () => {
  socket.send(JSON.stringify([{ taskType: 'authentication', apiKey }]));
});

socket.addEventListener('message', (event) => {
  let payload;

  try {
    payload = JSON.parse(event.data);
  } catch {
    finish(1, `Runware returned invalid JSON: ${event.data}`);
    return;
  }

  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.data)
      ? payload.data
      : [payload];
  const error = payload.error || payload.errors?.[0] || items[0]?.error;
  if (error) {
    finish(1, `Runware request failed: ${JSON.stringify(error, null, 2)}`);
    return;
  }

  if (items.some((item) => item.taskType === 'authentication')) {
    sendImageRequest();
    return;
  }

  const result = items.find((item) => item.taskUUID === taskUUID || item.imageURL);

  if (result?.imageURL) {
    finish(0, result.imageURL);
  }
});

socket.addEventListener('error', () => {
  finish(1, 'Runware WebSocket connection failed. Check the API key and network access.');
});

socket.addEventListener('close', (event) => {
  if (event.code !== 1000) {
    finish(1, `Runware WebSocket closed unexpectedly (code ${event.code}).`);
  }
});