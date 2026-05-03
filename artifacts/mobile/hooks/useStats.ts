import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { UserStats } from "@/types";

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

async function fetchStats(userId: string): Promise<UserStats> {
  const { data, error } = await supabase
    .from("quiz_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return ZERO_STATS;

  const rows = data as Array<{
    id: string;
    user_id: string;
    lecture_id: string;
    lecture_name: string;
    score: number;
    total_questions: number;
    correct_answers: number;
    created_at: string;
  }>;

  // ── Key metrics ────────────────────────────────────────────────────────────
  const total_quizzes = rows.length;
  const total_questions = rows.reduce((s, r) => s + (r.total_questions ?? 0), 0);
  const average_score = rows.reduce((s, r) => s + (r.score ?? 0), 0) / rows.length;
  const best_score = Math.max(...rows.map((r) => r.score ?? 0));

  // ── Streak: consecutive calendar days (most-recent first) ─────────────────
  const uniqueDays = [
    ...new Set(rows.map((r) => new Date(r.created_at).toDateString())),
  ];

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < uniqueDays.length; i++) {
    const d = new Date(uniqueDays[i]);
    d.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (d.getTime() === expected.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  // ── Weekly activity: quizzes per day this week ─────────────────────────────
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const countByDay: Record<number, number> = {};
  rows.forEach((r) => {
    const d = new Date(r.created_at);
    if (d >= weekStart) {
      const day = d.getDay();
      countByDay[day] = (countByDay[day] ?? 0) + 1;
    }
  });

  const weekly_activity = DAYS.map((day, i) => ({
    day,
    count: countByDay[i] ?? 0,
  }));

  // ── Subject mastery: avg score per lecture_name ────────────────────────────
  const byLecture: Record<string, number[]> = {};
  rows.forEach((r) => {
    const key = r.lecture_name ?? r.lecture_id ?? "Unknown";
    if (!byLecture[key]) byLecture[key] = [];
    byLecture[key].push(r.score ?? 0);
  });

  const subject_mastery = Object.entries(byLecture)
    .map(([subject, scores]) => ({
      subject,
      mastery: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }))
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 6);

  // ── Recent results ─────────────────────────────────────────────────────────
  const recent_results = rows.slice(0, 10).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    lecture_id: r.lecture_id,
    lecture_name: r.lecture_name ?? r.lecture_id ?? "Unknown",
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

export function useStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["stats", userId],
    queryFn: () => fetchStats(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}
