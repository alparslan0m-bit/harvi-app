import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

async function fetchCompletedLectures(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("quiz_results")
    .select("lecture_id")
    .eq("user_id", userId);

  if (error) return new Set();

  return new Set((data ?? []).map((r) => String(r.lecture_id)));
}

export function useProgress() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["progress", user?.id],
    queryFn: () => fetchCompletedLectures(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  return query.data ?? new Set<string>();
}
