import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { UserStats } from "@/types";

async function fetchStats(userId: string): Promise<UserStats> {
  const { data, error } = await supabase.rpc("get_user_full_stats", {
    p_user_id: userId,
  });
  if (error) throw error;
  return data as UserStats;
}

export function useStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["stats", userId],
    queryFn: () => fetchStats(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}
