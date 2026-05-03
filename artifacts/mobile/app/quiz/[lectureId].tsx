import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/context/AuthContext";
import { useSyncStatus } from "@/context/SyncContext";
import { useColors } from "@/hooks/useColors";
import { useQuizQuestions } from "@/hooks/useQuiz";
import { optimisticallyMarkComplete } from "@/hooks/useProgress";
import { decryptAnswer } from "@/lib/crypto";
import { loadQuestionsFromCache } from "@/lib/questionCache";
import { enqueueQuizResult } from "@/lib/offlineQueue";
import { supabase } from "@/lib/supabase";
import { Question } from "@/types";

// ── Result stat pill ─────────────────────────────────────────────────────────
function StatPill({
  value, label, color, icon,
}: { value: number; label: string; color: string; icon: React.ComponentProps<typeof Feather>["name"] }) {
  const colors = useColors();
  return (
    <View style={[rStyles.pill, { backgroundColor: color + "14", borderColor: color + "35" }]}>
      <Feather name={icon} size={18} color={color} />
      <Text style={[rStyles.pillNum, { color: colors.foreground }]}>{value}</Text>
      <Text style={[rStyles.pillLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

// ── Results screen component ──────────────────────────────────────────────────
function ResultsView({
  score, correctCount, totalCount,
  submitting, savedOffline, saveError,
  lectureName, topPad,
  onRetry, onReview, onHome,
}: {
  score: number; correctCount: number; totalCount: number;
  submitting: boolean; savedOffline: boolean; saveError: string | null;
  lectureName?: string; topPad: number;
  onRetry: () => void; onReview: () => void; onHome: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // Count-up animation
  const [displayScore, setDisplayScore] = useState(0);
  useEffect(() => {
    let current = 0;
    const step = Math.max(1, Math.ceil(score / 35));
    const timer = setInterval(() => {
      current = Math.min(current + step, score);
      setDisplayScore(current);
      if (current >= score) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  // Ring entrance
  const ringScale = useSharedValue(0.55);
  const ringOpacity = useSharedValue(0);
  useEffect(() => {
    ringScale.value = withSpring(1, { damping: 16, stiffness: 160 });
    ringOpacity.value = withTiming(1, { duration: 450 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const ringAnim = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  // Score tier
  const isExcellent = score >= 90;
  const isGreat    = score >= 80;
  const isGood     = score >= 70;
  const isPassing  = score >= 60;

  const ringColor = isExcellent || isGreat
    ? "#059669"
    : isGood
    ? "#f59e0b"
    : isPassing
    ? "#f97316"
    : "#dc2626";

  const grade   = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
  const title   = isExcellent ? "Outstanding!" : isGreat ? "Well done!" : isGood ? "Good effort!" : isPassing ? "Keep going!" : "Keep practising!";
  const message = isExcellent
    ? "Exceptional! You've thoroughly mastered this material."
    : isGreat
    ? "Strong performance. You have a solid grasp of the content."
    : isGood
    ? "You're on the right track — a bit more practice and you'll ace it."
    : isPassing
    ? "You passed! Review the answers to close the remaining gaps."
    : "Don't be discouraged. Study the review and try again — you'll improve.";

  const wrongCount = totalCount - correctCount;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Header ── */}
      <View style={{ paddingTop: topPad + 12, paddingHorizontal: 20, paddingBottom: 8 }}>
        <TouchableOpacity
          onPress={onHome}
          style={[rStyles.closeBtn, { backgroundColor: colors.muted }]}
          activeOpacity={0.7}
        >
          <Feather name="x" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[rStyles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Score ring ── */}
        <Animated.View style={[rStyles.ringWrap, ringAnim]}>
          {/* Outer glow ring */}
          <View style={[rStyles.ringOuter, { borderColor: ringColor + "28" }]}>
            {/* Inner ring */}
            <View style={[rStyles.ringInner, { borderColor: ringColor }]}>
              {/* Score */}
              <View style={rStyles.scoreRow}>
                <Text style={[rStyles.scoreNum, { color: ringColor }]}>{displayScore}</Text>
                <Text style={[rStyles.scorePct, { color: ringColor }]}>%</Text>
              </View>
              <Text style={[rStyles.gradeHint, { color: ringColor + "99" }]}>out of 100</Text>
            </View>
          </View>
          {/* Grade badge */}
          <View style={[rStyles.gradeBadge, { backgroundColor: ringColor }]}>
            <Text style={rStyles.gradeText}>{grade}</Text>
          </View>
        </Animated.View>

        {/* ── Title + lecture name ── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400).springify()} style={rStyles.titleGroup}>
          <Text style={[rStyles.title, { color: colors.foreground }]}>{title}</Text>
          {!!lectureName && (
            <Text style={[rStyles.subtitle, { color: colors.mutedForeground }]} numberOfLines={2}>
              {lectureName}
            </Text>
          )}
        </Animated.View>

        {/* ── Stat pills ── */}
        <Animated.View entering={FadeInDown.delay(300).duration(400).springify()} style={rStyles.pills}>
          <StatPill value={correctCount} label="Correct"   color="#059669"   icon="check-circle" />
          <StatPill value={wrongCount}   label="Wrong"     color="#dc2626"   icon="x-circle" />
          <StatPill value={totalCount}   label="Total"     color={colors.primary} icon="help-circle" />
        </Animated.View>

        {/* ── Feedback card ── */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400).springify()}
          style={[rStyles.feedbackCard, { backgroundColor: ringColor + "0f", borderColor: ringColor + "30" }]}
        >
          <View style={[rStyles.feedbackIcon, { backgroundColor: ringColor + "20" }]}>
            <Feather
              name={isExcellent ? "star" : isGreat ? "award" : isGood ? "trending-up" : "book-open"}
              size={16}
              color={ringColor}
            />
          </View>
          <Text style={[rStyles.feedbackText, { color: colors.foreground }]}>{message}</Text>
        </Animated.View>

        {/* ── Save status ── */}
        {submitting && (
          <Animated.View entering={FadeIn.duration(300)} style={rStyles.statusRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[rStyles.statusText, { color: colors.mutedForeground }]}>Saving results…</Text>
          </Animated.View>
        )}
        {savedOffline && !submitting && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={[rStyles.statusPill, { backgroundColor: "#fef9c3", borderColor: "#fde047" }]}
          >
            <Feather name="wifi-off" size={13} color="#92400e" />
            <Text style={[rStyles.statusText, { color: "#92400e", flex: 1 }]}>
              Saved locally — will sync when you're back online.
            </Text>
          </Animated.View>
        )}
        {saveError && !savedOffline && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={[rStyles.statusPill, { backgroundColor: "#fee2e2", borderColor: "#fca5a5" }]}
          >
            <Feather name="alert-triangle" size={13} color="#dc2626" />
            <Text style={[rStyles.statusText, { color: "#dc2626", flex: 1 }]} selectable>
              Save failed: {saveError}
            </Text>
          </Animated.View>
        )}

        {/* ── Action buttons ── */}
        <Animated.View entering={FadeInDown.delay(500).duration(400).springify()} style={rStyles.btnGroup}>
          <TouchableOpacity
            style={[rStyles.btn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={onRetry}
            activeOpacity={0.85}
          >
            <Feather name="refresh-cw" size={17} color="#fff" />
            <Text style={[rStyles.btnText, { color: "#fff" }]}>Retry Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[rStyles.btn, { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border }]}
            onPress={onReview}
            activeOpacity={0.85}
          >
            <Feather name="list" size={17} color={colors.foreground} />
            <Text style={[rStyles.btnText, { color: colors.foreground }]}>Review Answers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[rStyles.btn, { backgroundColor: colors.muted }]}
            onPress={onHome}
            activeOpacity={0.85}
          >
            <Feather name="home" size={17} color={colors.mutedForeground} />
            <Text style={[rStyles.btnText, { color: colors.mutedForeground }]}>Go Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const rStyles = StyleSheet.create({
  scroll: { alignItems: "center", paddingHorizontal: 24, paddingTop: 8 },
  closeBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  // Ring
  ringWrap: { alignItems: "center", marginTop: 16, marginBottom: 32 },
  ringOuter: {
    width: 184,
    height: 184,
    borderRadius: 92,
    borderWidth: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 152,
    height: 152,
    borderRadius: 76,
    borderWidth: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  scoreRow: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  scoreNum: { fontSize: 52, fontFamily: "Inter_700Bold", letterSpacing: -2.5, lineHeight: 56 },
  scorePct: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginBottom: 6 },
  gradeHint: { fontSize: 11, fontFamily: "Inter_400Regular", letterSpacing: 0.2 },
  gradeBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 4,
  },
  gradeText: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },

  // Title
  titleGroup: { alignItems: "center", gap: 6, marginBottom: 24, width: "100%" },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.9, textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, maxWidth: 280 },

  // Pills
  pills: { flexDirection: "row", gap: 10, width: "100%", marginBottom: 16 },
  pill: { flex: 1, alignItems: "center", paddingVertical: 14, paddingHorizontal: 6, borderRadius: 18, borderWidth: 1, gap: 5 },
  pillNum: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.8 },
  pillLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },

  // Feedback
  feedbackCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    width: "100%",
    marginBottom: 16,
  },
  feedbackIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
  feedbackText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },

  // Status
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  statusPill: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 14, borderWidth: 1, width: "100%", marginBottom: 16 },
  statusText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  // Buttons
  btnGroup: { gap: 10, width: "100%" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingVertical: 16,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
});

// ── Medical study tips shown while loading ────────────────────────────────────
const TIPS = [
  "Spaced repetition boosts long-term retention by 200%",
  "Retrieval practice is more effective than re-reading",
  "Sleep consolidates memories — study before bedtime",
  "Interleaving topics strengthens pattern recognition",
  "Active recall outperforms passive review every time",
  "Short focused sessions beat marathon study hours",
];

// ── Loading screen ────────────────────────────────────────────────────────────
function QuizLoadingScreen({ lectureName }: { lectureName?: string }) {
  const colors = useColors();

  // Pulsing rings
  const ring1Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0.5);
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0.3);

  // Icon gentle bob
  const iconY = useSharedValue(0);

  // Tip rotation
  const [tipIndex, setTipIndex] = useState(0);
  const [dots, setDots] = useState(1);

  useEffect(() => {
    // Ring 1 — pulses outward and fades
    ring1Scale.value = withRepeat(
      withTiming(2.2, { duration: 1600, easing: Easing.out(Easing.cubic) }),
      -1, false
    );
    ring1Opacity.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 200 }),
        withTiming(0, { duration: 1400 })
      ),
      -1, false
    );
    // Ring 2 — delayed
    ring2Scale.value = withDelay(700,
      withRepeat(
        withTiming(2.2, { duration: 1600, easing: Easing.out(Easing.cubic) }),
        -1, false
      )
    );
    ring2Opacity.value = withDelay(700,
      withRepeat(
        withSequence(
          withTiming(0.3, { duration: 200 }),
          withTiming(0, { duration: 1400 })
        ),
        -1, false
      )
    );
    // Icon gentle float
    iconY.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 950, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 950, easing: Easing.inOut(Easing.sin) })
      ),
      -1, false
    );

    const dotTimer = setInterval(() => setDots((d) => (d % 3) + 1), 450);
    const tipTimer = setInterval(() => setTipIndex((t) => (t + 1) % TIPS.length), 3200);
    return () => { clearInterval(dotTimer); clearInterval(tipTimer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: iconY.value }],
  }));

  return (
    <View style={[loadStyles.root, { backgroundColor: colors.background }]}>
      {/* Pulsing rings */}
      <View style={loadStyles.ringWrap}>
        <Animated.View style={[loadStyles.ring, { borderColor: colors.primary }, ring1Style]} />
        <Animated.View style={[loadStyles.ring, { borderColor: colors.primary }, ring2Style]} />

        {/* Zap icon */}
        <Animated.View style={iconStyle}>
          <View style={[loadStyles.iconBox, { backgroundColor: colors.primary }]}>
            <Feather name="zap" size={34} color="#fff" />
          </View>
        </Animated.View>
      </View>

      {/* Text group */}
      <Animated.View entering={FadeIn.delay(200).duration(500)} style={loadStyles.textGroup}>
        <Text style={[loadStyles.title, { color: colors.foreground }]}>Warming Engines</Text>
        {lectureName ? (
          <Text style={[loadStyles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
            {lectureName}
          </Text>
        ) : null}
        <Text style={[loadStyles.dots, { color: colors.primary }]}>
          {"●".repeat(dots) + "○".repeat(3 - dots)}
        </Text>
      </Animated.View>

      {/* Rotating tip card */}
      <Animated.View
        key={tipIndex}
        entering={FadeInDown.duration(400).springify()}
        exiting={FadeOut.duration(200)}
        style={[loadStyles.tipCard, { backgroundColor: colors.muted, borderColor: colors.border }]}
      >
        <Feather name="book-open" size={13} color={colors.primary} />
        <Text style={[loadStyles.tipText, { color: colors.mutedForeground }]}>
          {TIPS[tipIndex]}
        </Text>
      </Animated.View>
    </View>
  );
}

const loadStyles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", gap: 32, paddingHorizontal: 32 },
  ringWrap: { width: 88, height: 88, alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
  },
  iconBox: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  textGroup: { alignItems: "center", gap: 6 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.7 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", maxWidth: 240, textAlign: "center" },
  dots: { fontSize: 10, letterSpacing: 4, marginTop: 4 },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
    width: "100%",
  },
  tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, letterSpacing: -0.1 },
});

