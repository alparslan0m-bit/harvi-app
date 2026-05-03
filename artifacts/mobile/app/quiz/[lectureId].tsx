import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
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
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useQuizQuestions } from "@/hooks/useQuiz";
import { decryptAnswer } from "@/lib/crypto";
import { supabase } from "@/lib/supabase";
import { Question } from "@/types";

interface AnsweredState {
  selected: number;
  correct: number;
  explanation: string;
}

function OptionButton({
  text,
  index,
  answered,
  onSelect,
}: {
  text: string;
  index: number;
  answered: AnsweredState | null;
  onSelect: (i: number) => void;
}) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  let bgColor = colors.card;
  let borderColor = colors.border;
  let textColor = colors.foreground;

  if (answered) {
    if (index === answered.correct) {
      bgColor = "#d1fae5";
      borderColor = "#6ee7b7";
      textColor = "#065f46";
    } else if (index === answered.selected && index !== answered.correct) {
      bgColor = "#fee2e2";
      borderColor = "#fca5a5";
      textColor = "#991b1b";
    } else {
      bgColor = colors.muted;
      borderColor = colors.border;
      textColor = colors.mutedForeground;
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
        {answered && index === answered.correct && (
          <Feather name="check-circle" size={18} color="#059669" />
        )}
        {answered && index === answered.selected && index !== answered.correct && (
          <Feather name="x-circle" size={18} color="#dc2626" />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function QuizScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { lectureId, lectureName } = useLocalSearchParams<{
    lectureId: string;
    lectureName: string;
  }>();
  const { user } = useAuth();
  const { data: questions, isLoading, error } = useQuizQuestions(lectureId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState<AnsweredState | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const handleSelect = useCallback(
    (selectedIndex: number) => {
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
    },
    [questions, currentIndex]
  );

  const handleNext = useCallback(async () => {
    if (!questions) return;
    const isLast = currentIndex === questions.length - 1;

    if (isLast) {
      setFinished(true);
      setSubmitting(true);
      const finalCorrect = answered && answered.selected === answered.correct
        ? correctCount + (correctCount === correctCount ? 0 : 0)
        : correctCount;
      const score = Math.round((correctCount / questions.length) * 100);
      await supabase.from("quiz_results").insert({
        user_id: user?.id,
        lecture_id: lectureId,
        lecture_name: lectureName,
        score,
        total_questions: questions.length,
        correct_answers: correctCount,
      });
      setSubmitting(false);
    } else {
      setCurrentIndex((i) => i + 1);
      setAnswered(null);
    }
  }, [questions, currentIndex, correctCount, answered, user, lectureId, lectureName]);

  if (isLoading) {
    return (
      <View style={[styles.warmingScreen, { backgroundColor: colors.background }]}>
        <View style={[styles.warmingIcon, { backgroundColor: colors.primary }]}>
          <Feather name="zap" size={32} color="#fff" />
        </View>
        <Text style={[styles.warmingTitle, { color: colors.foreground }]}>
          Warming Engines
        </Text>
        <Text style={[styles.warmingText, { color: colors.mutedForeground }]}>
          Loading your questions...
        </Text>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (error || !questions || questions.length === 0) {
    return (
      <View style={[styles.warmingScreen, { backgroundColor: colors.background, paddingHorizontal: 28 }]}>
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
            No questions are linked to this lecture in the database.{"\n\n"}
            Lecture ID: <Text style={{ fontFamily: "Inter_600SemiBold" }}>{lectureId}</Text>
          </Text>
        )}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 24, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (finished) {
    const score = Math.round((correctCount / questions.length) * 100);
    const isPassing = score >= 60;
    return (
      <View style={[styles.resultsScreen, { backgroundColor: colors.background, paddingTop: topPad + 40, paddingBottom: insets.bottom + 24 }]}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.resultsContent}>
          <View
            style={[
              styles.resultIcon,
              { backgroundColor: isPassing ? "#d1fae5" : "#fee2e2" },
            ]}
          >
            <Feather
              name={isPassing ? "award" : "refresh-cw"}
              size={36}
              color={isPassing ? colors.success : colors.destructive}
            />
          </View>
          <Text style={[styles.resultTitle, { color: colors.foreground }]}>
            {isPassing ? "Well done!" : "Keep practising!"}
          </Text>
          <Text style={[styles.resultScore, { color: isPassing ? colors.success : colors.destructive }]}>
            {score}%
          </Text>
          <Text style={[styles.resultBreakdown, { color: colors.mutedForeground }]}>
            {correctCount} of {questions.length} correct
          </Text>
          {submitting && (
            <Text style={[styles.savingText, { color: colors.mutedForeground }]}>
              Saving results...
            </Text>
          )}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, marginTop: 32 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.btnText}>Back to Lectures</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  const question = questions[currentIndex];
  const progress = (currentIndex + 1) / questions.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.muted }]}
        >
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

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.primary,
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.quizContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(300)} key={currentIndex}>
          <Text style={[styles.questionText, { color: colors.foreground }]}>
            {question.text}
          </Text>

          <View style={styles.options}>
            {question.options.map((opt, i) => (
              <OptionButton
                key={i}
                text={opt}
                index={i}
                answered={answered}
                onSelect={handleSelect}
              />
            ))}
          </View>

          {answered && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={[styles.explanationBox, { backgroundColor: "#f0f9ff", borderColor: "#bae6fd" }]}
            >
              <View style={styles.explanationHeader}>
                <Feather name="info" size={16} color={colors.primary} />
                <Text style={[styles.explanationTitle, { color: colors.primary }]}>
                  Explanation
                </Text>
              </View>
              <Text style={[styles.explanationText, { color: "#0c4a6e" }]}>
                {answered.explanation || "No explanation available."}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Next button */}
      {answered && (
        <Animated.View
          entering={FadeInDown.duration(250)}
          style={[
            styles.nextWrap,
            { paddingBottom: insets.bottom + 16, backgroundColor: colors.background },
          ]}
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
  warmingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  warmingIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  warmingTitle: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.6 },
  warmingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  backLink: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginTop: 12 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerMeta: { flex: 1 },
  lectureTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
  progressLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  progressTrack: { height: 3, width: "100%" },
  progressFill: { height: "100%" },
  quizContent: { padding: 20 },
  questionText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: 24,
  },
  options: { gap: 10, marginBottom: 20 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  optionLabel: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabelText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  optionText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", lineHeight: 20 },
  explanationBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
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
  resultsScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  resultsContent: { alignItems: "center", width: "100%" },
  resultIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  resultTitle: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.6 },
  resultScore: { fontSize: 60, fontFamily: "Inter_700Bold", letterSpacing: -2, marginTop: 8 },
  resultBreakdown: { fontSize: 15, fontFamily: "Inter_400Regular", marginTop: 4 },
  savingText: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 8 },
  btn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
