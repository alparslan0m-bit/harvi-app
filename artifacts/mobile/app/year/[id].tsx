import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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

export default function YearScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: years } = useHierarchy();
  const year = years?.find((y) => y.id === id);
  const [expandedModule, setExpandedModule] = useState<string | null>(
    year?.modules[0]?.id ?? null
  );

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  if (!year) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.muted }]}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {year.name}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {year.modules.length} modules
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {year.modules.map((mod) => {
          const isExpanded = expandedModule === mod.id;
          return (
            <View key={mod.id}>
              <TouchableOpacity
                style={[
                  styles.moduleHeader,
                  {
                    backgroundColor: isExpanded ? colors.muted : colors.background,
                    borderBottomColor: colors.border,
                  },
                ]}
                onPress={() =>
                  setExpandedModule(isExpanded ? null : mod.id)
                }
              >
                <View style={styles.moduleLeft}>
                  <View
                    style={[
                      styles.moduleDot,
                      { backgroundColor: isExpanded ? colors.primary : colors.border },
                    ]}
                  />
                  <Text
                    style={[
                      styles.moduleName,
                      {
                        color: isExpanded ? colors.primary : colors.foreground,
                        fontFamily: isExpanded ? "Inter_700Bold" : "Inter_600SemiBold",
                      },
                    ]}
                  >
                    {mod.name}
                  </Text>
                </View>
                <View style={styles.moduleRight}>
                  <Text style={[styles.lecCount, { color: colors.mutedForeground }]}>
                    {mod.lectures.length}
                  </Text>
                  <Feather
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.mutedForeground}
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.lectureList}>
                  {mod.lectures.map((lec, i) => (
                    <LectureCard
                      key={lec.id}
                      lecture={lec}
                      index={i}
                      onPress={() =>
                        router.push({
                          pathname: "/quiz/[lectureId]",
                          params: { lectureId: lec.id, lectureName: lec.name },
                        })
                      }
                    />
                  ))}
                  {mod.lectures.length === 0 && (
                    <Text
                      style={[
                        styles.emptyLec,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      No lectures yet
                    </Text>
                  )}
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
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.6,
  },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  moduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  moduleLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  moduleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moduleName: { fontSize: 15, letterSpacing: -0.2, flex: 1 },
  moduleRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  lecCount: { fontSize: 13, fontFamily: "Inter_500Medium" },
  lectureList: { paddingTop: 10, paddingBottom: 6 },
  emptyLec: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
