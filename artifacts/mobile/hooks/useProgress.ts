import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const FK_CANDIDATES = [
  "lecture_id", "lec_id", "lesson_id", "topic_id", "subject_id", "content_id",
];

async function fetchCompletedLectures(userId: string): Promise<Set<string>> {
  // Try each candidate column name — pick whichever returns data
  for (const col of FK_CANDIDATES) {
    const { data, error } = await supabase
      .from("quiz_results")
      .select(col)
      .eq("user_id", userId);

    if (error) {
      // 42703 = column does not exist — try next
      if (error.code === "42703") continue;
      // Any other error — return empty set silently
      return new Set();
    }

    if (data && data.length > 0) {
      const ids = (data as Record<string, unknown>[])
        .map((r) => r[col])
        .filter((v) => v != null && String(v) !== "null" && String(v).length > 0)
        .map((v) => String(v));

      if (ids.length > 0) {
        return new Set(ids);
      }
    }
  }

  return new Set<string>();
}

export function useProgress() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["progress", user?.id],
    queryFn: () => fetchCompletedLectures(user!.id),
    enabled: !!user?.id,
    staleTime: 0,        // always fresh after returning from a quiz
    gcTime: 1000 * 30,
  });

  return query.data ?? new Set<string>();
}
