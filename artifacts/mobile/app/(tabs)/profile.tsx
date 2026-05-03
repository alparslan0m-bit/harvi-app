import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useScrollToTop } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

import { AvatarPicker } from "@/components/AvatarPicker";
import { AvatarById, AvatarId } from "@/components/DoctorAvatars";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";

const AVATAR_KEY = "harvi:avatar";
const NAME_KEY   = "harvi:displayName";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [cooldownSecs, setCooldownSecs] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [avatarId, setAvatarId] = useState<AvatarId | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const nameInputRef = useRef<TextInput>(null);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const initial = (user?.email?.[0] ?? "U").toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : null;

  /* Load saved avatar + name */
  useEffect(() => {
    AsyncStorage.multiGet([AVATAR_KEY, NAME_KEY]).then((pairs) => {
      const av = pairs[0][1];
      const nm = pairs[1][1];
      if (av) setAvatarId(av as AvatarId);
      if (nm) setDisplayName(nm);
    });
  }, []);

  const handleSelectAvatar = (id: AvatarId) => {
    setAvatarId(id);
    AsyncStorage.setItem(AVATAR_KEY, id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openEditMode = () => {
    setNameInput(displayName);
    setEditMode(true);
    setTimeout(() => nameInputRef.current?.focus(), 80);
  };

  const closeEditMode = () => {
    const trimmed = nameInput.trim();
    setDisplayName(trimmed);
    AsyncStorage.setItem(NAME_KEY, trimmed);
    setEditMode(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const FEEDBACK_MIN = 10;
  const FEEDBACK_MAX = 500;
  const COOLDOWN_SECS = 60;

  /* Sanitize: strip null bytes, leading/trailing whitespace, collapse runs of whitespace */
  const sanitize = (text: string) =>
    text.replace(/\0/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();

  const startCooldown = () => {
    setCooldownSecs(COOLDOWN_SECS);
    cooldownRef.current = setInterval(() => {
      setCooldownSecs((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleSubmitFeedback = async () => {
    const clean = sanitize(feedbackText);

    /* Client-side guards */
    if (clean.length < FEEDBACK_MIN) {
      setFeedbackError(`Please write at least ${FEEDBACK_MIN} characters.`);
      return;
    }
    if (clean.length > FEEDBACK_MAX) {
      setFeedbackError(`Feedback must be under ${FEEDBACK_MAX} characters.`);
      return;
    }
    if (cooldownSecs > 0) return;
    if (!user?.id) {
      setFeedbackError("You must be signed in to submit feedback.");
      return;
    }

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeedbackError(null);

    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      content: clean,
    });

    setSubmitting(false);
    if (!error) {
      setFeedbackText("");
      setFeedbackSent(true);
      setFeedbackError(null);
      startCooldown();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setFeedbackSent(false), 3000);
    } else {
      setFeedbackError(error.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      </View>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >

        {/* ── Hero avatar card ─────────────────────────────────────────── */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

          {/* Edit / Done toggle — top-right corner */}
          <TouchableOpacity
            style={[styles.editToggle, {
              backgroundColor: editMode ? colors.primary : colors.muted,
            }]}
            onPress={editMode ? closeEditMode : openEditMode}
            activeOpacity={0.8}
          >
            <Feather
              name={editMode ? "check" : "edit-2"}
              size={13}
              color={editMode ? "#fff" : colors.mutedForeground}
            />
            <Text style={[styles.editToggleText, {
              color: editMode ? "#fff" : colors.mutedForeground,
            }]}>
              {editMode ? "Done" : "Edit"}
            </Text>
          </TouchableOpacity>

          {/* Avatar */}
          <TouchableOpacity
            onPress={editMode ? () => setPickerVisible(true) : undefined}
            activeOpacity={editMode ? 0.8 : 1}
            style={styles.avatarWrap}
          >
            <View style={[styles.avatarRing, {
              borderColor: editMode ? colors.primary : colors.primary + "30",
            }]}>
              {avatarId ? (
                <View style={[styles.avatarIllustration, { backgroundColor: "#f0f9ff" }]}>
                  <AvatarById id={avatarId} size={76} />
                </View>
              ) : (
                <View style={[styles.avatarInitial, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarInitialText}>{initial}</Text>
                </View>
              )}
            </View>
            {/* Camera badge — only in edit mode */}
            {editMode && (
              <View style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.card }]}>
                <Feather name="camera" size={10} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Name */}
          {editMode ? (
            <TextInput
              ref={nameInputRef}
              style={[styles.nameInput, {
                color: colors.foreground,
                borderColor: colors.primary + "60",
                backgroundColor: colors.background,
              }]}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="done"
              onSubmitEditing={closeEditMode}
              maxLength={40}
              autoCapitalize="words"
              textAlign="center"
            />
          ) : (
            <Text style={[
              displayName ? styles.heroName : styles.heroNamePlaceholder,
              { color: displayName ? colors.foreground : colors.mutedForeground },
            ]} numberOfLines={1}>
              {displayName || "Tap Edit to add your name"}
            </Text>
          )}

          {/* Email */}
          <Text style={[styles.heroEmail, { color: colors.mutedForeground }]} numberOfLines={1}>
            {user?.email}
          </Text>

          {/* Member pill */}
          {memberSince && (
            <View style={[styles.memberPill, { backgroundColor: colors.primary + "12" }]}>
              <Feather name="calendar" size={11} color={colors.primary} />
              <Text style={[styles.memberPillText, { color: colors.primary }]}>
                Member since {memberSince}
              </Text>
            </View>
          )}

          {/* Hint shown only in edit mode */}
          {editMode && (
            <Text style={[styles.editHint, { color: colors.mutedForeground }]}>
              Tap avatar to change photo
            </Text>
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
              borderColor: feedbackError ? "#fca5a5" : colors.border,
              backgroundColor: colors.background,
            }]}
            placeholder="Share your thoughts, report a bug, or suggest a feature…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            value={feedbackText}
            onChangeText={(t) => {
              setFeedbackText(t.slice(0, 500));
              if (feedbackError) setFeedbackError(null);
            }}
            textAlignVertical="top"
            maxLength={500}
            editable={cooldownSecs === 0 && !submitting}
          />

          {/* Character counter */}
          <Text style={[styles.charCount, {
            color: feedbackText.length >= 480
              ? "#dc2626"
              : feedbackText.length >= 400
              ? "#d97706"
              : colors.mutedForeground,
          }]}>
            {feedbackText.length} / 500
          </Text>

          {feedbackSent && (
            <View style={[styles.successBox, { backgroundColor: "#d1fae5", borderColor: "#6ee7b7" }]}>
              <Feather name="check-circle" size={14} color="#059669" />
              <Text style={[styles.successText, { color: "#059669" }]}>
                Feedback sent — thank you!
              </Text>
            </View>
          )}

          {feedbackError && (
            <View style={[styles.successBox, { backgroundColor: "#fee2e2", borderColor: "#fca5a5" }]}>
              <Feather name="alert-circle" size={14} color="#dc2626" />
              <Text style={[styles.successText, { color: "#dc2626", flex: 1 }]} numberOfLines={3}>
                {feedbackError}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitBtn,
              {
                backgroundColor:
                  submitting || cooldownSecs > 0 || feedbackText.trim().length < 10
                    ? colors.muted
                    : colors.primary,
              },
            ]}
            onPress={handleSubmitFeedback}
            disabled={submitting || cooldownSecs > 0 || feedbackText.trim().length < 10}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : cooldownSecs > 0 ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Feather name="clock" size={14} color={colors.mutedForeground} />
                <Text style={[styles.submitBtnText, { color: colors.mutedForeground }]}>
                  Wait {cooldownSecs}s
                </Text>
              </View>
            ) : (
              <Text style={[styles.submitBtnText, {
                color: feedbackText.trim().length < 10 ? colors.mutedForeground : "#fff",
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

        <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
          Harvi · v1.0.0
        </Text>
      </ScrollView>

      {/* ── Avatar picker sheet ───────────────────────────────────────── */}
      <AvatarPicker
        visible={pickerVisible}
        current={avatarId}
        onSelect={handleSelectAvatar}
        onClose={() => setPickerVisible(false)}
      />
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
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 18,
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 4,
  },
  editToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 4,
  },
  editToggleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  avatarWrap: { position: "relative", marginBottom: 6 },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIllustration: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarInitial: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitialText: { fontSize: 34, fontFamily: "Inter_700Bold", color: "#fff" },
  editBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  heroName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  heroNamePlaceholder: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    marginTop: 2,
  },
  nameInput: {
    width: "100%",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
  heroEmail: { fontSize: 13, fontFamily: "Inter_400Regular", letterSpacing: -0.1, marginTop: 2 },
  memberPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
  },
  memberPillText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  editHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 6 },

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

  textarea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 96,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    marginTop: 4,
    marginBottom: 2,
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
