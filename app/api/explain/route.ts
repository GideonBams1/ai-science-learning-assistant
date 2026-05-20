import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ExplanationRequest, ExplanationResponse, ApiError } from "@/types";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey:  process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL, // undefined = use OpenAI; set to Groq URL for free tier
});
const MODEL = process.env.OPENAI_MODEL ?? "llama-3.1-8b-instant";

const SYSTEM_PROMPT = `You are an expert science educator. You MUST respond with ONLY a raw JSON object — no markdown, no code fences, no explanation outside the JSON.

Required format:
{
  "topic": "<short topic name, 1-5 words>",
  "explanation": "<rich explanation using **bold**, bullet points starting with -, and newlines>",
  "keyPoints": ["<point 1>", "<point 2>", "<point 3>", "<point 4>", "<point 5>"]
}`;

const DIFFICULTY_MAP: Record<string, string> = {
  beginner:     "Explain as if to a curious 10-year-old. Use everyday analogies, avoid jargon.",
  intermediate: "Explain as if to a high-school student. Introduce key terms with brief definitions.",
  advanced:     "Explain at university/research level. Include relevant equations, mechanisms, and nuance.",
};

function extractJSON(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const first = raw.indexOf("{"), last = raw.lastIndexOf("}");
  if (first !== -1 && last !== -1) return raw.slice(first, last + 1);
  return raw.trim();
}

export async function POST(req: NextRequest): Promise<NextResponse<ExplanationResponse | ApiError>> {
  try {
    const { question, difficulty } = (await req.json()) as ExplanationRequest;

    if (!question?.trim())
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    if (!["beginner", "intermediate", "advanced"].includes(difficulty))
      return NextResponse.json({ error: "Invalid difficulty level." }, { status: 400 });

    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: `Difficulty: ${DIFFICULTY_MAP[difficulty]}\n\nQuestion: ${question.trim()}` },
      ],
    });

    const raw    = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(extractJSON(raw)) as ExplanationResponse;
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error("[explain] error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unexpected error." }, { status: 500 });
  }
}
