import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../theme';
import { AppText } from './AppText';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  helper?: string;
};

export function SectionHeader({
  title,
  actionLabel,
  helper,
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleGroup}>
        <AppText variant="subtitle">{title}</AppText>
        {helper ? (
          <AppText variant="bodySmall" color={colors.textSecondary}>
            {helper}
          </AppText>
        ) : null}
      </View>
      {actionLabel ? (
        <AppText variant="bodySmall" color={colors.primary}>
          {actionLabel}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    width: '100%',
  },
  titleGroup: {
    flex: 1,
    gap: spacing.xs,
  },
});
