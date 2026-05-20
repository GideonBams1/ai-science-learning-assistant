// ── Difficulty ────────────────────────────────────────────────────────────────
export type Difficulty = "beginner" | "intermediate" | "advanced";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner:     "Beginner",
  intermediate: "Intermediate",
  advanced:     "Advanced",
};

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  beginner:     "Simple language, analogies, no jargon",
  intermediate: "Some technical terms, moderate depth",
  advanced:     "Technical depth, equations, research-level detail",
};

// ── Explanation ───────────────────────────────────────────────────────────────
export interface ExplanationRequest {
  question:   string;
  difficulty: Difficulty;
}

export interface ExplanationResponse {
  explanation: string;
  keyPoints:   string[];
  topic:       string;
}

// ── Quiz ─────────────────────────────────────────────────────────────────────
export interface QuizQuestion {
  question: string;
  options:  string[];          // always 4 options
  answer:   number;            // 0-based index of correct option
  explanation: string;
}

export interface QuizRequest {
  topic:      string;
  difficulty: Difficulty;
  count?:     number;          // default 5
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

// ── API error ─────────────────────────────────────────────────────────────────
export interface ApiError {
  error: string;
}
