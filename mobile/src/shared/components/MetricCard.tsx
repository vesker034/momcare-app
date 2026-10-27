import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius, spacing } from '../theme';
import { AppText } from './AppText';
import { ProgressBar } from './ProgressBar';

type MetricCardProps = ViewProps & {
  label: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
  progress?: number;
  tone?: 'rose' | 'peach' | 'lavender' | 'neutral';
};

export function MetricCard({
  label,
  value,
  helper,
  icon,
  progress,
  tone = 'neutral',
  style,
  ...props
}: MetricCardProps) {
  return (
    <View {...props} style={[styles.card, styles[tone], style]}>
      <View style={styles.header}>
        {icon}
        <AppText variant="caption" color={colors.primary} serif>
          {label}
        </AppText>
      </View>
      <AppText variant="subtitle">{value}</AppText>
      {helper ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {helper}
        </AppText>
      ) : null}
      {typeof progress === 'number' ? (
        <ProgressBar value={progress} height={4} fillColor={colors.primary} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    gap: spacing.sm,
    minHeight: 112,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  neutral: {
    backgroundColor: colors.surfaceMuted,
  },
  rose: {
    backgroundColor: colors.surfaceRose,
  },
  peach: {
    backgroundColor: colors.peachSoft,
  },
  lavender: {
    backgroundColor: colors.lavenderSoft,
  },
});
