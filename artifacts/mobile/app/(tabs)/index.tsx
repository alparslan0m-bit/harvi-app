import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { YearCard } from "@/components/YearCard";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useHierarchy } from "@/hooks/useHierarchy";

function ErrorState({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const isRLS = error.message.includes("row-level security") || error.message.includes("42501");
  const isMissing = error.message.includes("relation") && error.message.includes("does not exist") || error.message.includes("42P01");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.errorContainer, { paddingTop: topPad + 32 }]}
    >
      <View style={[styles.errorIcon, { backgroundColor: "#fef2f2" }]}>
        <Feather name="alert-triangle" size={28} color={colors.destructive} />
      </View>

      <Text style={[styles.errorTitle, { color: colors.foreground }]}>
        {isMissing ? "Database tables not found" : isRLS ? "Access denied" : "Could not load content"}
      </Text>

      {isMissing && (
        <View style={[styles.infoBox, { backgroundColor: "#fef2f2", borderColor: "#fecaca" }]}>
          <Text style={[styles.infoText, { color: "#7f1d1d" }]}>
            The <Text style={styles.mono}>years</Text>, <Text style={styles.mono}>modules</Text>, or{" "}
            <Text style={styles.mono}>lectures</Text> tables are missing from your Supabase project.{"\n\n"}
            Go to <Text style={styles.bold}>Supabase → SQL Editor</Text> and create these tables, then pull-to-refresh.
          </Text>
        </View>
      )}

      {isRLS && (
        <View style={[styles.infoBox, { backgroundColor: "#fffbeb", borderColor: "#fde68a" }]}>
          <Text style={[styles.infoText, { color: "#78350f" }]}>
            Row Level Security is blocking reads.{"\n\n"}
            In <Text style={styles.bold}>Supabase → Authentication → Policies</Text>, add a{" "}
            <Text style={styles.mono}>SELECT</Text> policy allowing authenticated users to read{" "}
            <Text style={styles.mono}>years</Text>, <Text style={styles.mono}>modules</Text>, and{" "}
            <Text style={styles.mono}>lectures</Text>.
          </Text>
        </View>
      )}

      {!isMissing && !isRLS && (
        <View style={[styles.infoBox, { backgroundColor: "#f0f9ff", borderColor: "#bae6fd" }]}>
          <Text style={[styles.infoText, { color: "#0c4a6e" }]} selectable>
            {error.message}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.retryBtn, { backgroundColor: colors.primary }]}
        onPress={onRetry}
      >
        <Feather name="refresh-cw" size={16} color="#fff" />
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

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
    return <ErrorState error={error as Error} onRetry={refetch} />;
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
          <Feather name="book-open" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No content yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Your curriculum will appear here once years and modules are added to your database.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  content: {},
  headerSection: { paddingHorizontal: 20, marginBottom: 24 },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 4 },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  // Error state
  errorContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 60,
    gap: 16,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  infoBox: {
    width: "100%",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  bold: { fontFamily: "Inter_700Bold" },
  mono: { fontFamily: "Inter_600SemiBold" },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  retryText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
