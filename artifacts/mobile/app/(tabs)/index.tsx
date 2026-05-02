import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { YearCard } from "@/components/YearCard";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useHierarchy } from "@/hooks/useHierarchy";

export default function LearnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session, loading: authLoading } = useAuth();
  const { data: years, isLoading, error, refetch, isRefetching } = useHierarchy();

  useEffect(() => {
    if (!authLoading && !session) {
      router.replace("/auth");
    }
  }, [session, authLoading]);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  if (isLoading || authLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading curriculum...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          Failed to load content
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 24, paddingBottom: insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.headerSection}>
        <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
          Ready to study?
        </Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Your Curriculum
        </Text>
      </View>

      {years?.map((year, i) => (
        <YearCard
          key={year.id}
          year={year}
          index={i}
          onPress={() =>
            router.push({ pathname: "/year/[id]", params: { id: year.id } })
          }
        />
      ))}

      {(!years || years.length === 0) && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No content yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Your curriculum will appear here once content is added.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  errorText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  content: {},
  headerSection: { paddingHorizontal: 20, marginBottom: 24 },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 4 },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
