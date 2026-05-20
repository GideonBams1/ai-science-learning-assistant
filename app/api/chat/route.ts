import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatApiRequest, ChatApiResponse, ApiError, DiagramAttachment } from "@/types";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey:  process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});
const MODEL = process.env.OPENAI_MODEL ?? "llama-3.1-8b-instant";

// ── JSON extraction + sanitization ───────────────────────────────────────────

function extractJSON(raw: string): string {
  // Strip markdown code fences
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  // Pull out the outermost { … }
  const first = raw.indexOf("{"), last = raw.lastIndexOf("}");
  if (first !== -1 && last !== -1) return raw.slice(first, last + 1);
  return raw.trim();
}

/** Escape literal control chars inside JSON string values (LLM often emits raw newlines). */
function sanitizeJSON(json: string): string {
  let result = "", inStr = false, escaped = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (escaped)             { result += ch; escaped = false; continue; }
    if (ch === "\\" && inStr){ escaped = true; result += ch; continue; }
    if (ch === '"')          { inStr = !inStr; result += ch; continue; }
    if (inStr) {
      if (ch === "\n") { result += "\\n"; continue; }
      if (ch === "\r") { result += "\\r"; continue; }
      if (ch === "\t") { result += "\\t"; continue; }
      if (ch.charCodeAt(0) < 0x20) continue; // strip other control chars
    }
    result += ch;
  }
  return result;
}

type ParsedChat = {
  content:       string;
  topic:         string;
  comprehension: number;
  triggerQuiz:   boolean;
  quizTopic?:    string | null;
  diagram?:      DiagramAttachment | null;
  illustration?: { prompt: string; alt: string } | null;
};

/** Try JSON.parse → sanitize → fallback to plain text response. Never throws. */
function parseChat(raw: string): ParsedChat {
  const extracted = extractJSON(raw);

  // Attempt 1: parse as-is
  try { return JSON.parse(extracted) as ParsedChat; } catch { /* continue */ }

  // Attempt 2: sanitize literal control chars then parse
  try { return JSON.parse(sanitizeJSON(extracted)) as ParsedChat; } catch { /* continue */ }

  // Attempt 3: the model returned plain text (not JSON at all) — wrap it safely
  console.warn("[chat] model returned non-JSON, using raw text as content");
  return {
    content:       raw.trim() || "I had trouble formatting my response. Please try again.",
    topic:         "Science",
    comprehension: 50,
    triggerQuiz:   false,
    diagram:       null,
    illustration:  null,
  };
}

// ── System prompt ─────────────────────────────────────────────────────────────
function buildSystemPrompt(
  difficulty: string,
  topicsStudied: string[],
  weakTopics: string[],
  strongTopics: string[],
): string {
  const diffInstructions: Record<string, string> = {
    beginner:     "Use simple everyday language, relatable analogies, avoid jargon. Write as if talking to a curious 10-year-old.",
    intermediate: "Use clear explanations with key terminology defined inline. Suitable for high school students.",
    advanced:     "Go deep: include equations, mechanisms, edge cases, and nuance. University/research level.",
  };

  const personalisation = topicsStudied.length > 0
    ? `\n\nLEARNER CONTEXT:\n- Already studied: ${topicsStudied.slice(-10).join(", ")}\n- Needs work on: ${weakTopics.join(", ") || "none yet"}\n- Strong topics: ${strongTopics.join(", ") || "none yet"}\n\nConnect new explanations to prior knowledge and gently fill identified gaps.`
    : "";

  return `You are an expert AI science tutor. Respond ONLY with a single valid JSON object — absolutely no text before or after it, no markdown fences.

DIFFICULTY: ${diffInstructions[difficulty] ?? diffInstructions.intermediate}${personalisation}

EXACT JSON SCHEMA (copy structure exactly, replace placeholder values):
{"content":"<explanation using **bold** and - bullet points>","topic":"<1-5 word topic>","comprehension":<0-100>,"triggerQuiz":<true|false>,"quizTopic":<"topic string" or null>,"diagram":<null or {"type":"mermaid","code":"<mermaid syntax — use \\n for line breaks inside the string>","title":"<title>"}>,"illustration":<null or {"prompt":"<10-15 word image description>","alt":"<alt text}"}>}

CRITICAL RULES:
1. Output ONLY the JSON object. Zero words outside it.
2. In the "diagram.code" field, represent newlines as the two characters \\ and n — never a real line break.
3. Set diagram to null and illustration to null when not needed.
4. Set triggerQuiz true after 2-3 exchanges on the same topic, or when the student asks to be tested.
5. Include a diagram for processes, cycles, hierarchies, or sequences.
6. Include an illustration for anatomy, astronomy, lab equipment, molecular structures.`;
}

// ── Route ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse<ChatApiResponse | ApiError>> {
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

    const conversationMessages = messages.slice(-12).map((m) => ({
      role:    m.role as "user" | "assistant",
      content: m.content,
    }));

    const completion = await openai.chat.completions.create({
      model:       MODEL,
      temperature: 0.6,   // slightly lower = more reliable JSON structure
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationMessages,
      ],
    });

    const raw    = completion.choices[0]?.message?.content ?? "{}";
    const parsed = parseChat(raw);

    // Build Pollinations illustration URL if requested
    const illustration = parsed.illustration?.prompt
      ? {
          url:    `https://image.pollinations.ai/prompt/${encodeURIComponent(parsed.illustration.prompt)}?width=800&height=500&nologo=true`,
          prompt: parsed.illustration.prompt,
          alt:    parsed.illustration.alt ?? parsed.illustration.prompt,
        }
      : undefined;

    const response: ChatApiResponse = {
      content:       parsed.content       ?? "I'm not sure how to respond to that.",
      topic:         parsed.topic         ?? "Science",
      comprehension: parsed.comprehension ?? 50,
      triggerQuiz:   parsed.triggerQuiz   ?? false,
      quizTopic:     parsed.quizTopic     ?? undefined,
      diagram:       parsed.diagram       ?? undefined,
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
