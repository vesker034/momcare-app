import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import {
  AppText,
  Button,
  Card,
  Header,
  IconButton,
  Screen,
} from '../../../src/shared/components';
import {
  deleteDiaryEntry,
  getDiaryEntryById,
  updateDiaryEntry,
} from '../../../src/services/api/diaryApi';
import { colors, radius, spacing } from '../../../src/shared/theme';
import {
  formatDiaryDate,
  getDiaryMeasurementErrors,
  toUpdateDiaryEntryRequest,
} from '../../../src/features/diary/mappers/diaryMappers';
import { useDiaryForm } from '../../../src/features/diary/hooks/useDiaryForm';
import { MoodSelector } from '../../../src/features/diary/components/MoodSelector';
import { SymptomSelector } from '../../../src/features/diary/components/SymptomSelector';
import { SleepSection } from '../../../src/features/diary/components/SleepSection';
import { WaterTrackerCard } from '../../../src/features/diary/components/WaterTrackerCard';
import { BodyMeasurements } from '../../../src/features/diary/components/BodyMeasurements';
import type { DiaryEntry, MedicationStatus } from '../../../src/types/api';

type EntryRouteParams = {
  entryId?: string;
  returnTo?: string;
};

const medicationOptions: Array<{ id: MedicationStatus; label: string }> = [
  { id: 'NOT_APPLICABLE', label: 'Не нужно' },
  { id: 'ON_TIME', label: 'Вовремя' },
  { id: 'LATE', label: 'Опоздала' },
  { id: 'MISSED', label: 'Пропустила' },
];

const wellbeingLabels: Record<number, string> = {
  1: 'Очень плохо',
  2: 'Плохо',
  3: 'Нормально',
  4: 'Хорошо',
  5: 'Отлично',
};

const energyLabels: Record<number, string> = {
  1: 'Сил почти нет',
  2: 'Мало энергии',
  3: 'Средне',
  4: 'Достаточно энергии',
  5: 'Много энергии',
};

