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
 * Returns: plain text Mermaid diagram code (NOT JSON), or 204 on bad output.
 * Keeping it plain text avoids all JSON escaping issues with multi-line content.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { topic } = (await req.json()) as { topic: string };

    if (!topic?.trim())
      return new NextResponse("Topic is required.", { status: 400 });

    const completion = await openai.chat.completions.create({
      model:       MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a Mermaid diagram expert. Output ONLY valid Mermaid flowchart syntax — nothing else. " +
            "No explanation, no markdown code fences, no JSON, no preamble. " +
            "Always start with 'flowchart TD' on the first line. " +
            "Node labels must use plain words only — no parentheses, no quotes, no special characters. " +
            "Keep it concise: 4-8 nodes maximum. " +
            "Example of correct output:\n" +
            "flowchart TD\n" +
            "  A[Sun] --> B[Photons]\n" +
            "  B --> C[Chlorophyll]\n" +
            "  C --> D[Glucose]",
        },
        {
          role: "user",
          content: `Create a Mermaid flowchart showing the key concepts and relationships in: ${topic.trim()}`,
        },
      ],
    });

    let code = completion.choices[0]?.message?.content?.trim() ?? "";

    // Strip any code fences the model might have added despite instructions
    code = code.replace(/^```(?:mermaid)?\s*/i, "").replace(/\s*```$/i, "").trim();

    // Extract the mermaid block if extra text leaked before/after it
    const diagramMatch = code.match(/((?:graph|flowchart|sequenceDiagram|classDiagram|stateDiagram)[\s\S]+)/i);
    if (diagramMatch) code = diagramMatch[1].trim();

    // Validate it starts with a known Mermaid keyword
    const valid = /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie)/i.test(code);
    if (!valid) {
      // Nothing usable — return empty so the client silently hides the diagram
      return new NextResponse("", { status: 204 });
    }

    // Sanitize node labels — strip characters Mermaid commonly chokes on
    code = code
      .replace(/[""]/g, "")          // smart/curly double quotes
      .replace(/['']/g, "")          // smart/curly single quotes
      .replace(/&/g, " and ")        // ampersands in labels
      .replace(/\(([^)]*)\)/g, "$1") // parentheses — keep content, drop the parens
      .replace(/<(?!--)([^>]*)>/g, " "); // HTML tags (keep --> arrows untouched)

    return new NextResponse(code, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: unknown) {
    console.error("[diagram] error:", err);
    return new NextResponse("Failed to generate diagram.", { status: 500 });
  }
}
