import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LectureCard } from "@/components/LectureCard";
import { useColors } from "@/hooks/useColors";
import { useHierarchy } from "@/hooks/useHierarchy";
import { useProgress } from "@/hooks/useProgress";

export default function SubjectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: years } = useHierarchy();
  const completedIds = useProgress();

  const subject = years
    ?.flatMap((y) => y.modules)
    .flatMap((m) => m.subjects)
    .find((s) => s.id === id);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  if (!subject) return null;

  const completedCount = subject.lectures.filter(
    (lec) => completedIds.has(lec.external_id) || completedIds.has(lec.id)
  ).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.muted }]}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
          <Text style={[styles.backLabel, { color: colors.foreground }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={2}>
          {subject.name}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LECTURES</Text>

        {subject.lectures.map((lec, i) => {
          const isCompleted = completedIds.has(lec.external_id) || completedIds.has(lec.id);
          return (
            <LectureCard
              key={lec.id}
              lecture={lec}
              index={i}
              completed={isCompleted}
              onPress={() =>
                router.push({
                  pathname: "/quiz/[lectureId]",
                  params: { lectureId: lec.id, lectureName: lec.name },
                })
              }
            />
          );
        })}

        {subject.lectures.length === 0 && (
          <View style={styles.empty}>
            <Feather name="book-open" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No lectures yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "column",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  backLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  headerTitle: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.8, lineHeight: 36 },
  list: { paddingTop: 24 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginHorizontal: 20,
    marginBottom: 14,
  },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
