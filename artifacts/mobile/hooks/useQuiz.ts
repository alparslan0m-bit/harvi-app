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
const IMAGE_URL_CANDIDATES = ["image_url", "image", "picture_url", "photo_url", "img_url", "image_link", "img", "media_url"];
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

/**
 * Resolves the correct option index (0-based) from whatever the DB stores.
 *
 * Handles every common format:
 *  • 1-based integer  (1, 2, 3, 4)
 *  • 0-based integer  (0, 1, 2, 3)
 *  • Letter           ("A", "B", "C", "D")
 *  • Full option text ("عضلة الحجاب الحاز (Diaphragm)")  ← was broken before
 *  • Numeric string   ("2", "3")
 */
function resolveAnswerIndex(rawAnswer: unknown, options: string[]): number {
  const n = options.length;

  if (typeof rawAnswer === "number") {
    // 1-based: 1..N → 0..N-1
    if (rawAnswer >= 1 && rawAnswer <= n) return rawAnswer - 1;
    // 0-based: 0..N-1
    if (rawAnswer >= 0 && rawAnswer < n) return rawAnswer;
    return 0;
  }

  if (typeof rawAnswer === "string") {
    const trimmed = rawAnswer.trim();

    // Numeric string → recurse as number
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== "") return resolveAnswerIndex(num, options);

    // Single letter A / B / C / D (case-insensitive)
    if (trimmed.length === 1) {
      const letterIdx = trimmed.toUpperCase().charCodeAt(0) - 65; // A=0,B=1…
      if (letterIdx >= 0 && letterIdx < n) return letterIdx;
    }

    // ── Text matching against actual option strings ─────────────────────
    const lower = trimmed.toLowerCase();

    // 1. Exact match (case-insensitive, trimmed)
    const exact = options.findIndex(o => o.trim().toLowerCase() === lower);
    if (exact !== -1) return exact;

    // 2. Option fully contained in answer string (handles extra punctuation)
    const contained = options.findIndex(o => lower.includes(o.trim().toLowerCase()) && o.trim().length > 2);
    if (contained !== -1) return contained;

    // 3. Answer string fully contained in option (short answer stored in DB)
    const sub = options.findIndex(o => o.trim().toLowerCase().includes(lower) && lower.length > 2);
    if (sub !== -1) return sub;
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
        const resolved = resolveAnswerIndex(parsed.answer, options);
        return safeBtoa(JSON.stringify({ answer: resolved, explanation: parsed.explanation ?? "" }));
      }
    } catch { /* fall through */ }

    try {
      const parsed = JSON.parse(rawSecure);
      if (typeof parsed.answer === "number") {
        const resolved = resolveAnswerIndex(parsed.answer, options);
        return safeBtoa(JSON.stringify({ answer: resolved, explanation: parsed.explanation ?? "" }));
      }
    } catch { /* fall through */ }
  }

  const rawAnswer = pick(row, ANSWER_CANDIDATES);
  const explanation = str(pick(row, EXPLANATION_CANDIDATES) ?? "");
  const answerIndex = resolveAnswerIndex(rawAnswer, options);
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
        const imageUrl = str(pick(row, IMAGE_URL_CANDIDATES) ?? "").trim();
        return {
          id: str(row.id ?? i),
          text: str(pick(row, TEXT_CANDIDATES) ?? ""),
          options,
          secure: buildSecure(row, options),
          image_url: imageUrl || undefined,
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
