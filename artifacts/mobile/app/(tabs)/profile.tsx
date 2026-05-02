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
            await supabase
              .from("quiz_results")
              .delete()
              .eq("user_id", user?.id ?? "");
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
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 24, paddingBottom: insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerSection}>
        <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
          Signed in as
        </Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
      </View>

      {/* User card */}
      <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {(user?.email?.[0] ?? "U").toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userEmail, { color: colors.foreground }]}>
            {user?.email}
          </Text>
          <Text style={[styles.userMeta, { color: colors.mutedForeground }]}>
            Member since{" "}
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </Text>
        </View>
      </View>

      {/* Feedback */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Send Feedback
        </Text>
        <TextInput
          style={[
            styles.textarea,
            {
              color: colors.foreground,
              borderColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
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
          style={[
            styles.btn,
            {
              backgroundColor: feedbackText.trim() ? colors.primary : colors.muted,
            },
          ]}
          onPress={handleSubmitFeedback}
          disabled={submitting || !feedbackText.trim()}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text
              style={[
                styles.btnText,
                { color: feedbackText.trim() ? "#fff" : colors.mutedForeground },
              ]}
            >
              Submit Feedback
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Danger zone */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account</Text>

        <TouchableOpacity
          style={[styles.actionRow, { borderColor: colors.border }]}
          onPress={handleClearHistory}
        >
          <Feather name="trash-2" size={18} color={colors.destructive} />
          <Text style={[styles.actionText, { color: colors.destructive }]}>
            Clear Quiz History
          </Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionRow, { borderColor: "transparent" }]}
          onPress={handleSignOut}
        >
          <Feather name="log-out" size={18} color={colors.mutedForeground} />
          <Text style={[styles.actionText, { color: colors.mutedForeground }]}>
            Sign Out
          </Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {},
  headerSection: { paddingHorizontal: 20, marginBottom: 24 },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 4 },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  userCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  userInfo: { flex: 1 },
  userEmail: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  userMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
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
  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
});
