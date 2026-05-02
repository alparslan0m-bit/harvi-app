import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface DayData {
  day: string;
  count: number;
}

interface Props {
  data: DayData[];
}

export function WeeklyChart({ data }: Props) {
  const colors = useColors();
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <View style={styles.container}>
      {data.map((item, i) => {
        const height = Math.max((item.count / maxCount) * 60, 4);
        const isActive = item.count > 0;
        return (
          <View key={i} style={styles.barWrapper}>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: isActive ? colors.primary : colors.muted,
                    borderRadius: 6,
                  },
                ]}
              />
            </View>
            <Text style={[styles.dayLabel, { color: colors.mutedForeground }]}>
              {item.day}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 80,
    gap: 6,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  barContainer: {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
    alignItems: "center",
  },
  bar: {
    width: "100%",
  },
  dayLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
