import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { AnsweredState } from "@/types";

interface Props {
  text: string;
  index: number;
  answered: AnsweredState | null;
  onSelect: (i: number) => void;
}

export function OptionButton({ text, index, answered, onSelect }: Props) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  let bgColor = colors.card;
  let borderColor = colors.border;
  let textColor = colors.foreground;

  if (answered) {
    if (index === answered.correct) {
      bgColor = "#d1fae5"; borderColor = "#6ee7b7"; textColor = "#065f46";
    } else if (index === answered.selected && index !== answered.correct) {
      bgColor = "#fee2e2"; borderColor = "#fca5a5"; textColor = "#991b1b";
    } else {
      bgColor = colors.muted; borderColor = colors.border; textColor = colors.mutedForeground;
    }
  }

  const label = String.fromCharCode(65 + index);

  const labelBg = answered && index === answered.correct
    ? "#6ee7b7"
    : answered && index === answered.selected
    ? "#fca5a5"
    : colors.muted;

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[styles.option, { backgroundColor: bgColor, borderColor }]}
        onPress={() => {
          if (answered) return;
          scale.value = withSpring(0.97, { damping: 20 });
          setTimeout(() => { scale.value = withSpring(1, { damping: 20 }); }, 150);
          onSelect(index);
        }}
        activeOpacity={0.85}
        disabled={!!answered}
      >
        <View style={[styles.optionLabel, { backgroundColor: labelBg }]}>
          <Text style={[styles.optionLabelText, { color: textColor }]}>{label}</Text>
        </View>
        <Text style={[styles.optionText, { color: textColor }]}>{text}</Text>
        {answered && index === answered.correct && (
          <Feather name="check-circle" size={18} color="#059669" />
        )}
        {answered && index === answered.selected && index !== answered.correct && (
          <Feather name="x-circle" size={18} color="#dc2626" />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  optionLabel: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabelText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  optionText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", lineHeight: 20 },
});
