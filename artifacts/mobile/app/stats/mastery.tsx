import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MasteryBar } from "@/components/MasteryBar";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useStats } from "@/hooks/useStats";

const FILTERS = ["All", "Strong (≥80%)", "Improving (50–79%)", "Needs Work (<50%)"] as const;
type Filter = (typeof FILTERS)[number];

export default function MasteryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: stats } = useStats(user?.id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const items = useMemo(() => {
    const all = stats?.subject_mastery ?? [];
    return all.filter((item) => {
      const matchSearch = item.subject.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "All"
          ? true
          : filter === "Strong (≥80%)"
          ? item.mastery >= 80
          : filter === "Improving (50–79%)"
          ? item.mastery >= 50 && item.mastery < 80
          : item.mastery < 50;
      return matchSearch && matchFilter;
    });
  }, [stats?.subject_mastery, search, filter]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.foreground }]}>Lecture Mastery</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {items.length} lecture{items.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search lectures…"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.chip,
              {
                backgroundColor: filter === f ? colors.primary : colors.card,
                borderColor: filter === f ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: filter === f ? "#fff" : colors.mutedForeground },
              ]}
            >
              {f}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
      >
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No lectures match your filter
            </Text>
          </View>
        ) : (
          items.map((item, i) => (
            <View
              key={i}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <MasteryBar subject={item.subject} mastery={item.mastery} />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.6 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  chips: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  list: { paddingHorizontal: 20, paddingTop: 4 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  empty: {
    alignItems: "center",
    gap: 12,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
