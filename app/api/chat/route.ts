import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatApiRequest, ChatApiResponse, ApiError, DiagramAttachment } from "@/types";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey:  process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});
const MODEL = process.env.OPENAI_MODEL ?? "llama-3.1-8b-instant";

// ── JSON extractor ────────────────────────────────────────────────────────────
function extractJSON(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const first = raw.indexOf("{"), last = raw.lastIndexOf("}");
  if (first !== -1 && last !== -1) return raw.slice(first, last + 1);
  return raw.trim();
}

// ── system prompt ─────────────────────────────────────────────────────────────
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
    ? `\n\nLEARNER CONTEXT:\n- Already studied: ${topicsStudied.slice(-10).join(", ")}\n- Needs work on: ${weakTopics.join(", ") || "none identified yet"}\n- Strong topics: ${strongTopics.join(", ") || "none yet"}\n\nUse this context to make connections to prior knowledge and fill identified gaps naturally in your explanations.`
    : "";

  return `You are an expert AI science tutor having a conversation with a student. Your role is to explain, engage, assess understanding, and adapt to the learner.

DIFFICULTY: ${diffInstructions[difficulty] ?? diffInstructions.intermediate}${personalisation}

RESPONSE FORMAT — You MUST respond with ONLY a raw JSON object (no markdown fences, no text outside JSON):
{
  "content": "<your conversational reply — use **bold** and bullet points freely for clarity>",
  "topic": "<short 1-5 word topic name for this message>",
  "comprehension": <0-100 integer — your estimate of how well the student understands so far based on what they said>,
  "triggerQuiz": <true if the student has now covered enough content to benefit from a quick assessment, else false>,
  "quizTopic": "<topic for quiz if triggerQuiz is true, else null>",
  "diagram": <null OR { "type": "mermaid", "code": "<valid Mermaid diagram syntax>", "title": "<diagram title>" }>,
  "illustration": <null OR { "prompt": "<vivid 10-15 word image prompt for a scientific illustration>", "alt": "<alt text>" }>
}

RULES FOR RICH CONTENT:
- Include a diagram when explaining processes, relationships, hierarchies, or sequences (e.g. cell cycle, food web, atom structure, water cycle). Use flowchart TD or graph TD syntax.
- Include an illustration prompt when the topic would benefit from a realistic visual (e.g. animal anatomy, celestial objects, lab equipment, molecular structures). Keep prompts clean: "<subject>, scientific illustration, detailed, educational".
- Set triggerQuiz: true after the student has clearly engaged with a topic through 2-3 exchanges, or when they say they feel ready.
- Vary your style: sometimes ask the student questions to check understanding before giving the answer.
- Keep content conversational and encouraging. Celebrate progress. Use emojis sparingly.
- If the student explicitly asks for a test, quiz, or assessment, always set triggerQuiz: true.`;
}

// ── route ─────────────────────────────────────────────────────────────────────
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

    // Build conversation for the API — keep last 12 turns to stay within context limits
    const conversationMessages = messages.slice(-12).map((m) => ({
      role:    m.role as "user" | "assistant",
      content: m.content,
    }));

    const completion = await openai.chat.completions.create({
      model:       MODEL,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationMessages,
      ],
    });

    const raw  = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(extractJSON(raw)) as {
      content:       string;
      topic:         string;
      comprehension: number;
      triggerQuiz:   boolean;
      quizTopic?:    string | null;
      diagram?:      DiagramAttachment | null;
      illustration?: { prompt: string; alt: string } | null;
    };

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
