import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { Module } from "@/types";

interface Props {
  module: Module;
  index: number;
  accent: string;
  onPress: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function ModuleCard({ module, index, accent, onPress }: Props) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const totalLectures = module.subjects.reduce((sum, s) => sum + s.lectures.length, 0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, animStyle]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 20 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 20 }); }}
      activeOpacity={1}
    >
      {/* Left accent stripe */}
      <View style={[styles.stripe, { backgroundColor: accent }]} />

      <View style={styles.inner}>
        <View style={[styles.indexBadge, { backgroundColor: accent + "20" }]}>
          <Text style={[styles.indexText, { color: accent }]}>{index + 1}</Text>
        </View>

        <View style={styles.text}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
            {module.name}
          </Text>
          <View style={styles.meta}>
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {module.subjects.length} subjects
            </Text>
            {totalLectures > 0 && (
              <>
                <Text style={[styles.dot, { color: colors.mutedForeground }]}>·</Text>
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  {totalLectures} lectures
                </Text>
              </>
            )}
          </View>
        </View>

        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  stripe: {
    width: 4,
    alignSelf: "stretch",
  },
  inner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  indexBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  indexText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  text: { flex: 1, gap: 3 },
  title: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  dot: { fontSize: 12 },
});
