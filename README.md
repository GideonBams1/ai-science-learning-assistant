# 🔭 AI Science Learning Assistant

An intelligent, conversational AI science tutor built with **Next.js 14**, **Tailwind CSS**, and the **Groq API (LLaMA 3.1)**. Ask any science question, get rich multi-turn explanations with concept diagrams and AI illustrations, then test yourself with adaptive quizzes — all tracked in a personal learning dashboard.

---

## 📖 Overview

### What it does
The AI Science Learning Assistant turns any science question into a full learning experience. You chat naturally with an AI tutor, receive structured explanations, see auto-generated concept diagrams, and get quizzed on what you've learned — all in one seamless interface.

### The problem it solves
Most AI tools answer questions and stop there. This assistant goes further: it remembers what you've studied, identifies where your understanding is weak, adapts its explanations to your chosen difficulty level, and actively reinforces learning through quizzes and progress tracking — bridging the gap between "asking a chatbot" and "actually learning."

### Why it was built
To demonstrate how modern AI tools can create genuinely personalised, interactive learning experiences — not just Q&A lookups — using entirely free, open-source APIs and a clean, deployable Next.js architecture.

---

## ✨ Features

- **Multi-turn conversational chat** — Context-aware conversation that remembers everything you've discussed in the session
- **AI-generated science explanations** — Rich markdown responses with bold text, bullets, and headings tailored to your level
- **Beginner / Intermediate / Advanced difficulty modes** — Explanations range from "curious 10-year-old" analogies to university-level detail with equations
- **AI concept diagrams** — Automatic Mermaid flowcharts for processes, cycles, hierarchies, and sequences (e.g. photosynthesis, Newton's laws)
- **AI illustrations** — Generated images for anatomy, astronomy, molecules, and lab equipment via Pollinations AI
- **Quiz generation** — 5-question multiple-choice quizzes auto-generated on the topic you've been studying
- **Adaptive quiz triggering** — Quizzes fire automatically after 2-3 exchanges on a topic, or on demand with a single click
- **Learning progress tracking** — Every topic studied, quiz taken, and score recorded — persisted locally between sessions
- **Learning dashboard** — Visual overview of topics studied, quiz accuracy, learning streaks, weak spots, and personalised recommendations
- **Personalised system prompt** — The AI tutor adapts based on your history: reinforcing weak topics and building on strong ones
- **Responsive modern UI** — Sidebar layout on desktop, tab navigation on mobile; glassmorphism space theme throughout
- **Real-time AI responses** — Typing indicators, lazy-loaded diagrams, progressive image loading
- **Robust error handling** — Multi-attempt JSON parsing with plain-text fallback; graceful failure for diagrams and images

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | Framework, API routes, SSR/SSG |
| React 18 | UI, hooks, client state |
| TypeScript 5 | Full type safety across all layers |
| Tailwind CSS 3 | Utility-first styling, dark glassmorphism theme |
| Groq API (LLaMA 3.1 8B) | Free, fast LLM for chat, diagrams, and quizzes |
| OpenAI SDK v4 | API client (pointed at Groq's OpenAI-compatible endpoint) |
| Mermaid.js 11 | Client-side concept diagram rendering |
| Pollinations AI | Free AI image generation via URL |
| localStorage | Learning progress persistence (no backend DB needed) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** ([download](https://nodejs.org))
- **npm** (included with Node)
- A **Groq API key** — free at [console.groq.com](https://console.groq.com) (no credit card required)

### 1. Clone or open the project

```bash
cd "AI Science Learning Assistant"
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
OPENAI_API_KEY=your-groq-api-key-here
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.1-8b-instant
```

> **Security:** `.env.local` is excluded from git. Never commit your API key.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
npm run build
npm run start
```

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅ Yes | — | Your Groq API key (or any OpenAI-compatible key) |
| `OPENAI_BASE_URL` | ❌ No | OpenAI default | Set to `https://api.groq.com/openai/v1` for Groq |
| `OPENAI_MODEL` | ❌ No | `llama-3.1-8b-instant` | Any supported chat model |

### Recommended models

| Model | Provider | Cost | Notes |
|---|---|---|---|
| `llama-3.1-8b-instant` | Groq | 💚 Free | Default — fast and free |
| `llama-3.3-70b-versatile` | Groq | 💚 Free | Higher quality, still free |
| `gpt-4o-mini` | OpenAI | 🟡 Paid | Use with OpenAI key, no `BASE_URL` needed |

---

## 🔍 API Routes

### `POST /api/chat`
Main conversational endpoint.
- **Body:** `{ messages, difficulty, learnerData }`
- **Returns:** `{ content, topic, comprehension, triggerQuiz, quizTopic, wantsDiagram, diagramTitle, illustration }`
- Builds a personalised system prompt from the learner's history
- Returns a flat JSON structure — **no Mermaid code embedded** (fetched separately to avoid JSON escaping errors)

### `POST /api/diagram`
Generates a Mermaid concept diagram for a topic.
- **Body:** `{ topic }`
- **Returns:** Raw Mermaid syntax as `text/plain`
- Returns plain text (not JSON) to guarantee reliable multi-line content

### `POST /api/quiz`
Generates a multiple-choice quiz.
- **Body:** `{ topic, difficulty, count }`
- **Returns:** `{ questions: [{ question, options[], answer, explanation }] }`

### `POST /api/explain`
Single-shot explanation (legacy endpoint).
- **Body:** `{ question, difficulty }`
- **Returns:** `{ explanation, keyPoints[], topic }`

---

## 📁 Project Structure

```
ai-science-learning-assistant/
├── app/
│   ├── layout.tsx                # Root layout, fonts, metadata
│   ├── page.tsx                  # Sidebar layout, Chat/Dashboard tabs, localStorage hydration
│   ├── globals.css               # Tailwind base + custom scrollbar
│   └── api/
│       ├── chat/route.ts         # POST /api/chat — conversational AI tutor
│       ├── diagram/route.ts      # POST /api/diagram — Mermaid plain-text generation
│       ├── quiz/route.ts         # POST /api/quiz — quiz generation
│       └── explain/route.ts      # POST /api/explain — single explanation
├── components/
│   ├── ChatInterface.tsx         # Full chat UI, message list, input bar
│   ├── ChatMessage.tsx           # Message bubble + DiagramLoader + illustration + quiz trigger
│   ├── MermaidDiagram.tsx        # Client-only Mermaid SVG renderer
│   ├── QuizSection.tsx           # Interactive quiz cards with score tracking
│   └── LearnerDashboard.tsx      # Progress stats, gaps, recommendations
├── lib/
│   └── learningStore.ts          # localStorage read/write, topic tracking, gap analysis
├── types/
│   └── index.ts                  # All shared TypeScript types
├── .env.local                    # Your secrets (never committed)
├── next.config.mjs               # Pollinations image domain + Mermaid webpack external
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚢 Deployment

### Deploy to Vercel (recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Add environment variables in **Project Settings → Environment Variables**:
   - `OPENAI_API_KEY`
   - `OPENAI_BASE_URL`
   - `OPENAI_MODEL`
4. Deploy — Vercel handles the build automatically

> If Vercel shows an old version after a push, go to **Deployments → ⋯ → Redeploy** to force a fresh build.

---

## 🐛 Troubleshooting

| Problem | Solution |
|---|---|
| `API key missing` error | Check `.env.local` exists with a valid `OPENAI_API_KEY` |
| Diagrams not appearing | Confirm `OPENAI_BASE_URL` and `OPENAI_MODEL` are set; the diagram API uses the same model |
| `JSON parse error` in chat | Built-in 4-attempt parser handles this — if it persists, the model returned garbage; retry |
| Images not loading | Pollinations AI is a free service with occasional downtime; images fail silently |
| Mermaid errors in console | Some diagram syntax from the model may be invalid; the component silently hides failures |
| Vercel not updating | Trigger a manual redeploy from the Vercel dashboard |

---

## 📄 License

MIT — use freely, learn deeply! 🚀