interface AnsweredState {
  selected: number;
  correct: number;
  explanation: string;
}

interface HistoryItem {
  question: Question;
  selected: number;
  correct: number;
  explanation: string;
}

function OptionButton({
  text, index, answered, onSelect,
}: {
  text: string; index: number; answered: AnsweredState | null; onSelect: (i: number) => void;
}) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  let bgColor = colors.card;
  let borderColor = colors.border;
  let textColor = colors.foreground;

  if (answered) {
    if (index === answered.correct) {
      bgColor = "#d1fae5"; borderColor = "#6ee7b7"; textColor = "#065f46";
    } else if (index === answered.selected && index !== answered.correct) {
      bgColor = "#fee2e2"; borderColor = "#fca5a5"; textColor = "#991b1b";
    } else {
      bgColor = colors.muted; borderColor = colors.border; textColor = colors.mutedForeground;
    }
  }

  const label = String.fromCharCode(65 + index);

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[styles.option, { backgroundColor: bgColor, borderColor }]}
        onPress={() => {
          if (answered) return;
          scale.value = withSpring(0.97, { damping: 20 });
          setTimeout(() => { scale.value = withSpring(1, { damping: 20 }); }, 150);
          onSelect(index);
        }}
        activeOpacity={0.85}
        disabled={!!answered}
      >
        <View style={[styles.optionLabel, { backgroundColor: answered && index === answered.correct ? "#6ee7b7" : answered && index === answered.selected ? "#fca5a5" : colors.muted }]}>
          <Text style={[styles.optionLabelText, { color: textColor }]}>{label}</Text>
        </View>
        <Text style={[styles.optionText, { color: textColor }]}>{text}</Text>
        {answered && index === answered.correct && <Feather name="check-circle" size={18} color="#059669" />}
        {answered && index === answered.selected && index !== answered.correct && <Feather name="x-circle" size={18} color="#dc2626" />}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function QuizScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { lectureId, lectureName } = useLocalSearchParams<{ lectureId: string; lectureName: string }>();
  const { user } = useAuth();
  const { isOnline } = useSyncStatus();

  // ── Fast path: pre-load from AsyncStorage before RQ resolves ─────────────
  const [cachedQuestions, setCachedQuestions] = useState<Question[] | undefined>();
  const [cacheChecked, setCacheChecked] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    loadQuestionsFromCache(lectureId).then((hit) => {
      if (!mountedRef.current) return;
      if (hit?.questions.length) setCachedQuestions(hit.questions);
      setCacheChecked(true);
    });
    return () => { mountedRef.current = false; };
  }, [lectureId]);

  const { data: questions, isLoading, error } = useQuizQuestions(lectureId, cachedQuestions);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState<AnsweredState | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOffline, setSavedOffline] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const handleSelect = useCallback((selectedIndex: number) => {
    if (!questions) return;
    const q: Question = questions[currentIndex];
    const { answer, explanation } = decryptAnswer(q.secure);
    const isCorrect = selectedIndex === answer;

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setAnswered({ selected: selectedIndex, correct: answer, explanation });
    if (isCorrect) setCorrectCount((c) => c + 1);
    setHistory((h) => [...h, { question: q, selected: selectedIndex, correct: answer, explanation }]);
  }, [questions, currentIndex]);

  const handleNext = useCallback(async () => {
    if (!questions) return;
    const isLast = currentIndex === questions.length - 1;

    if (isLast) {
      setFinished(true);
      setSubmitting(true);
      setSaveError(null);
      setSavedOffline(false);

      const score = Math.round((correctCount / questions.length) * 100);
      const now = new Date().toISOString();

      if (!isOnline) {
        // Queue result for later sync + mark lecture complete immediately
        await enqueueQuizResult({
          userId: user?.id ?? "",
          lectureId: lectureId ?? "",
          score,
          totalQuestions: questions.length,
          correctAnswers: correctCount,
          createdAt: now,
        });
        // Optimistic: flip the lecture card green right now, even offline
        if (user?.id && lectureId) {
          await optimisticallyMarkComplete(user.id, lectureId);
        }
        setSavedOffline(true);
      } else {
        const { error: insertErr } = await supabase
          .from("quiz_results")
          .insert({
            user_id: user?.id,
            lecture_id: lectureId,
            score,
            total_questions: questions.length,
            correct_answers: correctCount,
            created_at: now,
          });

        if (insertErr) {
          // Mid-request network error — fall back to queue
          await enqueueQuizResult({
            userId: user?.id ?? "",
            lectureId: lectureId ?? "",
            score,
            totalQuestions: questions.length,
            correctAnswers: correctCount,
            createdAt: now,
          });
          if (user?.id && lectureId) {
            await optimisticallyMarkComplete(user.id, lectureId);
          }
          setSavedOffline(true);
        }
      }

      // Invalidate progress + stats — the hooks merge queue IDs, so they
      // reflect the completed lecture immediately even when offline.
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setSubmitting(false);
    } else {
      setCurrentIndex((i) => i + 1);
      setAnswered(null);
    }
  }, [questions, currentIndex, correctCount, user, lectureId, lectureName, queryClient]);

  const handleRetry = useCallback(() => {
    setCurrentIndex(0);
    setAnswered(null);
    setCorrectCount(0);
    setFinished(false);
    setSubmitting(false);
    setSaveError(null);
    setSavedOffline(false);
    setReviewing(false);
    setHistory([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  // Show loading only if: cache check not done yet, OR no cached data and RQ still loading
  if (!cacheChecked || (isLoading && !questions)) {
    return <QuizLoadingScreen lectureName={lectureName} />;
  }

  // ── Error / empty ──────────────────────────────────────────────────────────
  if (error || !questions || questions.length === 0) {
    const isOfflineError = !!(error as Error)?.message?.includes("offline");

    if (isOfflineError) {
      return (
        <View style={[styles.centerScreen, { backgroundColor: colors.background, paddingHorizontal: 28 }]}>
          <View style={[styles.warmingIcon, { backgroundColor: "#fef9c3" }]}>
            <Feather name="wifi-off" size={32} color="#92400e" />
          </View>
          <Text style={[styles.warmingTitle, { color: colors.foreground }]}>Not downloaded</Text>
          <Text style={[styles.warmingText, { color: colors.mutedForeground, marginTop: 8, textAlign: "center", lineHeight: 22 }]}>
            Go back to the subject and tap{"\n"}
            <Text style={{ fontFamily: "Inter_700Bold", color: colors.foreground }}>"Download offline"</Text>
            {" "}while connected to the internet.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.actionBtn, { backgroundColor: colors.primary, marginTop: 28 }]}
          >
            <Text style={styles.actionBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.centerScreen, { backgroundColor: colors.background, paddingHorizontal: 28 }]}>
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
        <Text style={[styles.warmingTitle, { color: colors.foreground }]}>
          {error ? "Failed to load questions" : "No questions found"}
        </Text>
        {error && (
          <Text style={[styles.warmingText, { color: colors.destructive, marginTop: 8, textAlign: "center" }]} selectable>
            {(error as Error).message}
          </Text>
        )}
        {!error && (
          <Text style={[styles.warmingText, { color: colors.mutedForeground, marginTop: 8, textAlign: "center" }]}>
            No questions are linked to this lecture.{"\n\n"}
            Lecture ID: <Text style={{ fontFamily: "Inter_600SemiBold" }}>{lectureId}</Text>
          </Text>
        )}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.actionBtn, { backgroundColor: colors.primary, marginTop: 24 }]}
        >
          <Text style={styles.actionBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Review screen ──────────────────────────────────────────────────────────
  if (reviewing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setReviewing(false)}
            style={[styles.backBtn, { backgroundColor: colors.muted }]}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerMeta}>
            <Text style={[styles.lectureTitle, { color: colors.foreground }]}>Review Answers</Text>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
              {questions.length} questions
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          {history.map((item, qi) => {
            const isCorrect = item.selected === item.correct;
            return (
              <View
                key={qi}
                style={[
                  styles.reviewCard,
                  { backgroundColor: colors.card, borderColor: isCorrect ? "#bbf7d0" : "#fecaca" },
                ]}
              >
                {/* Q header */}
                <View style={styles.reviewQHeader}>
                  <View style={[styles.reviewQNum, { backgroundColor: isCorrect ? "#dcfce7" : "#fee2e2" }]}>
                    <Text style={[styles.reviewQNumText, { color: isCorrect ? colors.success : colors.destructive }]}>
                      {qi + 1}
                    </Text>
                  </View>
                  <Feather
                    name={isCorrect ? "check-circle" : "x-circle"}
                    size={18}
                    color={isCorrect ? colors.success : colors.destructive}
                  />
                </View>

                <Text style={[styles.reviewQuestion, { color: colors.foreground }]}>{item.question.text}</Text>

                {/* Options */}
                {item.question.options.map((opt, oi) => {
                  const isCorrectOpt = oi === item.correct;
                  const isSelectedOpt = oi === item.selected;
                  let bg = colors.background;
                  let border = colors.border;
                  let textCol = colors.mutedForeground;

                  if (isCorrectOpt) { bg = "#d1fae5"; border = "#6ee7b7"; textCol = "#065f46"; }
                  else if (isSelectedOpt) { bg = "#fee2e2"; border = "#fca5a5"; textCol = "#991b1b"; }

                  return (
                    <View key={oi} style={[styles.reviewOption, { backgroundColor: bg, borderColor: border }]}>
                      <Text style={[styles.reviewOptionLabel, { color: textCol }]}>
                        {String.fromCharCode(65 + oi)}
                      </Text>
                      <Text style={[styles.reviewOptionText, { color: textCol }]}>{opt}</Text>
                      {isCorrectOpt && <Feather name="check" size={14} color="#059669" />}
                      {isSelectedOpt && !isCorrectOpt && <Feather name="x" size={14} color="#dc2626" />}
                    </View>
                  );
                })}

                {/* Explanation */}
                {item.explanation ? (
                  <View style={[styles.reviewExplanation, { backgroundColor: "#f0f9ff", borderColor: "#bae6fd" }]}>
                    <Feather name="info" size={13} color={colors.primary} />
                    <Text style={styles.reviewExplanationText}>{item.explanation}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // ── Results screen ─────────────────────────────────────────────────────────
  if (finished) {
    const score = Math.round((correctCount / questions.length) * 100);
    return (
      <ResultsView
        score={score}
        correctCount={correctCount}
        totalCount={questions.length}
        submitting={submitting}
        savedOffline={savedOffline}
        saveError={saveError}
        lectureName={lectureName}
        topPad={topPad}
        onRetry={handleRetry}
        onReview={() => setReviewing(true)}
        onHome={() => router.replace("/(tabs)")}
      />
    );
  }

  // ── Quiz screen ────────────────────────────────────────────────────────────
  const question = questions[currentIndex];
  const progress = (currentIndex + 1) / questions.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.muted }]}>
          <Feather name="x" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <Text style={[styles.lectureTitle, { color: colors.foreground }]} numberOfLines={1}>
            {lectureName}
          </Text>
          <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
            {currentIndex + 1} / {questions.length}
          </Text>
        </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <Animated.View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` as `${number}%` }]} />
      </View>

      <ScrollView contentContainerStyle={[styles.quizContent, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(300)} key={currentIndex}>
          <Text style={[styles.questionText, { color: colors.foreground }]}>{question.text}</Text>
          <View style={styles.options}>
            {question.options.map((opt, i) => (
              <OptionButton key={i} text={opt} index={i} answered={answered} onSelect={handleSelect} />
            ))}
          </View>
          {answered && (
            <Animated.View entering={FadeInDown.duration(300)} style={[styles.explanationBox, { backgroundColor: "#f0f9ff", borderColor: "#bae6fd" }]}>
              <View style={styles.explanationHeader}>
                <Feather name="info" size={16} color={colors.primary} />
                <Text style={[styles.explanationTitle, { color: colors.primary }]}>Explanation</Text>
              </View>
              <Text style={[styles.explanationText, { color: "#0c4a6e" }]}>
                {answered.explanation || "No explanation available."}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      {answered && (
        <Animated.View
          entering={FadeInDown.duration(250)}
          style={[styles.nextWrap, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background }]}
        >
          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
            </Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerScreen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  warmingIcon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  warmingTitle: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.6 },
  warmingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  header: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 20, paddingBottom: 14, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerMeta: { flex: 1 },
  lectureTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
  progressLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  progressTrack: { height: 3, width: "100%" },
  progressFill: { height: "100%" },
  quizContent: { padding: 20 },
  questionText: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.5, lineHeight: 28, marginBottom: 24 },
  options: { gap: 10, marginBottom: 20 },
  option: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 1.5, gap: 12 },
  optionLabel: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  optionLabelText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  optionText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", lineHeight: 20 },
  explanationBox: { padding: 16, borderRadius: 16, borderWidth: 1.5, gap: 8 },
  explanationHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  explanationTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  explanationText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  nextWrap: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#e2e8f0" },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 16, gap: 8, shadowColor: "#0ea5e9", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
  nextBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
  // Results
  resultsScreen: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  resultsContent: { alignItems: "center", width: "100%" },
  resultIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  resultTitle: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.6 },
  resultScore: { fontSize: 64, fontFamily: "Inter_700Bold", letterSpacing: -2, marginTop: 8 },
  resultBreakdown: { fontSize: 15, fontFamily: "Inter_400Regular", marginTop: 4, marginBottom: 8 },
  savingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  saveErrorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 12, width: "100%" },
  saveErrorText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: "#dc2626", lineHeight: 18 },
  resultBtns: { width: "100%", gap: 12, marginTop: 32 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", paddingVertical: 15, borderRadius: 16 },
  actionBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  // Review
  reviewCard: { borderRadius: 18, borderWidth: 1.5, padding: 16, marginBottom: 16, gap: 10 },
  reviewQHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewQNum: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  reviewQNumText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  reviewQuestion: { fontSize: 15, fontFamily: "Inter_600SemiBold", lineHeight: 22, letterSpacing: -0.2 },
  reviewOption: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  reviewOptionLabel: { fontSize: 12, fontFamily: "Inter_700Bold", width: 18 },
  reviewOptionText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  reviewExplanation: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  reviewExplanationText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: "#0c4a6e", lineHeight: 18 },
});
