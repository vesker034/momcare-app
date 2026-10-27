import { formatPregnancyTerm, formatWeeksRemaining } from '../../../shared/utils/pregnancyTerm';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import {
  AppText,
  Button,
  Card,
  ProgressBar,
  Screen,
} from '../../../shared/components';
import { colors, radius, shadows, spacing } from '../../../shared/theme';
import { getPregnancyProfile } from '../../../services/api/pregnancyProfileApi';
import { getPregnancyWeekContent } from '../../../services/api/pregnancyWeeksApi';
import type { PregnancyProfile, PregnancyWeekContent } from '../../../types/api';

const profileAvatar = require('../../../../assets/images/profile-avatar.png');

export function CalculationResultScreen() {
  const { height } = useWindowDimensions();
  const isCompact = height < 760;
  const [profile, setProfile] = useState<PregnancyProfile | null>(null);
  const [content, setContent] = useState<PregnancyWeekContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    setContent(null);
    void (async () => {
      try {
        const response = await getPregnancyProfile();
        if (!active) return;
        setProfile(response.profile);
        if (!response.profile) setError('Профиль беременности ещё не заполнен.');
        const week = response.profile?.pregnancyWeek;
        if (week) {
          try {
            const result = await getPregnancyWeekContent(week);
            if (active) setContent(result.content);
          } catch { /* Week content is optional; the saved term is still available. */ }
        }
      } catch (failure) {
        if (active) setError(failure instanceof Error ? failure.message : 'Не удалось загрузить результат.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [reload]));

  if (loading || error || !profile) {
    return (
      <Screen>
        <AppText>{loading ? 'Загружаем результат...' : error}</AppText>
        {!loading ? <Button title="Повторить" onPress={() => setReload(value => value + 1)} /> : null}
        <Button title="Изменить данные" onPress={() => router.replace('/setup/due-date')} />
      </Screen>
    );
  }
  const currentWeek = profile.pregnancyWeek ?? 0;
  const pregnancyDay = profile.pregnancyDay ?? 0;
  const trimester = `${['I', 'II', 'III'][(profile.trimester ?? 1) - 1]} триместр`;
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const weeksLeft = Math.max(0, Math.ceil((Date.parse(`${profile.dueDate}T00:00:00Z`) - todayUtc) / 604800000));
  const dueDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${profile.dueDate}T00:00:00Z`));
  const fruitSize = content?.fruitComparison ? `Как ${content.fruitComparison}` : content?.babySize;
  const progress = Math.min(currentWeek, 42);

  return (
    <Screen
      contentStyle={styles.scrollContent}
      style={[styles.container, isCompact && styles.compactContainer]}
    >
      <View style={styles.hero}>
        <View style={styles.avatarFrame}>
          <Image source={profileAvatar} style={styles.avatar} />
          <View style={styles.checkBadge}>
            <AppText variant="bodySmall" color={colors.primary} align="center">
              ✓
            </AppText>
          </View>
        </View>

        <View style={styles.copy}>
          <AppText variant="title" align="center" style={styles.title}>
            Это прекрасное время!
          </AppText>
          <AppText variant="body" color={colors.textSecondary} align="center">
            Ваше путешествие уже началось. Мы будем рядом на каждом этапе.
          </AppText>
        </View>
      </View>

      <Card style={styles.resultCard}>
        <AppText variant="label" color={colors.primary} align="center" uppercase>
          Ваш текущий срок
        </AppText>
        <AppText variant="title" align="center">
          {formatPregnancyTerm(currentWeek, pregnancyDay)}
        </AppText>

        <View style={styles.progressLabels}>
          <AppText variant="caption" color={colors.textSecondary}>
            {trimester}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {formatWeeksRemaining(weeksLeft)}
          </AppText>
        </View>

        <ProgressBar
          value={progress}
          max={42}
          height={14}
          fillColor={colors.primary}
          trackColor={colors.surfaceMuted}
        />

        <View style={styles.metrics}>
          <ResultMetric icon="calendar-month-outline" label="Дата родов" value={dueDate} />
          {fruitSize ? <ResultMetric icon="baby-face-outline" label="Размер плода" value={fruitSize} /> : null}
        </View>
      </Card>

      {content?.babyDevelopment ? <View style={styles.weekInfoCard}>
        <View style={styles.weekInfoIcon}>
          <MaterialCommunityIcons
            name="lightbulb-on-outline"
            size={24}
            color={colors.primaryDark}
          />
        </View>
        <View style={styles.weekInfoCopy}>
          <AppText variant="subtitle" color={colors.primaryDark}>
            На этом сроке
          </AppText>
          <AppText variant="bodySmall" color={colors.primaryDark}>
            {content.babyDevelopment}
          </AppText>
        </View>
      </View> : null}

      <View style={styles.actions}>
        <Button title="Всё верно" onPress={() => router.replace('/tabs/home')} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/setup/due-date')}
          style={styles.editAction}
        >
          <AppText variant="body" color={colors.primary}>
            ✎
          </AppText>
          <AppText variant="bodySmall" color={colors.primary} serif>
            Изменить данные
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

type ResultMetricProps = {
  icon: 'calendar-month-outline' | 'baby-face-outline';
  label: string;
  value: string;
};

function ResultMetric({ icon, label, value }: ResultMetricProps) {
  return (
    <View style={styles.metricCard}>
      <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
      <AppText variant="caption" color={colors.textSecondary} align="center">
        {label}
      </AppText>
      <AppText variant="subtitle" align="center">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    alignItems: 'center',
    gap: spacing.xxl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xl,
  },
  compactContainer: {
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.xl,
    width: '100%',
  },
  avatarFrame: {
    alignItems: 'center',
    backgroundColor: colors.peachSoft,
    borderColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 4,
    height: 128,
    justifyContent: 'center',
    width: 128,
    ...shadows.soft,
  },
  avatar: {
    borderRadius: radius.pill,
    height: 116,
    width: 116,
  },
  checkBadge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 2,
    bottom: 8,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 36,
    ...shadows.soft,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.md,
    maxWidth: 330,
  },
  title: {
    maxWidth: 340,
  },
  resultCard: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'center',
    paddingTop: spacing.lg,
  },
  metricCard: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.xxl,
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 132,
    padding: spacing.lg,
  },
  weekInfoCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.lavenderSoft,
    borderColor: colors.lavender,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.xl,
    width: '100%',
  },
  weekInfoIcon: {
    alignItems: 'center',
    backgroundColor: colors.lavender,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  weekInfoCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  actions: {
    gap: spacing.lg,
    marginTop: 'auto',
    width: '100%',
  },
  editAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 40,
  },
});
