import { formatPregnancyWeekTitle } from '../../../shared/utils/pregnancyTerm';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { AppText, Card } from '../../../shared/components';
import { colors, radius, spacing } from '../../../shared/theme';
import { getDailyTip } from '../../../services/api/diaryApi';
import type { DailyTipResponse } from '../../../types/api';
import { toDateKey } from '../utils/diaryDates';

const FALLBACK_TITLE = 'Спокойный ритм дня';
const FALLBACK_TEXT =
  'Уделите сегодня немного времени отдыху и наблюдайте за самочувствием. При появлении вопросов о здоровье обсудите их с врачом.';

export function DailyTipCard() {
  const [tip, setTip] = useState<DailyTipResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getDailyTip(toDateKey(new Date()));
      setTip(response);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (isLoading) {
    return (
      <Card shadow="none" style={styles.adviceCard}>
        <View style={styles.adviceBadge}>
          <AppText variant="caption" color={colors.white} serif>
            Совет дня
          </AppText>
        </View>
        <AppText variant="bodySmall" color={colors.primaryDark}>
          Загружаем совет дня...
        </AppText>
      </Card>
    );
  }

  if (error || !tip) {
    return (
      <Card shadow="none" style={styles.adviceCard}>
        <View style={styles.adviceBadge}>
          <AppText variant="caption" color={colors.white} serif>
            Совет дня
          </AppText>
        </View>
        <AppText variant="subtitle" color={colors.primaryDark}>
          {FALLBACK_TITLE}
        </AppText>
        <AppText variant="bodySmall" color={colors.primaryDark}>
          {FALLBACK_TEXT}
        </AppText>
      </Card>
    );
  }

  return (
    <Card shadow="none" style={styles.adviceCard}>
      <View style={styles.adviceBadge}>
        <AppText variant="caption" color={colors.white} serif>
          Совет дня
        </AppText>
      </View>

      {tip.pregnancyWeek !== null ? (
        <View style={styles.weekRow}>
          <MaterialCommunityIcons
            name="calendar-heart"
            size={16}
            color={colors.primaryDark}
          />
          <AppText variant="caption" color={colors.primaryDark} serif>
            {formatPregnancyWeekTitle(tip.pregnancyWeek)}
          </AppText>
        </View>
      ) : null}

      <AppText variant="subtitle" color={colors.primaryDark}>
        {tip.title}
      </AppText>
      <AppText variant="bodySmall" color={colors.primaryDark}>
        {tip.text}
      </AppText>
    </Card>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Не удалось загрузить совет дня.';
}

const styles = StyleSheet.create({
  adviceCard: {
    backgroundColor: colors.lavenderSoft,
    borderColor: colors.borderSoft,
    gap: spacing.md,
    padding: spacing.xl,
  },
  adviceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryDark,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  weekRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
