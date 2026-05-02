import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { Lecture } from "@/types";

interface Props {
  lecture: Lecture;
  index: number;
  onPress: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function LectureCard({ lecture, index, onPress }: Props) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }, animStyle]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.98, { damping: 20 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 20 }); }}
      activeOpacity={1}
    >
      <View style={[styles.indexBadge, { backgroundColor: colors.muted }]}>
        <Text style={[styles.indexText, { color: colors.mutedForeground }]}>{index + 1}</Text>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
        {lecture.name}
      </Text>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  indexText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    letterSpacing: -0.2,
    lineHeight: 20,
  },
});
