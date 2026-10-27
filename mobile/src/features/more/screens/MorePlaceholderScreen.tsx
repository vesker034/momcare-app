import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Header,
  IconButton,
  Screen,
} from '../../../shared/components';
import { colors, spacing } from '../../../shared/theme';

type MorePlaceholderScreenProps = {
  title: string;
  description?: string;
  icon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
  backTo?: string;
};

export function MorePlaceholderScreen({
  title,
  description = 'Раздел будет добавлен позже.',
  icon = 'dots-horizontal-circle-outline',
  backTo = '/tabs/more',
}: MorePlaceholderScreenProps) {
  return (
    <Screen contentStyle={styles.scrollContent} style={styles.container}>
      <Header
        title={title}
        left={
          <IconButton
            icon={<AppText variant="subtitle" color={colors.primary}>‹</AppText>}
            label="Назад"
            onPress={() => router.push(backTo)}
          />
        }
      />

      <Card style={styles.card}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={42} color={colors.primary} />
        </View>
        <AppText variant="subtitle" align="center">
          {title}
        </AppText>
        <AppText variant="bodySmall" color={colors.textSecondary} align="center">
          {description}
        </AppText>
        <Button
          title="Назад"
          variant="outline"
          onPress={() => router.push(backTo)}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    gap: spacing.xl,
    paddingBottom: 120,
    paddingTop: spacing.sm,
  },
  card: {
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRose,
    borderRadius: 999,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
});
