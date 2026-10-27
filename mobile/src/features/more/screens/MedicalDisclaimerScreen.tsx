import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Header,
  IconButton,
  Screen,
} from '../../../shared/components';
import { colors, spacing } from '../../../shared/theme';

export function MedicalDisclaimerScreen() {
  return (
    <Screen contentStyle={styles.scrollContent} style={styles.container}>
      <Header
        title="Медицинский дисклеймер"
        left={
          <IconButton
            icon={
              <AppText variant="subtitle" color={colors.primary}>
                ‹
              </AppText>
            }
            label="Назад"
            onPress={() => router.back()}
          />
        }
      />

      <View style={styles.content}>
        <AppText variant="subtitle">
          Медицинский дисклеймер
        </AppText>

        <AppText variant="body">
          Информация в Mamelia носит исключительно справочный характер и не заменяет
          консультацию врача.
        </AppText>

        <AppText variant="body">
          Mamelia не ставит диагнозы.
        </AppText>

        <AppText variant="body">
          Mamelia не интерпретирует результаты анализов.
        </AppText>
        
        <AppText variant="body">
          Mamelia не назначает лечение.
        </AppText>

        <AppText variant="body">
          При ухудшении самочувствия немедленно обратитесь к врачу или другому
          квалифицированному медицинскому специалисту.
        </AppText>
      </View>
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
  content: {
    gap: spacing.lg,
  },
});