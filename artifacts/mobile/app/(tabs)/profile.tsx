import { Feather } from "@expo/vector-icons";
import { useScrollToTop } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
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

  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

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
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        <Text style={[styles.subtitle, { color: colors.primary }]}>
          Account & settings
        </Text>
      </View>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >

        {/* ── Hero avatar card ─────────────────────────────────────────── */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Avatar ring */}
          <View style={[styles.avatarRing, { borderColor: colors.primary + "33" }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </View>

          {/* Name / email */}
          <Text style={[styles.heroEmail, { color: colors.foreground }]} numberOfLines={1}>
            {user?.email}
          </Text>

          {/* Member pill */}
          {memberSince && (
            <View style={[styles.memberPill, { backgroundColor: colors.primary + "14" }]}>
              <Feather name="calendar" size={11} color={colors.primary} />
              <Text style={[styles.memberPillText, { color: colors.primary }]}>
                Member since {memberSince}
              </Text>
            </View>
          )}
        </View>

        {/* ── Feedback ────────────────────────────────────────────────── */}
        <View style={styles.sectionLabel}>
          <Feather name="message-square" size={13} color={colors.mutedForeground} />
          <Text style={[styles.sectionLabelText, { color: colors.mutedForeground }]}>FEEDBACK</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.textarea, {
              color: colors.foreground,
              borderColor: colors.border,
              backgroundColor: colors.background,
            }]}
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
              <Feather name="check-circle" size={14} color="#059669" />
              <Text style={[styles.successText, { color: "#059669" }]}>
                Feedback sent — thank you!
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: feedbackText.trim() ? colors.primary : colors.muted },
            ]}
            onPress={handleSubmitFeedback}
            disabled={submitting || !feedbackText.trim()}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[styles.submitBtnText, {
                color: feedbackText.trim() ? "#fff" : colors.mutedForeground,
              }]}>
                Submit Feedback
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Account actions ──────────────────────────────────────────── */}
        <View style={styles.sectionLabel}>
          <Feather name="settings" size={13} color={colors.mutedForeground} />
          <Text style={[styles.sectionLabelText, { color: colors.mutedForeground }]}>ACCOUNT</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 0 }]}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleClearHistory}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: "#fee2e2" }]}>
              <Feather name="trash-2" size={15} color="#ef4444" />
            </View>
            <Text style={[styles.actionLabel, { color: "#ef4444" }]}>Clear Quiz History</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.muted }]}>
              <Feather name="log-out" size={15} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>Sign Out</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* App version */}
        <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
          Harvi · v1.0.0
        </Text>

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
  },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.8 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },

  content: { paddingTop: 24, paddingHorizontal: 20 },

  /* Hero card */
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 28,
    gap: 10,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff" },
  heroEmail: { fontSize: 15, fontFamily: "Inter_600SemiBold", letterSpacing: -0.2 },
  memberPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 2,
  },
  memberPillText: { fontSize: 12, fontFamily: "Inter_500Medium" },

  /* Section label */
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    marginLeft: 2,
  },
  sectionLabelText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },

  /* Generic card */
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },

  /* Textarea */
  textarea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 96,
    lineHeight: 22,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  successText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  submitBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  /* Action rows */
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 2,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 2 },

  versionText: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: -8,
    marginBottom: 4,
  },
});
