import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const SUBMISSIONS_FILE = path.join(__dirname, 'submissions.json');

// Initialize GenAI
async function generateContentWithRetry(params, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      if (err?.status === 503 && attempt < maxAttempts) {
        console.warn(`Gemini API 503, retry ${attempt}/${maxAttempts}`);
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      throw err;
    }
  }
}

let ai;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// Endpoint to classify the idea
app.post('/api/classify', async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: 'API key is missing or not configured in .env' });
  }

  const { q1, q2, q3 } = req.body;

  const systemPrompt = `You are an AI use case classifier for enterprise accounts. Classify the user's workplace pain point into exactly one of three categories: Automation, Process Fix, or AI Use Case. Use these definitions:\n- Automation: The task follows fixed rules. Same input, same output. No judgment needed. Example: auto-generate a daily report.\n- Process Fix: The process itself is broken or duplicated. Technology won't fix it — the workflow needs to change first.\n- AI Use Case: The task requires reading messy/unstructured data or applying judgment. Example: reading 500 support tickets and grouping by issue type.\nRespond ONLY in this JSON format, no markdown, no explanation: { "idea_summary": "One sentence summary of the core pain point", "category": "Automation" | "Process Fix" | "AI Use Case", "category_reason": "One sentence explaining why this category fits" }`;

  const userPrompt = `Here are the answers:
Q1 (Don't want to do): ${q1}
Q2 (Taking too much time): ${q2}
Q3 (Recurring problem): ${q3}`;

  try {
    const response = await generateContentWithRetry({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
      ]
    });

    let text = response.text;
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      res.json(parsed);
    } else {
      res.status(500).json({ error: 'Failed to parse JSON from AI' });
    }
  } catch (err) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: 'Something went wrong — please try again' });
  }
});

// Endpoint to save submissions
app.post('/api/save', (req, res) => {
  const submission = req.body;
  submission.timestamp = new Date().toISOString();

  fs.readFile(SUBMISSIONS_FILE, 'utf8', (err, data) => {
    let submissions = [];
    if (!err && data) {
      try {
        submissions = JSON.parse(data);
      } catch (e) {
        console.error("Error parsing submissions.json");
      }
    }

    submissions.push(submission);

    fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), (err) => {
      if (err) {
        console.error("Error writing submissions.json:", err);
        return res.status(500).json({ error: 'Failed to save submission' });
      }
      res.json({ success: true });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Backend proxy running on http://localhost:${PORT}`);
});
