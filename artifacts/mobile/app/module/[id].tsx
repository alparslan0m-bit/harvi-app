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

import { SubjectCard } from "@/components/SubjectCard";
import { useColors } from "@/hooks/useColors";
import { useHierarchy } from "@/hooks/useHierarchy";
import { useProgress } from "@/hooks/useProgress";

export default function ModuleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: years } = useHierarchy();
  const completedIds = useProgress();

  const module = years?.flatMap((y) => y.modules).find((m) => m.id === id);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  if (!module) return null;

  const totalLectures = module.subjects.reduce((sum, s) => sum + s.lectures.length, 0);

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
          {module.name}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SUBJECTS</Text>

        {module.subjects.map((sub, i) => {
          const completedCount = sub.lectures.filter(
            (lec) => completedIds.has(lec.external_id) || completedIds.has(lec.id)
          ).length;

          return (
            <SubjectCard
              key={sub.id}
              subject={sub}
              index={i}
              completedCount={completedCount}
              onPress={() =>
                router.push({ pathname: "/subject/[id]", params: { id: sub.id } })
              }
            />
          );
        })}

        {module.subjects.length === 0 && (
          <View style={styles.empty}>
            <Feather name="inbox" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No subjects yet</Text>
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
