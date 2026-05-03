import { Feather } from "@expo/vector-icons";
import { useScrollToTop } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MasteryBar } from "@/components/MasteryBar";
import { StatCard } from "@/components/StatCard";
import { WeeklyChart } from "@/components/WeeklyChart";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useStats } from "@/hooks/useStats";

export default function StatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: stats, isLoading, error } = useStats(user?.id);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });

  const weekData = stats?.weekly_activity ?? [
    { day: "Mon", count: 0 }, { day: "Tue", count: 0 }, { day: "Wed", count: 0 },
    { day: "Thu", count: 0 }, { day: "Fri", count: 0 }, { day: "Sat", count: 0 },
    { day: "Sun", count: 0 },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Fixed header ──────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topPad + 14, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Statistics</Text>
        </View>
        {stats && stats.streak > 0 && (
          <View style={[styles.streakBadge, { backgroundColor: "#fffbeb" }]}>
            <Feather name="zap" size={14} color={colors.warning} />
            <Text style={[styles.streakText, { color: colors.warning }]}>
              {stats.streak}d
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

      {/* ── Empty ────────────────────────────────────────────────────── */}
      {!isLoading && !error && (!stats || stats.total_quizzes === 0) && (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: "#f0f9ff" }]}>
            <Feather name="bar-chart-2" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No stats yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Complete your first quiz to start tracking your performance and progress.
          </Text>
        </View>
      )}

      {/* ── Content ──────────────────────────────────────────────────── */}
      {!isLoading && !error && stats && stats.total_quizzes > 0 && (
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
                value={stats.total_quizzes ?? 0}
                icon={<Feather name="check-square" size={18} color={colors.primary} />}
                accent
              />
              <StatCard
                label="Questions"
                value={stats.total_questions ?? 0}
                icon={<Feather name="help-circle" size={18} color={colors.mutedForeground} />}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                label="Avg Score"
                value={`${Math.round(stats.average_score ?? 0)}%`}
                icon={<Feather name="trending-up" size={18} color={colors.mutedForeground} />}
              />
              <StatCard
                label="Best Score"
                value={`${Math.round(stats.best_score ?? 0)}%`}
                icon={<Feather name="award" size={18} color={colors.warning} />}
              />
            </View>
          </View>

          {/* Weekly Activity */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Weekly Activity</Text>
            <WeeklyChart data={weekData} />
          </View>

          {/* Lecture Mastery */}
          {stats.subject_mastery && stats.subject_mastery.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Pressable style={styles.sectionHeader} onPress={() => router.push("/stats/mastery")}>
                <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>
                  Lecture Mastery
                </Text>
                <View style={styles.seeAll}>
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>
                    See all {stats.subject_mastery.length}
                  </Text>
                  <Feather name="chevron-right" size={15} color={colors.primary} />
                </View>
              </Pressable>
              <View style={{ marginTop: 16 }}>
                {stats.subject_mastery.slice(0, 3).map((item, i) => (
                  <MasteryBar key={i} subject={item.subject} mastery={item.mastery} />
                ))}
              </View>
              {stats.subject_mastery.length > 3 && (
                <Pressable
                  style={[styles.moreBtn, { borderColor: colors.border }]}
                  onPress={() => router.push("/stats/mastery")}
                >
                  <Text style={[styles.moreBtnText, { color: colors.primary }]}>
                    View {stats.subject_mastery.length - 3} more lectures
                  </Text>
                  <Feather name="arrow-right" size={14} color={colors.primary} />
                </Pressable>
              )}
            </View>
          )}

          {/* Recent Results */}
          {stats.recent_results && stats.recent_results.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Results</Text>
              {stats.recent_results.slice(0, 10).map((result, i) => (
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
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 2,
  },
  streakText: { fontSize: 13, fontFamily: "Inter_700Bold" },

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

  emptyIcon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
