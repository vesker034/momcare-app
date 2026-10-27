import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppText } from '../../../shared/components';
import { colors, radius, spacing } from '../../../shared/theme';
import type { SleepQuality } from '../../../types/api';

const SLEEP_STEP_HOURS = 0.5;
const SLEEP_MIN_HOURS = 0;
const SLEEP_MAX_HOURS = 24;

const sleepQualityOptions: Array<{ id: SleepQuality; label: string }> = [
  { id: 'POOR', label: 'Плохо' },
  { id: 'FAIR', label: 'Средне' },
  { id: 'GOOD', label: 'Хорошо' },
  { id: 'EXCELLENT', label: 'Отлично' },
];

type SleepSectionProps = {
  sleepHours: number;
  sleepQuality: SleepQuality;
  onSleepHoursChange: (hours: number) => void;
  onSleepQualityChange: (quality: SleepQuality) => void;
};

export function SleepSection({
  sleepHours,
  sleepQuality,
  onSleepHoursChange,
  onSleepQualityChange,
}: SleepSectionProps) {
  return (
    <>
      <View style={styles.metricCard}>
        <View style={styles.metricTitle}>
          <MaterialCommunityIcons
            name="moon-waning-crescent"
            size={18}
            color={colors.primary}
          />
          <AppText variant="bodySmall" color={colors.primary} serif>
            Сон
          </AppText>
        </View>

        <View style={styles.sleepStepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Уменьшить сон на 30 минут"
            disabled={sleepHours <= SLEEP_MIN_HOURS}
            onPress={() =>
              onSleepHoursChange(clampSleepHours(sleepHours - SLEEP_STEP_HOURS))
            }
            style={[
              styles.sleepStepButton,
              sleepHours <= SLEEP_MIN_HOURS && styles.sleepStepButtonDisabled,
            ]}
          >
            <MaterialCommunityIcons name="minus" size={22} color={colors.primary} />
          </Pressable>

          <View style={styles.sleepValueWrapper}>
            <AppText variant="title" align="center">
              {formatSleepHoursLabel(sleepHours)}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} align="center">
              шаг 30 мин
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Увеличить сон на 30 минут"
            disabled={sleepHours >= SLEEP_MAX_HOURS}
            onPress={() =>
              onSleepHoursChange(clampSleepHours(sleepHours + SLEEP_STEP_HOURS))
            }
            style={[
              styles.sleepStepButton,
              sleepHours >= SLEEP_MAX_HOURS && styles.sleepStepButtonDisabled,
            ]}
          >
            <MaterialCommunityIcons name="plus" size={22} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.formSection}>
        <AppText variant="label" color={colors.primary} uppercase>
          Качество сна
        </AppText>
        <View style={styles.qualityRow}>
          {sleepQualityOptions.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => onSleepQualityChange(option.id)}
              style={[
                styles.qualityChip,
                sleepQuality === option.id && styles.qualityChipSelected,
              ]}
            >
              <AppText
                variant="bodySmall"
                color={
                  sleepQuality === option.id
                    ? colors.primary
                    : colors.textSecondary
                }
                serif
              >
                {option.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>
    </>
  );
}

function clampSleepHours(value: number): number {
  if (Number.isNaN(value)) return SLEEP_MIN_HOURS;
  const stepped = Math.round(value / SLEEP_STEP_HOURS) * SLEEP_STEP_HOURS;
  return Math.min(SLEEP_MAX_HOURS, Math.max(SLEEP_MIN_HOURS, stepped));
}

function formatSleepHoursLabel(value: number): string {
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  if (minutes === 0) return `${hours} ч`;
  return `${hours} ч ${minutes} мин`;
}

const styles = StyleSheet.create({
  formSection: {
    gap: spacing.md,
  },
  metricCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xl,
    flex: 1,
    gap: spacing.md,
    minHeight: 116,
    padding: spacing.lg,
  },
  metricTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sleepStepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  sleepStepButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sleepStepButtonDisabled: {
    opacity: 0.4,
  },
  sleepValueWrapper: {
    flex: 1,
    gap: spacing.xxs,
  },
  qualityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  qualityChip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: 'transparent',
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  qualityChipSelected: {
    backgroundColor: colors.surfaceRose,
    borderColor: colors.pink,
  },
});