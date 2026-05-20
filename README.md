# 🔭 AI Science Learning Assistant

A modern AI-powered science tutor built with **Next.js 14**, **Tailwind CSS**, and the **OpenAI API**.  
Ask any science question, choose your level, get a rich explanation, and test yourself with an instant quiz.

---

## ✨ Features

- **Science Q&A** — Ask any science question in plain English
- **Difficulty Levels** — Beginner 🌱 / Intermediate ⚡ / Advanced 🔬
- **AI Explanations** — Rich markdown explanations with key takeaways
- **Quiz Generator** — Auto-generated 5-question multiple-choice quiz on the topic
- **Interactive Quiz UI** — Click to answer, locked-in selections, instant feedback + explanations
- **Loading States** — Animated spinners during API calls
- **Error Handling** — Graceful, user-friendly error messages
- **Responsive Design** — Works on mobile, tablet, and desktop

---

## 📁 Project Structure

```
ai-science-learning-assistant/
├── app/
│   ├── layout.tsx              # Root layout (fonts, metadata, decorative bg)
│   ├── page.tsx                # Main page — state management + composition
│   ├── globals.css             # Tailwind base + custom scrollbar
│   └── api/
│       ├── explain/route.ts    # POST /api/explain → AI explanation
│       └── quiz/route.ts       # POST /api/quiz    → AI quiz
├── components/
│   ├── DifficultySelector.tsx  # 3-button difficulty picker
│   ├── QuestionInput.tsx       # Textarea + example chips + submit button
│   ├── ExplanationDisplay.tsx  # Explanation + key points + quiz CTA
│   ├── QuizSection.tsx         # Interactive quiz with per-card state
│   └── LoadingSpinner.tsx      # Reusable animated spinner
├── lib/
│   ├── openai.ts               # OpenAI singleton client
│   └── utils.ts                # cn() utility (clsx + tailwind-merge)
├── types/
│   └── index.ts                # Shared TypeScript types & constants
├── .env.local.example          # Environment variable template
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Setup Instructions

### 1. Prerequisites

Make sure you have:
- **Node.js 18+** ([download](https://nodejs.org))
- **npm** (included with Node) or **pnpm** / **yarn**
- An **OpenAI API key** ([get one here](https://platform.openai.com/api-keys))

### 2. Clone / Open the project

If you downloaded as a folder, open a terminal inside it:

```bash
cd "AI Science Learning Assistant"
```

### 3. Install dependencies

```bash
npm install
```

### 4. Set up your environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and replace the placeholder with your real key:

```env
OPENAI_API_KEY=sk-your-actual-key-here
```

> **Security:** `.env.local` is never committed to git. Keep your key private!

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for production

```bash
npm run build
npm run start
```

---

## ⚙️ Configuration

| Variable        | Required | Default       | Description                        |
|-----------------|----------|---------------|------------------------------------|
| `OPENAI_API_KEY`| ✅ Yes   | —             | Your OpenAI secret key             |
| `OPENAI_MODEL`  | ❌ No    | `gpt-4o-mini` | Any OpenAI chat completion model   |

### Recommended models

| Model          | Cost    | Quality  | Notes                              |
|----------------|---------|----------|------------------------------------|
| `gpt-4o-mini`  | 💚 Low  | ⭐⭐⭐⭐   | Default — best cost/quality ratio  |
| `gpt-4o`       | 🟡 Med  | ⭐⭐⭐⭐⭐  | Higher quality, slower             |
| `gpt-3.5-turbo`| 💚 Low  | ⭐⭐⭐     | Budget option                      |

---

## 🎮 Usage

1. **Choose a difficulty** — Beginner, Intermediate, or Advanced
2. **Type a science question** (or click an example chip)
3. **Click "Ask the Science Assistant"** (or press `⌘↵` / `Ctrl↵`)
4. **Read the explanation** and key takeaways
5. **Click "Generate Quiz"** to test your understanding
6. **Click answers** — get instant feedback with explanations

---

## 🛠 Tech Stack

| Technology         | Purpose                        |
|--------------------|--------------------------------|
| Next.js 14         | App Router, API routes, SSR    |
| React 18           | UI, hooks, client state        |
| Tailwind CSS 3     | Utility-first styling          |
| OpenAI SDK v4      | Chat completions, JSON mode    |
| TypeScript 5       | Full type safety               |
| clsx + twMerge     | Conditional class merging      |

---

## 🔍 How It Works

### Explanation API (`/api/explain`)
- Accepts `{ question, difficulty }` via POST
- Sends a system prompt + user question to GPT with `response_format: json_object`
- Returns `{ topic, explanation, keyPoints[] }`

### Quiz API (`/api/quiz`)  
- Accepts `{ topic, difficulty, count }` via POST
- Generates N multiple-choice questions with plausible distractors
- Returns `{ questions: [{ question, options[], answer, explanation }] }`

### Front-end State
- All state lives in `app/page.tsx` — no external state library needed
- Each quiz card manages its own `selected` answer state in `QuizSection.tsx`

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Error: OpenAI API key missing` | Check `.env.local` exists and has a valid key |
| `404 on /api/explain` | Make sure you're running `npm run dev`, not opening the HTML file directly |
| `JSON parse error` | Rare OpenAI formatting glitch — retry the request |
| Slow responses | Switch to `gpt-4o-mini` or `gpt-3.5-turbo` in `.env.local` |

---

## 📄 License

MIT — use freely, learn deeply! 🚀
