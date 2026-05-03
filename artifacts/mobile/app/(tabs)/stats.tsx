import { Feather } from "@expo/vector-icons";
import { useScrollToTop } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MasteryBar } from "@/components/MasteryBar";
import { StatCard } from "@/components/StatCard";
import { WeeklyChart } from "@/components/WeeklyChart";
import { useAuth } from "@/context/AuthContext";
import { useSyncStatus } from "@/context/SyncContext";
import { useColors } from "@/hooks/useColors";
import { useStats } from "@/hooks/useStats";

// ── Streak motivational copy ────────────────────────────────────────────────
function streakMessage(streak: number): string {
  if (streak === 0) return "Study today to start a streak!";
  if (streak === 1) return "Great start — come back tomorrow!";
  if (streak < 5) return "You're building momentum. Keep it up!";
  if (streak < 10) return "Impressive consistency — don't break it!";
  if (streak < 30) return "You're on fire! Keep the streak alive!";
  return "Legendary dedication. You're unstoppable!";
}

// ── Streak card ─────────────────────────────────────────────────────────────
function StreakCard({ streak }: { streak: number }) {
  const colors = useColors();

  const zapScale = useSharedValue(1);
  useEffect(() => {
    if (streak > 0) {
      zapScale.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 600, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 600, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak]);

  const zapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zapScale.value }],
  }));

  const isActive = streak > 0;
  const iconBg = isActive ? "#fffbeb" : colors.muted;
  const iconColor = isActive ? "#f59e0b" : colors.mutedForeground;
  const numColor = isActive ? "#b45309" : colors.mutedForeground;

  return (
    <View style={[streakStyles.card, { backgroundColor: isActive ? "#fffdf0" : colors.card, borderColor: isActive ? "#fde68a" : colors.border }]}>
      {/* Left: icon + number */}
      <View style={streakStyles.left}>
        <View style={[streakStyles.iconWrap, { backgroundColor: iconBg }]}>
          <Animated.View style={zapStyle}>
            <Feather name="zap" size={22} color={iconColor} />
          </Animated.View>
        </View>
        <View style={streakStyles.numCol}>
          <Text style={[streakStyles.num, { color: numColor }]}>{streak}</Text>
          <Text style={[streakStyles.label, { color: colors.mutedForeground }]}>day streak</Text>
        </View>
      </View>

      {/* Right: message */}
      <Text style={[streakStyles.message, { color: colors.mutedForeground }]}>
        {streakMessage(streak)}
      </Text>
    </View>
  );
}

const streakStyles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  numCol: { alignItems: "flex-start" },
  num: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -1, lineHeight: 32 },
  label: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  message: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, textAlign: "right" },
});

