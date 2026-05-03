import { useQuery } from "@tanstack/react-query";

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

function str(v: unknown): string { return String(v ?? ""); }

function pick(row: Record<string, unknown>, candidates: string[]): unknown {
  for (const c of candidates) if (c in row) return row[c];
  return null;
}

/** Extract readable text from an option that might be a string or object */
function extractOptionText(item: unknown): string {
  if (typeof item === "string") return item;
  if (typeof item === "number") return String(item);
  if (item !== null && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    // Try common text field names
    const val = obj.text ?? obj.option ?? obj.value ?? obj.label ?? obj.content ?? obj.name ?? obj.body;
    if (val !== undefined) return str(val);
    // Fallback: first string value in the object
    const firstStr = Object.values(obj).find((v) => typeof v === "string");
    if (firstStr !== undefined) return str(firstStr);
    return JSON.stringify(item);
  }
  return str(item);
}

/** Parse options from the row — handles arrays of strings or objects */
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
 * Build a synthetic `secure` payload so the rest of the quiz engine
 * works without changes. We try:
 *   1. XOR-decrypt an existing `secure` column
 *   2. Plain-JSON parse the `secure` column  
 *   3. Separate `answer` (int/letter) + `explanation` columns
 */
function buildSecure(row: Record<string, unknown>): string {
  // 1. Try existing encrypted field
  const rawSecure = pick(row, SECURE_CANDIDATES);
  if (rawSecure && typeof rawSecure === "string" && rawSecure.length > 0) {
    // Try XOR decrypt first
    try {
      const KEY = "harvi-quiz-secure-key-2024";
      const decoded = atob(rawSecure);
      let decrypted = "";
      for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length));
      }
      const parsed = JSON.parse(decrypted);
      if (typeof parsed.answer === "number") return rawSecure; // already valid XOR
    } catch { /* fall through */ }

    // Try plain JSON parse (not encrypted)
    try {
      const parsed = JSON.parse(rawSecure);
      if (typeof parsed.answer === "number") {
        // Already a valid plain object — re-encode as base64 plain JSON
        return btoa(JSON.stringify(parsed));
      }
    } catch { /* fall through */ }
  }

  // 2. Build from separate answer + explanation columns
  const rawAnswer = pick(row, ANSWER_CANDIDATES);
  const explanation = str(pick(row, EXPLANATION_CANDIDATES) ?? "");

  let answerIndex = 0;
  if (typeof rawAnswer === "number") {
    answerIndex = rawAnswer;
  } else if (typeof rawAnswer === "string") {
    // Could be "0","1","2","3" or "A","B","C","D"
    const num = parseInt(rawAnswer, 10);
    if (!isNaN(num)) {
      answerIndex = num;
    } else {
      // Letter mapping A=0, B=1, C=2, D=3
      answerIndex = rawAnswer.toUpperCase().charCodeAt(0) - 65;
    }
  }

  // Encode as plain base64 JSON so decryptAnswer can handle it
  return btoa(JSON.stringify({ answer: answerIndex, explanation }));
}

async function fetchQuestions(lectureId: string): Promise<Question[]> {
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
      return data.map((row: Record<string, unknown>, i: number) => ({
        id: str(row.id ?? i),
        text: str(pick(row, TEXT_CANDIDATES) ?? ""),
        options: parseOptions(pick(row, OPTIONS_CANDIDATES)),
        secure: buildSecure(row),
      }));
    }
  }

  return [];
}

export function useQuizQuestions(lectureId: string) {
  return useQuery({
    queryKey: ["quiz", lectureId],
    queryFn: () => fetchQuestions(lectureId),
    enabled: !!lectureId,
    retry: 0,
  });
}