export default function DiaryEntryDetailsScreen() {
  const { entryId, returnTo } = useLocalSearchParams<EntryRouteParams>();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useNavigation();
  const allowNavigationRef = useRef(false);
  const loadRequestId = useRef(0);

  const {
    state: form,
    isDirty,
    setWellbeingRating,
    setSleepHours,
    setSleepQuality,
    setEnergyLevel,
    setWaterMl,
    setMedicationStatus,
    setWeightKg,
    setBasalTemperatureC,
    setNote,
    setOtherSymptomText,
    toggleMood,
    toggleSymptom,
    toggleNoSymptoms,
    setSeverity,
    applyEntryToForm,
    buildPayload,
  } = useDiaryForm();

  const measurementErrors = useMemo(
    () => getDiaryMeasurementErrors(form.weightKg, form.basalTemperatureC),
    [form.basalTemperatureC, form.weightKg],
  );

  const performGoBack = useCallback(() => {
    allowNavigationRef.current = true;
    if (router.canGoBack()) {
      router.back();
    } else if (returnTo === '/tabs/diary/all') {
      router.replace('/tabs/diary/all');
    } else {
      router.replace('/tabs/diary');
    }
  }, [returnTo]);

  const handleGoBack = useCallback(() => {
    if (!isDirty) {
      performGoBack();
      return;
    }

    Alert.alert(
      'Несохранённые изменения',
      'Изменения записи не сохранены. Выйти без сохранения?',
      [
        { text: 'Остаться', style: 'cancel' },
        { text: 'Выйти', style: 'destructive', onPress: performGoBack },
      ],
    );
  }, [isDirty, performGoBack]);

  useEffect(() => {
    if (!isDirty) return undefined;

    return navigation.addListener('beforeRemove', (event) => {
      if (allowNavigationRef.current) return;
      event.preventDefault();
      Alert.alert(
        'Несохранённые изменения',
        'Изменения записи не сохранены. Выйти без сохранения?',
        [
          { text: 'Остаться', style: 'cancel' },
          {
            text: 'Выйти',
            style: 'destructive',
            onPress: () => {
              allowNavigationRef.current = true;
              navigation.dispatch(event.data.action);
            },
          },
        ],
      );
    });
  }, [isDirty, navigation]);

  const loadEntry = useCallback(async () => {
    if (!entryId) {
      setError('Не указан идентификатор записи.');
      setIsLoading(false);
      return;
    }

    const requestId = ++loadRequestId.current;
    setIsLoading(true);
    setError('');

    try {
      const response = await getDiaryEntryById(entryId);
      const targetEntry = response.entry || response;

      if (requestId !== loadRequestId.current) return;
      setEntry(targetEntry);
      applyEntryToForm(targetEntry);
    } catch (loadError) {
      if (requestId === loadRequestId.current) {
        setError(getErrorMessage(loadError));
      }
    } finally {
      if (requestId === loadRequestId.current) {
        setIsLoading(false);
      }
    }
  }, [applyEntryToForm, entryId]);

  useFocusEffect(
    useCallback(() => {
      if (!isDirty) {
        void loadEntry();
      }
      return () => {
        loadRequestId.current += 1;
      };
    }, [isDirty, loadEntry]),
  );


  async function handleSave() {
    if (!entryId) return;
    if (form.selectedMoods.length === 0) {
      setSubmitError('Выберите хотя бы одно настроение');
      return;
    }
    const measurementError =
      measurementErrors.weightKg ?? measurementErrors.basalTemperatureC;
    if (measurementError) {
      setSubmitError(measurementError);
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');

    const { formValues, symptomsWithSeverity } = buildPayload();

    try {
      const requestBase = toUpdateDiaryEntryRequest(formValues);

      const requestWithSeverity = {
        ...requestBase,
        symptoms: symptomsWithSeverity,
      };

      await updateDiaryEntry(entryId, requestWithSeverity);
      performGoBack();
    } catch (saveError) {
      setSubmitError(getErrorMessage(saveError));
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Удалить запись?', 'Запись дневника будет удалена без восстановления.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          void handleDelete();
        },
      },
    ]);
  }

  async function handleDelete() {
    if (!entryId) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await deleteDiaryEntry(entryId);
      performGoBack();
    } catch (deleteError) {
      setSubmitError(getErrorMessage(deleteError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || error || !entry) {
    return (
      <Screen style={styles.container}>
        <Header
          title="Запись дневника"
          left={
            <IconButton
              icon={<AppText variant="subtitle" color={colors.primary}>‹</AppText>}
              label="Назад"
              onPress={handleGoBack}
            />
          }
        />
        <Card variant="muted" shadow="none" style={styles.card}>
          <AppText variant="body" color={error ? colors.danger : colors.textSecondary}>
            {isLoading ? 'Загружаем запись дневника...' : error || 'Запись не найдена.'}
          </AppText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.scrollContent} style={styles.container}>
      <Header
        title="Запись дневника"
        subtitle={formatDiaryDate(entry.date)}
        left={
          <IconButton
            icon={<AppText variant="subtitle" color={colors.primary}>‹</AppText>}
            label="Назад"
            onPress={handleGoBack}
          />
        }
      />

      <Card style={styles.card}>
        <View style={styles.section}>
          <AppText variant="label" color={colors.primary} uppercase>
            Общее самочувствие: {form.wellbeingRating}/5
          </AppText>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((rating) => {
              const isSelected = form.wellbeingRating === rating;
              return (
                <Pressable
                  key={rating}
                  onPress={() => setWellbeingRating(rating)}
                  style={styles.ratingColumn}
                >
                  <View
                    style={[
                      styles.ratingItem,
                      isSelected && styles.ratingItemSelected,
                    ]}
                  >
                    <AppText
                      variant="body"
                      color={isSelected ? colors.white : colors.textSecondary}
                    >
                      {rating}
                    </AppText>
                  </View>
                  <AppText
                    variant="caption"
                    align="center"
                    color={isSelected ? colors.primary : colors.textSecondary}
                    serif
                  >
                    {wellbeingLabels[rating]}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <MoodSelector selectedMoods={form.selectedMoods} onToggle={toggleMood} />

        <SymptomSelector
          selectedSymptoms={form.selectedSymptoms}
          symptomSeverities={form.symptomSeverities}
          noSymptoms={form.noSymptoms}
          otherSymptomText={form.otherSymptomText}
          onToggle={toggleSymptom}
          onSetSeverity={setSeverity}
          onToggleNoSymptoms={toggleNoSymptoms}
          onOtherTextChange={setOtherSymptomText}
        />

        <SleepSection
          sleepHours={form.sleepHours}
          sleepQuality={form.sleepQuality}
          onSleepHoursChange={setSleepHours}
          onSleepQualityChange={setSleepQuality}
        />

        <View style={styles.metricCard}>
          <View style={styles.metricTitle}>
            <MaterialCommunityIcons
              name="lightning-bolt-outline"
              size={18}
              color={colors.primary}
            />
            <AppText variant="bodySmall" color={colors.primary} serif>
              Энергия: {form.energyLevel}/5
            </AppText>
          </View>

          <View style={styles.energyList}>
            {[1, 2, 3, 4, 5].map((level) => {
              const isSelected = form.energyLevel === level;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Энергия ${level} из 5: ${energyLabels[level]}`}
                  key={level}
                  onPress={() => setEnergyLevel(level)}
                  style={[
                    styles.energyItem,
                    isSelected && styles.energyItemSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.energyBadge,
                      isSelected && styles.energyBadgeSelected,
                    ]}
                  >
                    <AppText
                      variant="caption"
                      color={isSelected ? colors.white : colors.primary}
                    >
                      {level}
                    </AppText>
                  </View>
                  <AppText
                    variant="caption"
                    color={isSelected ? colors.primary : colors.textSecondary}
                    serif
                  >
                    {energyLabels[level]}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>




        <View style={styles.section}>
          <AppText variant="label" color={colors.primary} uppercase>
            Прием лекарств
          </AppText>

          <View style={styles.medicationList}>
            {medicationOptions.map((option) => {
              const isSelected = form.medicationStatus === option.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={option.label}
                  key={option.id}
                  onPress={() => setMedicationStatus(option.id)}
                  style={[
                    styles.medicationItem,
                    isSelected && styles.medicationItemSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.medicationRadio,
                      isSelected && styles.medicationRadioSelected,
                    ]}
                  >
                    {isSelected ? (
                      <MaterialCommunityIcons
                        name="check"
                        size={14}
                        color={colors.white}
                      />
                    ) : null}
                  </View>
                  <AppText
                    variant="bodySmall"
                    color={isSelected ? colors.primary : colors.textSecondary}
                    serif
                  >
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>


        </View>

        <BodyMeasurements
          weightKg={form.weightKg}
          basalTemperatureC={form.basalTemperatureC}
          onWeightChange={setWeightKg}
          onBasalTemperatureChange={setBasalTemperatureC}
          weightError={measurementErrors.weightKg}
          basalTemperatureError={measurementErrors.basalTemperatureC}
        />

        <WaterTrackerCard
          waterMl={form.waterMl}
          onChange={setWaterMl}
          disabled={isSubmitting}
        />

        <View style={styles.section}>
          <AppText variant="label" color={colors.primary} uppercase>
            Заметка
          </AppText>
          <TextInput
            accessibilityLabel="Заметка"
            multiline
            onChangeText={setNote}
            placeholder="Что важно запомнить сегодня?"
            placeholderTextColor={colors.textMuted}
            style={styles.noteInput}
            textAlignVertical="top"
            value={form.note}
          />
        </View>

        <Button
          leftIcon={
            <MaterialCommunityIcons
              name="content-save-outline"
              size={22}
              color={colors.white}
            />
          }
          title={isSubmitting ? 'Сохраняем...' : 'Сохранить изменения'}
          disabled={isSubmitting}
          onPress={handleSave}
        />
        <Button
          leftIcon={
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={22}
              color={colors.primary}
            />
          }
          title="Удалить запись"
          variant="outline"
          disabled={isSubmitting}
          onPress={confirmDelete}
        />
        {submitError ? (
          <AppText variant="bodySmall" color={colors.danger}>
            {submitError}
          </AppText>
        ) : null}
      </Card>
    </Screen>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось выполнить действие. Попробуйте ещё раз.';
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
    gap: spacing.xl,
    padding: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  ratingItem: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  ratingItemSelected: {
    backgroundColor: colors.primary,
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
  energyList: {
    gap: spacing.xs,
  },
  energyItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  energyItemSelected: {
    backgroundColor: colors.surfaceRose,
    borderColor: colors.pink,
  },
  energyBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  energyBadgeSelected: {
    backgroundColor: colors.primary,
  },
  noteInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 110,
    padding: spacing.lg,
  },
  ratingColumn: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  medicationList: {
    gap: spacing.xs,
  },
  medicationItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  medicationItemSelected: {
    backgroundColor: colors.surfaceRose,
    borderColor: colors.pink,
  },
  medicationRadio: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  medicationRadioSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
