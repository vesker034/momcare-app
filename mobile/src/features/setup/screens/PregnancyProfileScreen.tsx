import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Input, Screen } from '../../../shared/components';
import { colors, spacing } from '../../../shared/theme';

export function PregnancyProfileScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Профиль беременности</AppText>
        <AppText color={colors.textMuted}>
          Эти данные нужны только для локального расчёта срока в MVP.
        </AppText>
      </View>

      <Card style={styles.form}>
        <Input label="Дата последних месячных" placeholder="ДД.ММ.ГГГГ" />
        <Input label="Средняя длина цикла" placeholder="Например, 28" />
        <Button title="Далее" onPress={() => router.push('/setup/due-date')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
});
