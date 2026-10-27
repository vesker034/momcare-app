import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius } from '../theme';

type ProgressBarProps = {
  value: number;
  max?: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
  style?: ViewStyle;
};

export function ProgressBar({
  value,
  max = 100,
  height = 10,
  trackColor = colors.surfaceMuted,
  fillColor = colors.pink,
  style,
}: ProgressBarProps) {
  const progress = Math.min(Math.max(value / max, 0), 1);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}
      style={[
        styles.track,
        { backgroundColor: trackColor, borderRadius: height, height },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            backgroundColor: fillColor,
            borderRadius: height,
            width: `${progress * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    minWidth: radius.xs,
  },
});
