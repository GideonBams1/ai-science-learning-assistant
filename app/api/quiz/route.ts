import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { QuizRequest, QuizResponse, ApiError } from "@/types";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey:  process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});
const MODEL = process.env.OPENAI_MODEL ?? "llama-3.1-8b-instant";

const SYSTEM_PROMPT = `You are an expert science quiz writer. You MUST respond with ONLY a raw JSON object — no markdown, no code fences, no explanation outside the JSON.

Required format:
{
  "questions": [
    {
      "question":    "<question text>",
      "options":     ["<A>", "<B>", "<C>", "<D>"],
      "answer":      <0-3 integer — index of correct option>,
      "explanation": "<1-2 sentence explanation of why the answer is correct>"
    }
  ]
}

Rules: exactly 4 options per question, vary the answer index, make wrong options plausible.`;

const DIFFICULTY_MAP: Record<string, string> = {
  beginner:     "simple conceptual questions, straightforward vocabulary",
  intermediate: "application and understanding questions, moderate terminology",
  advanced:     "analysis and synthesis questions, technical depth, possible calculations",
};

function extractJSON(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const first = raw.indexOf("{"), last = raw.lastIndexOf("}");
  if (first !== -1 && last !== -1) return raw.slice(first, last + 1);
  return raw.trim();
}

export async function POST(req: NextRequest): Promise<NextResponse<QuizResponse | ApiError>> {
  try {
    const { topic, difficulty, count = 5 } = (await req.json()) as QuizRequest;

    if (!topic?.trim())
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    if (!["beginner", "intermediate", "advanced"].includes(difficulty))
      return NextResponse.json({ error: "Invalid difficulty level." }, { status: 400 });

    const questionCount = Math.min(Math.max(Number(count) || 5, 3), 10);

    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.8,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: `Generate ${questionCount} quiz questions about "${topic.trim()}".\nDifficulty: ${DIFFICULTY_MAP[difficulty]}.` },
      ],
    });

    const raw    = completion.choices[0]?.message?.content ?? '{"questions":[]}';
    const parsed = JSON.parse(extractJSON(raw)) as QuizResponse;
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error("[quiz] error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unexpected error." }, { status: 500 });
  }
}
