import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';

type EmptyStateProps = {
  title: string;
  description?: string;
  actionTitle?: string;
  onActionPress?: () => void;
};

export function EmptyState({
  title,
  description,
  actionTitle,
  onActionPress,
}: EmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <AppText variant="subtitle">{title}</AppText>
      {description ? (
        <AppText color={colors.textMuted} style={styles.description}>
          {description}
        </AppText>
      ) : null}
      {actionTitle && onActionPress ? (
        <Button title={actionTitle} onPress={onActionPress} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  description: {
    maxWidth: 320,
  },
});
