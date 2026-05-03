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
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {module.name}
          </Text>
          <View style={styles.headerMeta}>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {module.subjects.length} subjects
            </Text>
            {totalLectures > 0 && (
              <>
                <Text style={[styles.dot, { color: colors.mutedForeground }]}>·</Text>
                <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                  {totalLectures} lectures
                </Text>
              </>
            )}
          </View>
        </View>
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
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 1 },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  dot: { fontSize: 13 },
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
