# 🔭 AI Science Learning Assistant

> A conversational AI tutor that adapts to your level, visualises concepts, and tracks your progress over time — built on a fully free AI stack.

**[Live Demo](https://your-demo-link.vercel.app)** · **[Screenshots](#screenshots)**

---

## Overview

Most AI tools answer questions and stop there. This project goes further: it holds multi-turn science conversations, generates concept diagrams and illustrations on-the-fly, auto-triggers quizzes when you've studied a topic long enough, and maintains a personal learning profile that shapes every subsequent response.

**The problem it solves:** Learners need more than answers — they need reinforcement, gap identification, and pacing. This assistant handles all three without a backend, a database, or any paid APIs.

**Why it was built:** To explore what a genuinely adaptive AI learning experience looks like when you strip away everything unnecessary — no auth, no server, no cost.

---

## Features

**AI Tutoring**
- Context-aware explanations tailored to Beginner / Intermediate / Advanced proficiency, adjusting vocabulary, analogies, and depth accordingly
- Multi-turn conversation with full session memory — the tutor builds on what you've already discussed

**Adaptive Learning**
- Personalised system prompts that weight explanations toward your weak topics and reinforce gaps identified from quiz history
- Learning profiler that tracks topics studied, comprehension estimates, quiz scores, and study streaks — persisted between sessions via localStorage

**Visualisation**
- Auto-generated Mermaid concept diagrams for processes, cycles, and hierarchies — fetched asynchronously to keep chat responses fast and JSON-safe
- AI illustrations for anatomy, astronomy, molecules, and lab concepts via Pollinations AI

**Quiz System**
- Adaptive quiz generation with instant per-question feedback, answer locking, and score summaries
- Smart trigger logic: quizzes fire automatically after 2–3 exchanges on a topic, or on demand from any message

**Analytics Dashboard**
- Visual learning dashboard showing accuracy trends, strong/weak topic breakdown, study streak, and personalised revision recommendations

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | File-based routing, API routes, SSR |
| Language | TypeScript 5 | End-to-end type safety |
| Styling | Tailwind CSS 3 | Utility-first, dark glassmorphism theme |
| LLM | Groq API — LLaMA 3.1 8B Instant | Free tier, ~300 token/s, OpenAI-compatible |
| AI Client | OpenAI SDK v4 | Pointed at Groq's base URL — zero lock-in |
| Diagrams | Mermaid.js 11 | Client-side SVG, dynamic import (no SSR) |
| Images | Pollinations AI | Free generative image API via URL |
| Persistence | localStorage | Zero-backend session memory |

---

## Architecture

```
POST /api/chat       → Returns flat JSON (text, topic, flags) — no diagram code
POST /api/diagram    → Returns raw Mermaid syntax as text/plain
POST /api/quiz       → Returns structured question array
POST /api/explain    → Single-shot explanation (legacy)
```

**Key design decision:** Diagram generation is intentionally separated from the chat route. Embedding multi-line Mermaid syntax inside a JSON string produced persistent control-character errors with smaller LLMs. Moving it to a plain-text endpoint eliminated the problem entirely and made diagram fetching non-blocking.

```
app/
├── api/chat/         # Conversational AI with learner-aware system prompt
├── api/diagram/      # Plain-text Mermaid generation
├── api/quiz/         # Structured quiz generation
components/
├── ChatInterface     # Full chat UI, message list, input bar
├── ChatMessage       # Bubble + DiagramLoader + illustration + quiz trigger
├── MermaidDiagram    # Client-only Mermaid SVG renderer
├── QuizSection       # Interactive quiz with score tracking
├── LearnerDashboard  # Progress stats, gaps, recommendations
lib/
└── learningStore     # localStorage read/write, topic tracking, gap analysis
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A free [Groq API key](https://console.groq.com) (no credit card required)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
OPENAI_API_KEY=your-groq-api-key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.1-8b-instant
```

```bash
# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

Push to GitHub, import the repo in [Vercel](https://vercel.com), and add the three environment variables above in Project Settings. No other configuration needed.

---

## Key Technical Challenges

**Reliable JSON from small LLMs** — LLaMA 3.1 8B frequently returned malformed JSON containing raw control characters, misplaced code fences, or non-JSON preamble. Solved with a four-attempt parser: direct parse → regex control-character strip → nuclear sanitisation → plain-text fallback. Moved Mermaid generation out of the JSON response entirely to eliminate the hardest class of error.

**Mermaid in a Next.js App Router project** — Mermaid imports `window` on load and breaks SSR. Resolved with `next/dynamic({ ssr: false })` at two levels: the page importing `ChatInterface`, and `ChatMessage` importing `MermaidDiagram`. Diagram fetching is asynchronous and non-blocking.

**Adaptive prompting without a backend** — The system prompt rebuilds on every request from a compact learner summary (topics studied, weak topics, strong topics) stored in localStorage. This gives the model personalised context within a stateless serverless architecture.

**localStorage hydration without SSR mismatch** — Initialised learner state as `null` and populated it inside `useEffect`, preventing React hydration errors caused by server/client state divergence.

**Conversational memory in a stateless API** — The last 12 messages are included with every chat request, giving the model sufficient context without exceeding token limits on the free Groq tier.

---

## Future Improvements

- **Voice tutoring** — Speech-to-text input and text-to-speech responses for hands-free learning
- **RAG over science textbooks** — Vector search against open-access textbooks (OpenStax, LibreTexts) for citation-grounded answers
- **Teacher dashboard** — Assign topics, track student progress, and flag learning gaps across a class
- **Spaced repetition** — Schedule quiz repeats based on forgetting curves derived from score history
- **Student accounts** — Sync learning profiles across devices via a lightweight backend (PlanetScale + NextAuth)
- **Multi-modal input** — Accept photos of diagrams, equations, or lab setups as question context

---

## What I Learned

Building this project deepened my understanding of:

- **Prompt engineering at the edge** — Designing prompts that remain reliable across different model sizes and temperatures, including graceful degradation strategies when the model doesn't cooperate
- **Conversational AI architecture** — The difference between stateless Q&A and stateful tutoring, and how to approximate the latter within serverless constraints
- **AI response reliability** — Why JSON-in-LLM-output is genuinely hard, and architectural patterns (plain text, separate endpoints, multi-attempt parsing) that make production AI features robust
- **Adaptive learning systems** — How comprehension signals, topic weighting, and quiz feedback loops combine to meaningfully personalise an experience without ML infrastructure
- **AI-assisted development workflows** — Using AI tooling to accelerate architecture decisions, iterate on component design, and debug unfamiliar failure modes faster

---

## License

MIT — use freely, learn deeply. 🚀
