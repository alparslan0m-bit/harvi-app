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
import colors from "@/constants/colors";
import { useColors } from "@/hooks/useColors";
import { useHierarchy } from "@/hooks/useHierarchy";

export default function SubjectScreen() {
  const themeColors = useColors();
  const insets = useSafeAreaInsets();
  const { id, yearIndex: yearIndexParam } = useLocalSearchParams<{ id: string; yearIndex: string }>();
  const { data: years } = useHierarchy();
  const yearIndex = parseInt(yearIndexParam ?? "0", 10);
  const accent = (colors.yearGradients[yearIndex % colors.yearGradients.length] as [string, string])[0];

  const subject = years
    ?.flatMap((y) => y.modules)
    .flatMap((m) => m.subjects)
    .find((s) => s.id === id);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  if (!subject) return null;

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: themeColors.background,
            borderBottomColor: themeColors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: themeColors.muted }]}
        >
          <Feather name="arrow-left" size={20} color={themeColors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: themeColors.foreground }]} numberOfLines={2}>
            {subject.name}
          </Text>
          <Text style={[styles.headerSub, { color: themeColors.mutedForeground }]}>
            {subject.lectures.length} {subject.lectures.length === 1 ? "lecture" : "lectures"}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress hint */}
        <View style={[styles.banner, { backgroundColor: accent + "12" }]}>
          <View style={[styles.bannerDot, { backgroundColor: accent }]} />
          <Text style={[styles.bannerText, { color: accent }]}>
            Tap a lecture to start the quiz
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: themeColors.mutedForeground }]}>
          LECTURES
        </Text>

        {subject.lectures.map((lec, i) => (
          <LectureCard
            key={lec.id}
            lecture={lec}
            index={i}
            onPress={() =>
              router.push({
                pathname: "/quiz/[lectureId]",
                params: { lectureId: lec.external_id ?? lec.id, lectureName: lec.name },
              })
            }
          />
        ))}

        {subject.lectures.length === 0 && (
          <View style={styles.empty}>
            <Feather name="book-open" size={36} color={themeColors.mutedForeground} />
            <Text style={[styles.emptyText, { color: themeColors.mutedForeground }]}>
              No lectures yet
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.5, lineHeight: 26 },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  list: { paddingTop: 20 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bannerDot: { width: 6, height: 6, borderRadius: 3 },
  bannerText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
