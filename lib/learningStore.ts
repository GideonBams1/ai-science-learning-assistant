/**
 * learningStore.ts
 * localStorage-based persistence for learner data.
 * All functions are safe to call on the server (they guard against window === undefined).
 */

import type {
  LearnerData,
  LearnerDataSummary,
  TopicRecord,
  StoredConversation,
  ChatMessage,
  Difficulty,
  LearningGap,
} from "@/types";

const STORE_KEY = "scienceai_learner";

// ── helpers ───────────────────────────────────────────────────────────────────

function isClient(): boolean {
  return typeof window !== "undefined";
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── init / load / save ────────────────────────────────────────────────────────

export function initLearnerData(difficulty: Difficulty = "beginner"): LearnerData {
  return {
    userId:          generateId(),
    difficulty,
    topicRecords:    {},
    conversationLog: [],
    totalQuizzes:    0,
    totalCorrect:    0,
    totalQuestions:  0,
    streakDays:      0,
    lastActiveDate:  todayISO(),
    createdAt:       Date.now(),
  };
}

export function loadLearnerData(): LearnerData {
  if (!isClient()) return initLearnerData();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const fresh = initLearnerData();
      saveLearnerData(fresh);
      return fresh;
    }
    const data = JSON.parse(raw) as LearnerData;
    // Update streak
    return updateStreak(data);
  } catch {
    const fresh = initLearnerData();
    saveLearnerData(fresh);
    return fresh;
  }
}

export function saveLearnerData(data: LearnerData): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded or private browsing — silently ignore
  }
}

function updateStreak(data: LearnerData): LearnerData {
  const today = todayISO();
  if (data.lastActiveDate === today) return data;

  const last = new Date(data.lastActiveDate);
  const now  = new Date(today);
  const diffDays = Math.round((now.getTime() - last.getTime()) / 86_400_000);

  const updated: LearnerData = {
    ...data,
    lastActiveDate: today,
    streakDays: diffDays === 1 ? data.streakDays + 1 : 1,
  };
  saveLearnerData(updated);
  return updated;
}

// ── topic tracking ────────────────────────────────────────────────────────────

export function recordTopicStudied(
  data: LearnerData,
  topic: string,
  comprehension: number,
): LearnerData {
  const key = topic.toLowerCase().trim();
  const existing = data.topicRecords[key];
  const now = Date.now();

  const record: TopicRecord = existing
    ? {
        ...existing,
        lastStudied:   now,
        timesStudied:  existing.timesStudied + 1,
        comprehension: Math.round((existing.comprehension + comprehension) / 2),
      }
    : {
        topic:         topic,
        firstStudied:  now,
        lastStudied:   now,
        timesStudied:  1,
        quizzesTaken:  0,
        bestScore:     0,
        lastScore:     0,
        avgScore:      0,
        comprehension: comprehension,
      };

  const updated: LearnerData = {
    ...data,
    topicRecords: { ...data.topicRecords, [key]: record },
  };
  saveLearnerData(updated);
  return updated;
}

export function recordQuizResult(
  data: LearnerData,
  topic: string,
  correct: number,
  total: number,
): LearnerData {
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const key   = topic.toLowerCase().trim();
  const existing = data.topicRecords[key] ?? {
    topic,
    firstStudied:  Date.now(),
    lastStudied:   Date.now(),
    timesStudied:  1,
    quizzesTaken:  0,
    bestScore:     0,
    lastScore:     0,
    avgScore:      0,
    comprehension: 50,
  };

  const newAvg = existing.quizzesTaken > 0
    ? Math.round((existing.avgScore * existing.quizzesTaken + score) / (existing.quizzesTaken + 1))
    : score;

  const record: TopicRecord = {
    ...existing,
    lastStudied:  Date.now(),
    quizzesTaken: existing.quizzesTaken + 1,
    lastScore:    score,
    bestScore:    Math.max(existing.bestScore, score),
    avgScore:     newAvg,
  };

  const updated: LearnerData = {
    ...data,
    topicRecords:  { ...data.topicRecords, [key]: record },
    totalQuizzes:  data.totalQuizzes + 1,
    totalCorrect:  data.totalCorrect + correct,
    totalQuestions: data.totalQuestions + total,
  };
  saveLearnerData(updated);
  return updated;
}

// ── conversation log ──────────────────────────────────────────────────────────

export function saveConversation(
  data: LearnerData,
  messages: ChatMessage[],
  topic: string,
): LearnerData {
  const conv: StoredConversation = {
    id:        generateId(),
    messages,
    startedAt: messages[0]?.timestamp ?? Date.now(),
    topic,
  };

  // Keep only the last 20 conversations to cap storage
  const log = [conv, ...data.conversationLog].slice(0, 20);

  const updated: LearnerData = { ...data, conversationLog: log };
  saveLearnerData(updated);
  return updated;
}

// ── difficulty ────────────────────────────────────────────────────────────────

export function setDifficulty(data: LearnerData, difficulty: Difficulty): LearnerData {
  const updated = { ...data, difficulty };
  saveLearnerData(updated);
  return updated;
}

// ── derived stats ─────────────────────────────────────────────────────────────

export function getLearningGaps(data: LearnerData): LearningGap[] {
  return Object.values(data.topicRecords)
    .filter((r) => r.quizzesTaken > 0 && r.avgScore < 70)
    .sort((a, b) => a.avgScore - b.avgScore)
    .map((r) => ({
      topic:        r.topic,
      score:        r.avgScore,
      timesStudied: r.timesStudied,
      suggestion:   r.avgScore < 40
        ? `Review ${r.topic} from scratch — start with basics.`
        : `Revisit ${r.topic} to fill in the gaps before moving on.`,
    }));
}

export function getStrongTopics(data: LearnerData): TopicRecord[] {
  return Object.values(data.topicRecords)
    .filter((r) => r.quizzesTaken > 0 && r.avgScore >= 80)
    .sort((a, b) => b.avgScore - a.avgScore);
}

export function getOverallAccuracy(data: LearnerData): number {
  if (data.totalQuestions === 0) return 0;
  return Math.round((data.totalCorrect / data.totalQuestions) * 100);
}

export function getLearnerSummary(data: LearnerData): LearnerDataSummary {
  const topics      = Object.values(data.topicRecords);
  const weakTopics  = topics.filter((r) => r.quizzesTaken > 0 && r.avgScore < 70).map((r) => r.topic);
  const strongTopics = topics.filter((r) => r.quizzesTaken > 0 && r.avgScore >= 80).map((r) => r.topic);

  return {
    difficulty:    data.difficulty,
    topicsStudied: topics.map((r) => r.topic),
    weakTopics,
    strongTopics,
    totalQuizzes:  data.totalQuizzes,
  };
}

export function clearAllData(): void {
  if (!isClient()) return;
  localStorage.removeItem(STORE_KEY);
}
