import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey:  process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});
const MODEL = process.env.OPENAI_MODEL ?? "llama-3.1-8b-instant";

/**
 * POST /api/diagram
 * Body: { topic: string }
 * Returns: plain text Mermaid diagram code (NOT JSON).
 * Keeping it plain text avoids all JSON escaping issues with multi-line content.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { topic } = (await req.json()) as { topic: string };

    if (!topic?.trim())
      return new NextResponse("Topic is required.", { status: 400 });

    const completion = await openai.chat.completions.create({
      model:       MODEL,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a Mermaid diagram expert. Output ONLY valid Mermaid diagram syntax. " +
            "No explanation, no markdown code fences, no JSON — just the raw diagram code. " +
            "Use flowchart TD or graph TD syntax. Keep it concise: 5-10 nodes maximum.",
        },
        {
          role: "user",
          content: `Create a Mermaid diagram that clearly shows the key concepts and relationships in: ${topic.trim()}`,
        },
      ],
    });

    let code = completion.choices[0]?.message?.content?.trim() ?? "";

    // Strip any code fences the model might have added despite instructions
    code = code.replace(/^```(?:mermaid)?\s*/i, "").replace(/\s*```$/i, "").trim();

    // Validate it looks like Mermaid (starts with graph/flowchart/sequenceDiagram etc.)
    const valid = /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie)/i.test(code);
    if (!valid) {
      // Try to extract just the mermaid part if extra text leaked in
      const match = code.match(/((?:graph|flowchart|sequenceDiagram|classDiagram|stateDiagram)[\s\S]+)/i);
      if (match) code = match[1].trim();
    }

    return new NextResponse(code, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: unknown) {
    console.error("[diagram] error:", err);
    return new NextResponse("Failed to generate diagram.", { status: 500 });
  }
}
