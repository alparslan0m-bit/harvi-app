/**
 * useStats — aggregates quiz_results into dashboard metrics.
 *
 * Offline-first:
 *  - On success   → writes full UserStats to AsyncStorage
 *  - On net error → serves the last AsyncStorage snapshot
 *  - Pending offline queue results are merged into subject_mastery
 *    and recent_results so the UI is always up to date, even offline.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";

import { getQueue } from "@/lib/offlineQueue";
import { supabase } from "@/lib/supabase";
import { UserStats } from "@/types";

const CACHE_KEY = (uid: string) => `harvi:stats:${uid}`;

// ── AsyncStorage helpers ────────────────────────────────────────────────────

async function readCache(userId: string): Promise<UserStats | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY(userId));
    if (!raw) return null;
    return JSON.parse(raw) as UserStats;
  } catch {
    return null;
  }
}

async function writeCache(userId: string, data: UserStats): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY(userId), JSON.stringify(data));
  } catch {
    // silently ignore write errors
  }
}

// ── Constants ───────────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ZERO_STATS: UserStats = {
  total_quizzes: 0,
  total_questions: 0,
  average_score: 0,
  best_score: 0,
  streak: 0,
  weekly_activity: DAYS.map((day) => ({ day, count: 0 })),
  subject_mastery: [],
  recent_results: [],
};

// ── Lecture name map ────────────────────────────────────────────────────────

async function buildLectureNameMap(): Promise<Map<string, string>> {
  const { data, error } = await supabase.from("lectures").select("id, name");
  const map = new Map<string, string>();
  if (error || !data) return map;
  for (const row of data) {
    const r = row as Record<string, unknown>;
    const id = String(r.id ?? "");
    const name = String(r.name ?? "");
    if (id && name) map.set(id, name);
  }
  return map;
}

// ── Core computation ────────────────────────────────────────────────────────

type RawRow = {
  id: string;
  user_id: string;
  lecture_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  created_at: string;
};

function computeStats(rows: RawRow[], lectureMap: Map<string, string>): UserStats {
  if (rows.length === 0) return ZERO_STATS;

  const lectureName = (id: string) =>
    lectureMap.get(id) ?? `Lecture ${id.slice(0, 6)}…`;

  const total_quizzes = rows.length;
  const total_questions = rows.reduce((s, r) => s + (r.total_questions ?? 0), 0);
  const average_score = rows.reduce((s, r) => s + (r.score ?? 0), 0) / rows.length;
  const best_score = Math.max(...rows.map((r) => r.score ?? 0));

  // ── Streak (robust) ───────────────────────────────────────────────────────
  // Normalise every result to a midnight UTC+local timestamp, deduplicate, sort desc.
  const DAY_MS = 86_400_000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const dayTimestamps = [
    ...new Set(
      rows.map((r) => {
        const d = new Date(r.created_at);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    ),
  ].sort((a, b) => b - a); // most recent first

  let streak = 0;
  if (dayTimestamps.length > 0) {
    const mostRecent = dayTimestamps[0];
    // Streak is alive if the user studied today OR yesterday (haven't broken it yet today)
    const startFromToday = mostRecent === todayMs;
    const startFromYesterday = mostRecent === todayMs - DAY_MS;

    if (startFromToday || startFromYesterday) {
      // Walk backwards: each consecutive day adds 1
      const offsetStart = startFromToday ? 0 : 1;
      for (let i = 0; i < dayTimestamps.length; i++) {
        const expected = todayMs - (offsetStart + i) * DAY_MS;
        if (dayTimestamps[i] === expected) streak++;
        else break;
      }
    }
  }

  // ── Weekly activity ────────────────────────────────────────────────────────
  // Start of current week (Sunday = 0)
  const weekStart = new Date(todayMs);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartMs = weekStart.getTime();

  const countByDay: Record<number, number> = {};
  rows.forEach((r) => {
    const d = new Date(r.created_at);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() >= weekStartMs) {
      const day = d.getDay();
      countByDay[day] = (countByDay[day] ?? 0) + 1;
    }
  });
  const todayDow = new Date().getDay(); // 0=Sun … 6=Sat
  const weekly_activity = DAYS.map((day, i) => ({
    day,
    count: countByDay[i] ?? 0,
    isToday: i === todayDow,
  }));

  // Subject mastery
  const byLecture: Record<string, number[]> = {};
  rows.forEach((r) => {
    const key = r.lecture_id ?? "Unknown";
    if (!byLecture[key]) byLecture[key] = [];
    byLecture[key].push(r.score ?? 0);
  });
  const subject_mastery = Object.entries(byLecture)
    .map(([id, scores]) => ({
      subject: lectureName(id),
      mastery: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }))
    .sort((a, b) => b.mastery - a.mastery);

  // Recent results
  const recent_results = rows.slice(0, 10).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    lecture_id: r.lecture_id,
    lecture_name: lectureName(r.lecture_id),
    score: r.score ?? 0,
    total_questions: r.total_questions ?? 0,
    correct_answers: r.correct_answers ?? 0,
    created_at: r.created_at,
  }));

  return {
    total_quizzes,
    total_questions,
    average_score: Math.round(average_score),
    best_score: Math.round(best_score),
    streak,
    weekly_activity,
    subject_mastery,
    recent_results,
  };
}

// ── Fetch ───────────────────────────────────────────────────────────────────

async function fetchStats(userId: string): Promise<UserStats> {
  let rows: RawRow[] = [];
  let lectureMap = new Map<string, string>();
  let fromCache = false;

  try {
    const [quizRes, map] = await Promise.all([
      supabase
        .from("quiz_results")
        .select("id, user_id, lecture_id, score, total_questions, correct_answers, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      buildLectureNameMap(),
    ]);

    if (quizRes.error) throw quizRes.error;
    rows = (quizRes.data ?? []) as RawRow[];
    lectureMap = map;
  } catch {
    // Offline / error — fall back to snapshot + merge queue
    const cached = await readCache(userId);

    const queue = await getQueue();
    const pending = queue.filter((q) => q.userId === userId);

    if (!cached && pending.length === 0) return ZERO_STATS;

    const base = cached ?? ZERO_STATS;
    if (pending.length === 0) return base;

    // Merge queued results into cached snapshot
    const syntheticRows: RawRow[] = pending.map((q) => ({
      id: q.localId,
      user_id: q.userId,
      lecture_id: q.lectureId,
      score: q.score,
      total_questions: q.totalQuestions,
      correct_answers: q.correctAnswers,
      created_at: q.createdAt,
    }));

    // Re-compute from cached recent_results + synthetic rows
    const cachedRows: RawRow[] = (base.recent_results ?? []).map((r) => ({
      id: r.id,
      user_id: r.user_id,
      lecture_id: r.lecture_id,
      score: r.score,
      total_questions: r.total_questions,
      correct_answers: r.correct_answers,
      created_at: r.created_at,
    }));

    const mergedRows = [...syntheticRows, ...cachedRows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Use cached lecture names for known IDs
    const localMap = new Map<string, string>();
    base.recent_results?.forEach((r) => localMap.set(r.lecture_id, r.lecture_name));

    return computeStats(mergedRows, localMap);
  }

  // ── Online success: merge still-queued items ────────────────────────────
  const queue = await getQueue();
  const pending = queue.filter((q) => q.userId === userId);

  if (pending.length > 0) {
    const syntheticRows: RawRow[] = pending.map((q) => ({
      id: q.localId,
      user_id: q.userId,
      lecture_id: q.lectureId,
      score: q.score,
      total_questions: q.totalQuestions,
      correct_answers: q.correctAnswers,
      created_at: q.createdAt,
    }));
    rows = [...syntheticRows, ...rows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const result = computeStats(rows, lectureMap);

  // Persist for offline use
  writeCache(userId, result);
  return result;
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["stats", userId],
    queryFn: () => fetchStats(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
    networkMode: "offlineFirst",
    retry: 0,
  });
}
