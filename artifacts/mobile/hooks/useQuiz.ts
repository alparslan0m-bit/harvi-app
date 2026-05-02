import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { Question } from "@/types";

async function fetchQuestions(lectureId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("id, text, options, secure")
    .eq("lecture_id", lectureId);

  if (error) throw error;
  return data ?? [];
}

export function useQuizQuestions(lectureId: string) {
  return useQuery({
    queryKey: ["quiz", lectureId],
    queryFn: () => fetchQuestions(lectureId),
    enabled: !!lectureId,
  });
}
