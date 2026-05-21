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
  question:    string;
  options:     string[];   // always 4 options
  answer:      number;     // 0-based index of correct option
  explanation: string;
}

export interface QuizRequest {
  topic:      string;
  difficulty: Difficulty;
  count?:     number;      // default 5
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

// ── API error ─────────────────────────────────────────────────────────────────
export interface ApiError {
  error: string;
}

// ── Chat / Conversation ───────────────────────────────────────────────────────
export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id:        string;
  role:      MessageRole;
  content:   string;                    // main text (markdown supported)
  timestamp: number;                    // Date.now()

  // Optional rich content attached to assistant messages
  diagramTopic?:  string;               // if set, diagram is fetched lazily from /api/diagram
  diagramTitle?:  string;
  illustration?:  IllustrationAttachment;
  quiz?:          QuizResponse;
  topic?:         string;               // detected topic of this message
  comprehension?: number;               // 0-100 estimated comprehension score
}

export interface DiagramAttachment {
  type:  "mermaid";
  code:  string;       // raw Mermaid syntax
  title: string;
}

export interface IllustrationAttachment {
  url:    string;      // Pollinations AI URL
  prompt: string;      // the prompt used
  alt:    string;
}

// ── Chat API ──────────────────────────────────────────────────────────────────
export interface ChatApiRequest {
  messages:    { role: MessageRole; content: string }[];
  difficulty:  Difficulty;
  learnerData: LearnerDataSummary;   // sent to personalise the system prompt
}

export interface ChatApiResponse {
  content:       string;
  topic:         string;
  comprehension: number;             // 0-100 confidence of learner understanding this turn
  triggerQuiz:   boolean;
  quizTopic?:    string;
  // Diagram is fetched separately via /api/diagram to avoid JSON escaping issues
  diagramTopic?: string;             // if set, front-end fetches diagram for this topic
  diagramTitle?: string;
  illustration?: IllustrationAttachment;
}

// ── Learning Tracking ─────────────────────────────────────────────────────────
export interface TopicRecord {
  topic:         string;
  firstStudied:  number;    // timestamp
  lastStudied:   number;    // timestamp
  timesStudied:  number;
  quizzesTaken:  number;
  bestScore:     number;    // 0-100
  lastScore:     number;    // 0-100
  avgScore:      number;    // running average
  comprehension: number;    // AI-estimated comprehension 0-100
}

export interface LearnerData {
  userId:           string;            // random UUID, stored locally
  difficulty:       Difficulty;
  topicRecords:     Record<string, TopicRecord>;
  conversationLog:  StoredConversation[];
  totalQuizzes:     number;
  totalCorrect:     number;
  totalQuestions:   number;
  streakDays:       number;
  lastActiveDate:   string;            // ISO date string
  createdAt:        number;
}

export interface StoredConversation {
  id:        string;
  messages:  ChatMessage[];
  startedAt: number;
  topic:     string;
}

/** Trimmed version sent with each API request to keep payload small */
export interface LearnerDataSummary {
  difficulty:    Difficulty;
  topicsStudied: string[];          // topic names studied
  weakTopics:    string[];          // topics with score < 70
  strongTopics:  string[];          // topics with score >= 80
  totalQuizzes:  number;
}

// ── Learning Gap ──────────────────────────────────────────────────────────────
export interface LearningGap {
  topic:       string;
  score:       number;
  timesStudied: number;
  suggestion:  string;
}