export default function StatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: stats, isLoading, error } = useStats(user?.id);
  const { isOnline, pendingCount } = useSyncStatus();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayDow = new Date().getDay();
  const ZERO_WEEK = DAYS.map((day, i) => ({ day, count: 0, isToday: i === todayDow }));

  // Always have a stats object to render — zeros when no data
  const displayStats = stats ?? {
    total_quizzes: 0,
    total_questions: 0,
    average_score: 0,
    best_score: 0,
    streak: 0,
    weekly_activity: ZERO_WEEK,
    subject_mastery: [],
    recent_results: [],
  };

  const weekData = displayStats.weekly_activity?.length ? displayStats.weekly_activity : ZERO_WEEK;
  const isEmpty = displayStats.total_quizzes === 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Fixed header ──────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topPad + 14, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Statistics</Text>
        </View>
        {!isOnline && (
          <View style={[styles.cachePill, { backgroundColor: "#fef3c7", marginBottom: 2 }]}>
            <Feather name="wifi-off" size={11} color="#92400e" />
            <Text style={[styles.cacheText, { color: "#92400e" }]}>
              {pendingCount > 0 ? `Cached · ${pendingCount} pending` : "Cached"}
            </Text>
          </View>
        )}
      </View>

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}

      {/* ── Error ────────────────────────────────────────────────────── */}
      {!isLoading && error && (
        <View style={styles.center}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Couldn't load stats</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {(error as Error).message}
          </Text>
        </View>
      )}

      {/* ── Content (empty state shows zeroed layout) ────────────────── */}
      {!isLoading && !error && (
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* Key Metrics */}
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatCard
                label="Quizzes"
                value={displayStats.total_quizzes}
                icon={<Feather name="check-square" size={18} color={colors.primary} />}
                accent
              />
              <StatCard
                label="Questions"
                value={displayStats.total_questions}
                icon={<Feather name="help-circle" size={18} color={colors.mutedForeground} />}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                label="Avg Score"
                value={`${Math.round(displayStats.average_score)}%`}
                icon={<Feather name="trending-up" size={18} color={colors.mutedForeground} />}
              />
              <StatCard
                label="Best Score"
                value={`${Math.round(displayStats.best_score)}%`}
                icon={<Feather name="award" size={18} color={colors.warning} />}
              />
            </View>
          </View>

          {/* Streak card */}
          <StreakCard streak={displayStats.streak} />

          {/* Weekly Activity */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>Weekly Activity</Text>
              <Text style={[styles.weekTotal, { color: colors.mutedForeground }]}>
                {weekData.reduce((s, d) => s + d.count, 0)} quiz{weekData.reduce((s, d) => s + d.count, 0) !== 1 ? "zes" : ""} this week
              </Text>
            </View>
            <View style={{ marginTop: 20 }}>
              <WeeklyChart data={weekData} />
            </View>
          </View>

          {/* Lecture Mastery — hidden when empty */}
          {displayStats.subject_mastery.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Pressable style={styles.sectionHeader} onPress={() => router.push("/stats/mastery")}>
                <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>
                  Lecture Mastery
                </Text>
                <View style={styles.seeAll}>
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>
                    See all {displayStats.subject_mastery.length}
                  </Text>
                  <Feather name="chevron-right" size={15} color={colors.primary} />
                </View>
              </Pressable>
              <View style={{ marginTop: 16 }}>
                {displayStats.subject_mastery.slice(0, 3).map((item, i) => (
                  <MasteryBar key={i} subject={item.subject} mastery={item.mastery} />
                ))}
              </View>
              {displayStats.subject_mastery.length > 3 && (
                <Pressable
                  style={[styles.moreBtn, { borderColor: colors.border }]}
                  onPress={() => router.push("/stats/mastery")}
                >
                  <Text style={[styles.moreBtnText, { color: colors.primary }]}>
                    View {displayStats.subject_mastery.length - 3} more lectures
                  </Text>
                  <Feather name="arrow-right" size={14} color={colors.primary} />
                </Pressable>
              )}
            </View>
          )}

          {/* Empty nudge — shown instead of Recent Results when no quizzes */}
          {isEmpty && (
            <View style={[styles.nudgeCard, { backgroundColor: "#f0f9ff", borderColor: "#bae6fd" }]}>
              <View style={[styles.nudgeIcon, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="bar-chart-2" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.nudgeTitle, { color: colors.foreground }]}>No stats yet</Text>
              <Text style={[styles.nudgeText, { color: colors.mutedForeground }]}>
                Complete your first quiz to start tracking your performance and progress.
              </Text>
            </View>
          )}

          {/* Recent Results — hidden when empty */}
          {displayStats.recent_results.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Results</Text>
              {displayStats.recent_results.slice(0, 10).map((result, i) => (
                <View
                  key={i}
                  style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.resultLeft}>
                    <Text style={[styles.resultName, { color: colors.foreground }]} numberOfLines={1}>
                      {result.lecture_name}
                    </Text>
                    <Text style={[styles.resultDate, { color: colors.mutedForeground }]}>
                      {new Date(result.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.scoreBadge,
                      {
                        backgroundColor:
                          result.score >= 80 ? "#d1fae5" : result.score >= 50 ? "#fef3c7" : "#fee2e2",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.scoreText,
                        {
                          color:
                            result.score >= 80
                              ? colors.success
                              : result.score >= 50
                              ? colors.warning
                              : colors.destructive,
                        },
                      ]}
                    >
                      {Math.round(result.score)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.8 },
  cachePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  cacheText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  content: { paddingTop: 20 },

  statsGrid: { paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 10 },

  section: { marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 20, borderWidth: 1 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", letterSpacing: -0.4, marginBottom: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  moreBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: 4, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  moreBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  recentSection: { paddingHorizontal: 20, marginBottom: 16 },
  resultCard: {
    flexDirection: "row", alignItems: "center", padding: 14,
    borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  resultLeft: { flex: 1, gap: 2 },
  resultName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  resultDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  scoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  scoreText: { fontSize: 13, fontFamily: "Inter_700Bold" },

  weekTotal: { fontSize: 12, fontFamily: "Inter_400Regular" },

  nudgeCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  nudgeIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  nudgeTitle: { fontSize: 17, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  nudgeText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, maxWidth: 260 },
});
