/**
 * useProgress — returns a Set of lecture IDs the user has completed.
 *
 * Offline-first:
 *  - On success   → writes to AsyncStorage, merges any still-queued offline results
 *  - On net error → serves the last AsyncStorage snapshot + queued offline IDs
 *  - gcTime 24 h  → stays in React-Query memory for the full app session
 *  - networkMode "offlineFirst" → re-runs the queryFn even without connectivity
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/context/AuthContext";
import { getQueue } from "@/lib/offlineQueue";
import { supabase } from "@/lib/supabase";

const PROGRESS_CACHE_KEY = (uid: string) => `harvi:progress:${uid}`;

const FK_CANDIDATES = [
  "lecture_id", "lec_id", "lesson_id", "topic_id", "subject_id", "content_id",
];

// ── AsyncStorage helpers ────────────────────────────────────────────────────

async function readCache(userId: string): Promise<Set<string> | null> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_CACHE_KEY(userId));
    return raw ? new Set(JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

/** Write the completed-IDs set to AsyncStorage (best-effort). */
export async function writeProgressCache(userId: string, ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(PROGRESS_CACHE_KEY(userId), JSON.stringify([...ids]));
  } catch {
    // silently ignore
  }
}

/**
 * Merge a newly-completed lectureId into the on-device progress cache
 * so the lecture card flips to "done" the instant a quiz finishes —
 * even before the result is synced to Supabase.
 */
export async function optimisticallyMarkComplete(
  userId: string,
  lectureId: string
): Promise<void> {
  const current = (await readCache(userId)) ?? new Set<string>();
  current.add(lectureId);
  await writeProgressCache(userId, current);
}

// ── Fetch ───────────────────────────────────────────────────────────────────

/** Pull pending-queue lectureIds for this user (not yet synced to Supabase). */
async function queuedIds(userId: string): Promise<string[]> {
  const queue = await getQueue();
  return queue.filter((q) => q.userId === userId).map((q) => q.lectureId);
}

async function fetchCompletedLectures(userId: string): Promise<Set<string>> {
  let result: Set<string> | null = null;

  try {
    // Try each candidate FK column
    for (const col of FK_CANDIDATES) {
      const { data, error } = await supabase
        .from("quiz_results")
        .select(col)
        .eq("user_id", userId);

      if (error) {
        if (error.code === "42703") continue; // column doesn't exist → try next
        throw error;                           // real error → fall through to catch
      }

      if (data && data.length > 0) {
        const ids = (data as Record<string, unknown>[])
          .map((r) => r[col])
          .filter((v) => v != null && String(v) !== "null" && String(v).length > 0)
          .map((v) => String(v));

        if (ids.length > 0) {
          result = new Set(ids);
          break;
        }
      }
    }

    if (!result) result = new Set<string>();
  } catch {
    // ── Offline / network error: serve from cache + queue ──────────────────
    const cached = (await readCache(userId)) ?? new Set<string>();
    const pending = await queuedIds(userId);
    pending.forEach((id) => cached.add(id));
    return cached;
  }

  // ── Online success: merge still-queued IDs (not yet synced) ────────────
  const pending = await queuedIds(userId);
  pending.forEach((id) => result!.add(id));

  // Persist freshly-fetched set for offline use
  await writeProgressCache(userId, result);
  return result;
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useProgress() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["progress", user?.id],
    queryFn: () => fetchCompletedLectures(user!.id),
    enabled: !!user?.id,
    staleTime: 0,                        // always re-fetch when focus returns online
    gcTime: 1000 * 60 * 60 * 24,        // keep in RQ memory for 24 h (was 30 s!)
    networkMode: "offlineFirst",         // run queryFn even without connectivity
    retry: 0,                            // don't retry — offline path is instant
  });

  return query.data ?? new Set<string>();
}

/**
 * Returns a function that immediately invalidates the progress query so
 * lecture cards refresh after a quiz finishes (online or offline).
 */
export function useRefreshProgress() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return () => {
    if (user?.id) qc.invalidateQueries({ queryKey: ["progress", user.id] });
  };
}
