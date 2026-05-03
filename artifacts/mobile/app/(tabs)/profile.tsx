import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const initial = (user?.email?.[0] ?? "U").toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : null;

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return;
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { error } = await supabase.from("feedback").insert({
      user_id: user?.id,
      message: feedbackText.trim(),
    });
    setSubmitting(false);
    if (!error) {
      setFeedbackText("");
      setFeedbackSent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setFeedbackSent(false), 3000);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "This will delete all your quiz results. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await supabase.from("quiz_results").delete().eq("user_id", user?.id ?? "");
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
    router.replace("/auth");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Fixed header ──────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topPad + 14, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <View style={[styles.avatarSmall, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarSmallText}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
            {user?.email ?? "Account & settings"}
          </Text>
        </View>
      </View>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Account info card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatarLarge, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarLargeText}>{initial}</Text>
          </View>
          <View style={styles.infoRows}>
            <View style={styles.infoRow}>
              <Feather name="mail" size={15} color={colors.mutedForeground} />
              <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>
                {user?.email}
              </Text>
            </View>
            {memberSince && (
              <View style={styles.infoRow}>
                <Feather name="calendar" size={15} color={colors.mutedForeground} />
                <Text style={[styles.infoValue, { color: colors.mutedForeground }]}>
                  Member since {memberSince}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Feedback */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="message-square" size={17} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Send Feedback</Text>
          </View>
          <TextInput
            style={[styles.textarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            placeholder="Share your thoughts, report a bug, or suggest a feature..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            value={feedbackText}
            onChangeText={setFeedbackText}
            textAlignVertical="top"
          />
          {feedbackSent && (
            <View style={[styles.successBox, { backgroundColor: "#d1fae5", borderColor: "#6ee7b7" }]}>
              <Feather name="check-circle" size={14} color={colors.success} />
              <Text style={[styles.successText, { color: colors.success }]}>
                Feedback sent — thank you!
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: feedbackText.trim() ? colors.primary : colors.muted }]}
            onPress={handleSubmitFeedback}
            disabled={submitting || !feedbackText.trim()}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[styles.btnText, { color: feedbackText.trim() ? "#fff" : colors.mutedForeground }]}>
                Submit Feedback
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Account actions */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="settings" size={17} color={colors.mutedForeground} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account</Text>
          </View>

          <TouchableOpacity
            style={[styles.actionRow, { borderTopColor: colors.border }]}
            onPress={handleClearHistory}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#fee2e2" }]}>
              <Feather name="trash-2" size={15} color={colors.destructive} />
            </View>
            <Text style={[styles.actionText, { color: colors.destructive }]}>Clear Quiz History</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { borderTopColor: colors.border }]}
            onPress={handleSignOut}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.muted }]}>
              <Feather name="log-out" size={15} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.actionText, { color: colors.mutedForeground }]}>Sign Out</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.8 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },

  avatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSmallText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },

  content: { paddingTop: 20 },

  infoCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarLarge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLargeText: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff" },
  infoRows: { flex: 1, gap: 8 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },

  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },

  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 100,
    lineHeight: 20,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  successText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  btn: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  btnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
});
