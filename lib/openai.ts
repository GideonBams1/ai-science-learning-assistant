import OpenAI from "openai";

// Supports OpenAI, Gemini (via OpenAI-compatible endpoint), Groq, OpenRouter, etc.
const openai = new OpenAI({
  apiKey:  process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL, // leave undefined to use OpenAI default
});

export const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export default openai;
