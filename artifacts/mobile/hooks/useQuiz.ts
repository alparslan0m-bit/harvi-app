import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { Question } from "@/types";

// Common FK column name variations linking questions to a lecture
const LECTURE_FK_CANDIDATES = [
  "lecture_id",
  "subject_id",
  "topic_id",
  "lesson_id",
  "lec_id",
  "content_id",
  "parent_id",
];

// Common column name variations for each field
const TEXT_CANDIDATES = ["text", "question", "body", "content", "question_text"];
const OPTIONS_CANDIDATES = ["options", "answers", "choices", "opts"];
const SECURE_CANDIDATES = ["secure", "answer", "correct_answer", "encrypted", "encrypted_answer", "solution"];

function pick(row: Record<string, unknown>, candidates: string[]): unknown {
  for (const c of candidates) {
    if (c in row) return row[c];
  }
  return null;
}

async function fetchQuestions(lectureId: string): Promise<Question[]> {
  // Try each FK column name until we find questions
  for (const fkCol of LECTURE_FK_CANDIDATES) {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq(fkCol, lectureId);

    if (error) {
      // Column doesn't exist (42703) — try next
      if (error.code === "42703") continue;
      // Other error — throw with useful message
      throw new Error(`questions table: ${error.message} (code: ${error.code})`);
    }

    if (data && data.length > 0) {
      // Map rows to Question type, auto-detecting column names
      return data.map((row: Record<string, unknown>, i: number) => {
        const rawOptions = pick(row, OPTIONS_CANDIDATES);
        let options: string[] = [];
        if (Array.isArray(rawOptions)) {
          options = rawOptions.map(String);
        } else if (typeof rawOptions === "string") {
          try { options = JSON.parse(rawOptions); } catch { options = [rawOptions]; }
        }

        return {
          id: String(row.id ?? i),
          text: String(pick(row, TEXT_CANDIDATES) ?? ""),
          options,
          secure: String(pick(row, SECURE_CANDIDATES) ?? ""),
        };
      });
    }
  }

  // No questions found under any FK column
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
