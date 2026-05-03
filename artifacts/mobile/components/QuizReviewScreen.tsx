import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { HistoryItem } from "@/types";

interface Props {
  history: HistoryItem[];
  totalCount: number;
  topPad: number;
  onBack: () => void;
}

export function QuizReviewScreen({ history, totalCount, topPad, onBack }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backBtn, { backgroundColor: colors.muted }]}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Review Answers</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {totalCount} questions
          </Text>
        </View>
      </View>

      {/* ── Question list ── */}
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
                styles.card,
                { backgroundColor: colors.card, borderColor: isCorrect ? "#bbf7d0" : "#fecaca" },
              ]}
            >
              {/* Question header */}
              <View style={styles.qHeader}>
                <View style={[styles.qNum, { backgroundColor: isCorrect ? "#dcfce7" : "#fee2e2" }]}>
                  <Text style={[styles.qNumText, { color: isCorrect ? colors.success : colors.destructive }]}>
                    {qi + 1}
                  </Text>
                </View>
                <Feather
                  name={isCorrect ? "check-circle" : "x-circle"}
                  size={18}
                  color={isCorrect ? colors.success : colors.destructive}
                />
              </View>

              <Text style={[styles.questionText, { color: colors.foreground }]}>
                {item.question.text}
              </Text>

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
                  <View key={oi} style={[styles.option, { backgroundColor: bg, borderColor: border }]}>
                    <Text style={[styles.optionLabel, { color: textCol }]}>
                      {String.fromCharCode(65 + oi)}
                    </Text>
                    <Text style={[styles.optionText, { color: textCol }]}>{opt}</Text>
                    {isCorrectOpt && <Feather name="check" size={14} color="#059669" />}
                    {isSelectedOpt && !isCorrectOpt && <Feather name="x" size={14} color="#dc2626" />}
                  </View>
                );
              })}

              {/* Explanation */}
              {!!item.explanation && (
                <View style={[styles.explanation, { backgroundColor: "#f0f9ff", borderColor: "#bae6fd" }]}>
                  <Feather name="info" size={13} color={colors.primary} />
                  <Text style={styles.explanationText}>{item.explanation}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerMeta: { flex: 1 },
  headerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  card: { borderRadius: 18, borderWidth: 1.5, padding: 16, marginBottom: 16, gap: 10 },
  qHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qNum: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  qNumText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  questionText: { fontSize: 15, fontFamily: "Inter_600SemiBold", lineHeight: 22, letterSpacing: -0.2 },

  option: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  optionLabel: { fontSize: 12, fontFamily: "Inter_700Bold", width: 18 },
  optionText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  explanation: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  explanationText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: "#0c4a6e", lineHeight: 18 },
});
