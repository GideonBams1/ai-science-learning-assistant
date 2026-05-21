import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatApiRequest, ChatApiResponse, ApiError } from "@/types";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey:  process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});
const MODEL = process.env.OPENAI_MODEL ?? "llama-3.1-8b-instant";

// ── JSON helpers ──────────────────────────────────────────────────────────────

function extractJSON(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const first = raw.indexOf("{"), last = raw.lastIndexOf("}");
  if (first !== -1 && last !== -1) return raw.slice(first, last + 1);
  return raw.trim();
}

// The chat response is intentionally simple — NO mermaid code embedded in JSON.
// Mermaid is fetched separately via /api/diagram to avoid JSON control-char errors.
type SimpleResponse = {
  content:        string;
  topic:          string;
  comprehension:  number;
  triggerQuiz:    boolean;
  quizTopic:      string | null;
  wantsDiagram:   boolean;
  diagramTitle:   string | null;
  illustrationPrompt: string | null;
  illustrationAlt:    string | null;
};

function safeParse(raw: string): SimpleResponse {
  const extracted = extractJSON(raw);

  // Attempt 1 — direct
  try { return JSON.parse(extracted) as SimpleResponse; } catch { /* next */ }

  // Attempt 2 — strip every literal control character then parse
  try {
    const cleaned = extracted.replace(/[\x00-\x1F]/g, (ch) => {
      if (ch === "\n") return "\\n";
      if (ch === "\r") return "\\r";
      if (ch === "\t") return "\\t";
      return ""; // drop other control chars
    });
    return JSON.parse(cleaned) as SimpleResponse;
  } catch { /* next */ }

  // Attempt 3 — nuclear strip, ignore formatting
  try {
    const nuclear = extracted
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
    return JSON.parse(nuclear) as SimpleResponse;
  } catch { /* next */ }

  // Attempt 4 — fallback: treat the whole raw output as the reply
  console.warn("[chat] all JSON attempts failed, wrapping raw text");
  return {
    content:            raw.trim() || "Sorry, I had trouble formatting my reply. Please try again.",
    topic:              "Science",
    comprehension:      50,
    triggerQuiz:        false,
    quizTopic:          null,
    wantsDiagram:       false,
    diagramTitle:       null,
    illustrationPrompt: null,
    illustrationAlt:    null,
  };
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(
  difficulty: string,
  topicsStudied: string[],
  weakTopics: string[],
  strongTopics: string[],
): string {
  const diffMap: Record<string, string> = {
    beginner:     "Simple language and everyday analogies, no jargon. Like explaining to a curious 10-year-old.",
    intermediate: "Clear explanations with key terms defined. High school level.",
    advanced:     "University/research level: equations, mechanisms, edge cases.",
  };

  const ctx = topicsStudied.length > 0
    ? ` Learner has studied: ${topicsStudied.slice(-8).join(", ")}. Weak: ${weakTopics.join(", ") || "none"}. Strong: ${strongTopics.join(", ") || "none"}.`
    : "";

  return `You are an expert AI science tutor.${ctx}

Difficulty: ${diffMap[difficulty] ?? diffMap.intermediate}

Reply with ONLY this JSON object — no text before or after, no code fences:
{"content":"<reply with **bold** and - bullets>","topic":"<1-5 word topic>","comprehension":<0-100>,"triggerQuiz":<true or false>,"quizTopic":<"topic" or null>,"wantsDiagram":<true or false>,"diagramTitle":<"short title" or null>,"illustrationPrompt":<"10-word image description" or null>,"illustrationAlt":<"alt text" or null>}

Rules:
- Set wantsDiagram true for processes, cycles, hierarchies, or sequences (do NOT include the diagram code here)
- Set illustrationPrompt for anatomy, astronomy, molecules, lab equipment
- Set triggerQuiz true after 2-3 exchanges on one topic or if student asks to be tested
- Be encouraging and conversational`;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ChatApiResponse | ApiError>> {
  try {
    const { messages, difficulty, learnerData } = (await req.json()) as ChatApiRequest;

    if (!messages?.length)
      return NextResponse.json({ error: "Messages are required." }, { status: 400 });

    const systemPrompt = buildSystemPrompt(
      difficulty,
      learnerData.topicsStudied,
      learnerData.weakTopics,
      learnerData.strongTopics,
    );

    const completion = await openai.chat.completions.create({
      model:       MODEL,
      temperature: 0.6,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-12).map((m) => ({
          role:    m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });

    const raw    = completion.choices[0]?.message?.content ?? "{}";
    const parsed = safeParse(raw);

    const illustration = parsed.illustrationPrompt
      ? {
          url:    `https://image.pollinations.ai/prompt/${encodeURIComponent(parsed.illustrationPrompt)}?width=800&height=500&nologo=true`,
          prompt: parsed.illustrationPrompt,
          alt:    parsed.illustrationAlt ?? parsed.illustrationPrompt,
        }
      : undefined;

    const response: ChatApiResponse = {
      content:       parsed.content       || "I'm not sure how to respond. Please try again.",
      topic:         parsed.topic         || "Science",
      comprehension: parsed.comprehension ?? 50,
      triggerQuiz:   parsed.triggerQuiz   ?? false,
      quizTopic:     parsed.quizTopic     ?? undefined,
      diagramTopic:  parsed.wantsDiagram ? (parsed.topic || undefined) : undefined,
      diagramTitle:  parsed.diagramTitle  ?? undefined,
      illustration,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error("[chat] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error." },
      { status: 500 },
    );
  }
}
