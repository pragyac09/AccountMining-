import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.5-flash',
    'gemini-2.0-flash-001'
  ];
  for (const m of modelsToTest) {
    try {
      console.log(`Testing ${m}...`);
      const response = await ai.models.generateContent({
        model: m,
        contents: 'reply with "hello"'
      });
      console.log(`Success with ${m}:`, response.text);
      return;
    } catch (err) {
      console.log(`Failed ${m}:`, err.message);
    }
  }
}
test().catch(console.error);
