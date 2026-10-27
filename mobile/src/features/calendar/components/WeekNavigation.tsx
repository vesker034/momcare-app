import { formatPregnancyWeekTitle } from '../../../shared/utils/pregnancyTerm';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../shared/components';
import { colors, radius, spacing } from '../../../shared/theme';

type WeekNavigationProps = {
  week: number;
  onSelectWeek: (week: number) => void;
};

export function WeekNavigation({ week, onSelectWeek }: WeekNavigationProps) {
  const hasPrevious = week > 1;
  const hasNext = week < 42;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={hasPrevious ? `Предыдущая неделя, ${week - 1}` : 'Предыдущая неделя недоступна'}
        accessibilityRole="button"
        accessibilityState={{ disabled: !hasPrevious }}
        disabled={!hasPrevious}
        onPress={() => onSelectWeek(week - 1)}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="chevron-left" size={24} color={hasPrevious ? colors.primary : colors.textMuted} />
        {hasPrevious ? (
          <AppText variant="bodySmall" color={colors.primary}>{formatPregnancyWeekTitle(week - 1)}</AppText>
        ) : null}
      </Pressable>
      <AppText variant="label" color={colors.textPrimary}>{formatPregnancyWeekTitle(week)}</AppText>
      <Pressable
        accessibilityLabel={hasNext ? `Следующая неделя, ${week + 1}` : 'Следующая неделя недоступна'}
        accessibilityRole="button"
        accessibilityState={{ disabled: !hasNext }}
        disabled={!hasNext}
        onPress={() => onSelectWeek(week + 1)}
        style={({ pressed }) => [styles.button, styles.next, pressed && styles.pressed]}
      >
        {hasNext ? (
          <AppText variant="bodySmall" color={colors.primary}>{formatPregnancyWeekTitle(week + 1)}</AppText>
        ) : null}
        <MaterialCommunityIcons name="chevron-right" size={24} color={hasNext ? colors.primary : colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  button: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xxs,
    minHeight: 44,
    paddingHorizontal: spacing.xxs,
  },
  next: {
    justifyContent: 'flex-end',
  },
  pressed: {
    opacity: 0.76,
  },
});
