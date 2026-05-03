import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useQueryClient } from "@tanstack/react-query";

import { OptionButton } from "@/components/OptionButton";
import { QuizLoadingScreen } from "@/components/QuizLoadingScreen";
import { QuizReviewScreen } from "@/components/QuizReviewScreen";
import { ResultsView } from "@/components/QuizResultsView";
import { useAuth } from "@/context/AuthContext";
import { useSyncStatus } from "@/context/SyncContext";
import { useColors } from "@/hooks/useColors";
import { useQuizQuestions } from "@/hooks/useQuiz";
import { optimisticallyMarkComplete } from "@/hooks/useProgress";
import { decryptAnswer } from "@/lib/crypto";
import { loadQuestionsFromCache } from "@/lib/questionCache";
import { enqueueQuizResult } from "@/lib/offlineQueue";
import { supabase } from "@/lib/supabase";
import { AnsweredState, HistoryItem, Question } from "@/types";

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

  // ── Quiz session state ────────────────────────────────────────────────────
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

  // ── Handlers ─────────────────────────────────────────────────────────────

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
      } else {
        const { error: insertErr } = await supabase.from("quiz_results").insert({
          user_id: user?.id,
          lecture_id: lectureId,
          score,
          total_questions: questions.length,
          correct_answers: correctCount,
          created_at: now,
        });

        if (insertErr) {
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

      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setSubmitting(false);
    } else {
      setCurrentIndex((i) => i + 1);
      setAnswered(null);
    }
  }, [questions, currentIndex, correctCount, user, lectureId, queryClient, isOnline]);

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

  // ── Loading ───────────────────────────────────────────────────────────────

  if (!cacheChecked || (isLoading && !questions)) {
    return <QuizLoadingScreen lectureName={lectureName} />;
  }

  // ── Error / empty ─────────────────────────────────────────────────────────

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

  // ── Review screen ─────────────────────────────────────────────────────────

  if (reviewing) {
    return (
      <QuizReviewScreen
        history={history}
        totalCount={questions.length}
        topPad={topPad}
        onBack={() => setReviewing(false)}
      />
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────

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

  // ── Active quiz ───────────────────────────────────────────────────────────

  const question = questions[currentIndex];
  const progress = (currentIndex + 1) / questions.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
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
        <Animated.View
          style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` as `${number}%` }]}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.quizContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(300)} key={currentIndex}>
          <Text style={[styles.questionText, { color: colors.foreground }]}>{question.text}</Text>
          <View style={styles.options}>
            {question.options.map((opt, i) => (
              <OptionButton key={i} text={opt} index={i} answered={answered} onSelect={handleSelect} />
            ))}
          </View>
          {answered && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={[styles.explanationBox, { backgroundColor: "#f0f9ff", borderColor: "#bae6fd" }]}
            >
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
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            onPress={handleNext}
          >
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

  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerMeta: { flex: 1 },
  lectureTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
  progressLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  progressTrack: { height: 3, width: "100%" },
  progressFill: { height: "100%" },

  quizContent: { padding: 20 },
  questionText: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.5, lineHeight: 28, marginBottom: 24 },
  options: { gap: 10, marginBottom: 20 },

  explanationBox: { padding: 16, borderRadius: 16, borderWidth: 1.5, gap: 8 },
  explanationHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  explanationTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  explanationText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },

  nextWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e2e8f0",
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  nextBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },

  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", paddingVertical: 15, borderRadius: 16 },
  actionBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
