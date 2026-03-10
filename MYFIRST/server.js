const express = require('express');
const OpenAI = require('openai');
const path = require('path');
const cors = require('cors');
require('dotenv').config({ path: path.resolve(__dirname, '../.env/.env') });

// --- Basic Setup ---
const app = express();
const port = 3000;

// --- Middleware ---
// Enable CORS for all origins
app.use(cors());
// To parse JSON bodies from POST requests
app.use(express.json());
// To serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// --- API Client Initialization ---
// Check if the Groq API key is available
if (!process.env.GROQ_API_KEY) {
  console.error('ERROR: GROQ_API_KEY is not set in your .env file.');
  process.exit(1); // Exit the process with an error code
}

// Initialize the Groq client
const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// --- Routes ---

// The main chat endpoint
app.post('/chat', async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required in the request body.' });
    }

    console.log(`Received message: "${message}"`);

    console.log('Sending request to Groq API...');
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      // The 'llama3-8b-8192' model has been decommissioned.
      // Using a current, valid model like 'llama3-70b-8192'.
      model: 'llama-3.3-70b-versatile',
    });

    const reply = chatCompletion.choices[0]?.message?.content;
    console.log('Received reply from Groq:', reply);

    if (reply) {
      res.json({ reply });
    } else {
      const err = new Error('Groq API returned an empty or invalid reply.');
      err.status = 502; // 502 Bad Gateway is appropriate for an invalid upstream response
      return next(err);
    }
  } catch (error) {
    // Pass the error to the custom error handling middleware
    return next(error);
  }
});

// --- Custom Error Handling Middleware ---
// This is a "catch-all" error handler that should be the LAST middleware added.
// It catches all errors from the route handlers and sends a structured JSON error response.
app.use((err, req, res, next) => {
  console.error('An error occurred:', err);
  const status = err.status || 500;
  const details = err.error?.message || err.message || 'An unknown error occurred.';
  res.status(status).json({ error: 'An error occurred while communicating with the AI.', details });
});

// --- Server Start ---
app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
    console.log('Open your browser and navigate to http://localhost:3000 to get started.');
});
