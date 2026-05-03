import { useQuery } from "@tanstack/react-query";

import { decryptAnswer, safeBtoa } from "@/lib/crypto";
import { loadQuestionsFromCache, saveQuestionsToCache } from "@/lib/questionCache";
import { supabase } from "@/lib/supabase";
import { Question } from "@/types";

const LECTURE_FK_CANDIDATES = [
  "lecture_id", "subject_id", "topic_id", "lesson_id", "lec_id", "content_id", "parent_id",
];
const TEXT_CANDIDATES = ["text", "question", "body", "content", "question_text", "stem"];
const OPTIONS_CANDIDATES = ["options", "answers", "choices", "opts"];
const ANSWER_CANDIDATES = ["answer", "correct_answer", "correct", "answer_index", "correct_index"];
const EXPLANATION_CANDIDATES = ["explanation", "rationale", "reason", "feedback", "solution", "comment"];
const SECURE_CANDIDATES = ["secure", "encrypted", "encrypted_answer"];
const XOR_KEY = "harvi-quiz-secure-key-2024";

function str(v: unknown): string { return String(v ?? ""); }

function pick(row: Record<string, unknown>, candidates: string[]): unknown {
  for (const c of candidates) if (c in row) return row[c];
  return null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function extractOptionText(item: unknown): string {
  if (typeof item === "string") return item;
  if (typeof item === "number") return String(item);
  if (item !== null && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const val = obj.text ?? obj.option ?? obj.value ?? obj.label ?? obj.content ?? obj.name ?? obj.body;
    if (val !== undefined) return str(val);
    const firstStr = Object.values(obj).find((v) => typeof v === "string");
    if (firstStr !== undefined) return str(firstStr);
    return JSON.stringify(item);
  }
  return str(item);
}

function parseOptions(raw: unknown): string[] {
  if (!raw) return [];
  let arr: unknown[] = [];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (typeof raw === "string") {
    try { arr = JSON.parse(raw); } catch { return [raw]; }
  }
  return arr.map(extractOptionText).filter(Boolean);
}

function resolveAnswerIndex(rawAnswer: unknown, optionCount: number): number {
  if (typeof rawAnswer === "number") {
    if (rawAnswer >= 1 && rawAnswer <= optionCount) return rawAnswer - 1;
    if (rawAnswer >= 0 && rawAnswer < optionCount) return rawAnswer;
    return 0;
  }
  if (typeof rawAnswer === "string") {
    const num = parseInt(rawAnswer, 10);
    if (!isNaN(num)) return resolveAnswerIndex(num, optionCount);
    const idx = rawAnswer.trim().toUpperCase().charCodeAt(0) - 65;
    return idx >= 0 && idx < optionCount ? idx : 0;
  }
  return 0;
}

function buildSecure(row: Record<string, unknown>, options: string[]): string {
  const rawSecure = pick(row, SECURE_CANDIDATES);
  if (rawSecure && typeof rawSecure === "string" && rawSecure.length > 0) {
    try {
      const decoded = atob(rawSecure);
      let decrypted = "";
      for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(
          decoded.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length)
        );
      }
      const parsed = JSON.parse(decrypted);
      if (typeof parsed.answer === "number") {
        const resolved = resolveAnswerIndex(parsed.answer, options.length);
        return safeBtoa(JSON.stringify({ answer: resolved, explanation: parsed.explanation ?? "" }));
      }
    } catch { /* fall through */ }

    try {
      const parsed = JSON.parse(rawSecure);
      if (typeof parsed.answer === "number") {
        const resolved = resolveAnswerIndex(parsed.answer, options.length);
        return safeBtoa(JSON.stringify({ answer: resolved, explanation: parsed.explanation ?? "" }));
      }
    } catch { /* fall through */ }
  }

  const rawAnswer = pick(row, ANSWER_CANDIDATES);
  const explanation = str(pick(row, EXPLANATION_CANDIDATES) ?? "");
  const answerIndex = resolveAnswerIndex(rawAnswer, options.length);
  return safeBtoa(JSON.stringify({ answer: answerIndex, explanation }));
}

function shuffleOptions(
  options: string[],
  correctIndex: number
): { options: string[]; correctIndex: number } {
  const tagged = options.map((opt, i) => ({ opt, correct: i === correctIndex }));
  const shuffled = shuffle(tagged);
  return {
    options: shuffled.map((x) => x.opt),
    correctIndex: shuffled.findIndex((x) => x.correct),
  };
}

/**
 * Exported so useSubjectCache can call it directly to pre-populate the
 * question cache for all lectures in a subject ("Download for offline").
 */
export async function fetchQuestions(lectureId: string): Promise<Question[]> {
  for (const fkCol of LECTURE_FK_CANDIDATES) {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq(fkCol, lectureId);

    if (error) {
      if (error.code === "42703" || error.code === "22P02") continue;
      throw new Error(`questions table: ${error.message} (code: ${error.code})`);
    }

    if (data && data.length > 0) {
      const raw: Question[] = data.map((row: Record<string, unknown>, i: number) => {
        const options = parseOptions(pick(row, OPTIONS_CANDIDATES));
        return {
          id: str(row.id ?? i),
          text: str(pick(row, TEXT_CANDIDATES) ?? ""),
          options,
          secure: buildSecure(row, options),
        };
      });

      const shuffledQs = shuffle(raw);

      return shuffledQs.map((q) => {
        try {
          const { answer, explanation } = decryptAnswer(q.secure);
          const { options: newOpts, correctIndex: newCorrect } = shuffleOptions(q.options, answer);
          return {
            ...q,
            options: newOpts,
            secure: safeBtoa(JSON.stringify({ answer: newCorrect, explanation })),
          };
        } catch {
          return q;
        }
      });
    }
  }

  return [];
}

export function useQuizQuestions(lectureId: string, initialData?: Question[]) {
  return useQuery({
    queryKey: ["quiz", lectureId],
    queryFn: async () => {
      try {
        const questions = await fetchQuestions(lectureId);
        // Auto-update the cache on every successful online fetch — keeps the
        // snapshot fresh so users who study online are always ready for offline.
        if (questions.length > 0) {
          saveQuestionsToCache(lectureId, questions); // fire-and-forget
        }
        return questions;
      } catch {
        // Network unavailable — serve from the pre-downloaded cache
        const cached = await loadQuestionsFromCache(lectureId);
        if (cached && cached.questions.length > 0) {
          return cached.questions;
        }
        throw new Error(
          "You're offline and this lecture hasn't been downloaded yet.\n\nDownload the subject while online to take quizzes offline."
        );
      }
    },
    enabled: !!lectureId,
    retry: 0,
    // Keep questions in memory for 5 min — navigating back to the same
    // lecture within a session skips the loading screen entirely.
    gcTime: 5 * 60 * 1000,
    staleTime: 0,
    networkMode: "offlineFirst",
    // Pre-populated from AsyncStorage before query resolves → instant open
    initialData: initialData && initialData.length > 0 ? initialData : undefined,
    // Treat as stale so a fresh fetch still happens in the background
    initialDataUpdatedAt: 0,
  });
}
