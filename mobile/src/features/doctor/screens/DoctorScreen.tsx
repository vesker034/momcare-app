import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { MEDICAL_DISCLAIMER } from '../../../config/constants';
import { AppText, Button, Card, EmptyState, Input, Screen } from '../../../shared/components';
import { getDoctorQuestions } from '../../../services/api/doctorQuestionsApi';
import {
  createVisit,
  deleteVisit,
  getUpcomingVisits,
  getVisits,
  updateVisit,
} from '../../../services/api/visitsApi';
import { colors, radius, shadows, spacing } from '../../../shared/theme';
import type {
  CreateVisitRequest,
  DoctorQuestion,
  UpdateVisitRequest,
  Visit,
  VisitStatus,
} from '../../../types/api';
import {
  doctorReports,
  type DoctorReport,
} from '../data/doctorMockData';
import {
  doctorQuestionStatusLabels,
  formatCreatedAt,
  formatDateInput,
  formatTimeInput,
  formatVisitDateTime,
  toApiDateFromRuInput,
  validateDateInput,
  validateTimeInput,
  visitStatusLabels,
} from '../mappers/doctorMappers';

type VisitFormState = {
  title: string;
  specialist: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  preparationNotes: string;
  status: VisitStatus;
};

type VisitFormErrors = Partial<Record<keyof VisitFormState, string>>;

const emptyVisitForm: VisitFormState = {
  title: '',
  specialist: '',
  date: '',
  time: '',
  location: '',
  notes: '',
  preparationNotes: '',
  status: 'PLANNED',
};

const visitStatuses: VisitStatus[] = ['PLANNED', 'COMPLETED', 'CANCELLED'];

export function DoctorScreen() {
  const [upcomingVisit, setUpcomingVisit] = useState<Visit | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [questions, setQuestions] = useState<DoctorQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [visitForm, setVisitForm] = useState<VisitFormState>(emptyVisitForm);
  const [visitFormErrors, setVisitFormErrors] = useState<VisitFormErrors>({});
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [isSubmittingVisit, setIsSubmittingVisit] = useState(false);

  const loadDoctorData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const [upcomingResponse, visitsResponse, questionsResponse] = await Promise.all([
        getUpcomingVisits(),
        getVisits(),
        getDoctorQuestions(),
      ]);

      setUpcomingVisit(upcomingResponse.visits[0] ?? null);
      setVisits(visitsResponse.visits);
      setQuestions(questionsResponse.questions);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDoctorData();
    }, [loadDoctorData]),
  );

  function updateVisitForm<K extends keyof VisitFormState>(
    key: K,
    value: VisitFormState[K],
  ) {
    setVisitForm((current) => ({ ...current, [key]: value }));

    if (visitFormErrors[key]) {
      setVisitFormErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  function startEditingVisit(visit: Visit) {
    setEditingVisitId(visit.id);
    setVisitForm({
      title: visit.title,
      specialist: visit.specialist ?? '',
      date: toRuDateInput(visit.date),
      time: visit.time ?? '',
      location: visit.location ?? '',
      notes: visit.notes ?? '',
      preparationNotes: visit.preparationNotes ?? '',
      status: visit.status,
    });
    setSubmitError('');
    setVisitFormErrors({});
  }

  function cancelEditingVisit() {
    setEditingVisitId(null);
    setVisitForm(emptyVisitForm);
    setVisitFormErrors({});
    setSubmitError('');
  }

  async function handleSubmitVisit() {
    const errors = validateVisitForm(visitForm);

    setVisitFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmittingVisit(true);
    setSubmitError('');

    try {
      if (editingVisitId) {
        await updateVisit(editingVisitId, buildVisitUpdatePayload(visitForm));
      } else {
        await createVisit(buildVisitCreatePayload(visitForm));
      }

      cancelEditingVisit();
      await loadDoctorData();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmittingVisit(false);
    }
  }

  function confirmDeleteVisit(visit: Visit) {
    Alert.alert('Удалить визит?', visit.title, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          void handleDeleteVisit(visit.id);
        },
      },
    ]);
  }

  async function handleDeleteVisit(id: string) {
    try {
      await deleteVisit(id);
      await loadDoctorData();

      if (editingVisitId === id) {
        cancelEditingVisit();
      }
    } catch (error) {
      setLoadError(getErrorMessage(error));
    }
  }

  return (
    <Screen contentStyle={styles.scrollContent} style={styles.container}>
      <View style={styles.header}>
        <AppText variant="title">
          Врач
        </AppText>
        <AppText variant="bodySmall" color={colors.textSecondary}>
          Визиты, вопросы и отчёты
        </AppText>
      </View>

      {isLoading ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            Загружаем данные врача...
          </AppText>
        </Card>
      ) : null}

      {!isLoading && loadError ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <AppText variant="bodySmall" color={colors.danger}>
            {loadError}
          </AppText>
        </Card>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AppText variant="subtitle">Ближайший визит</AppText>
          {upcomingVisit?.time ? (
            <AppText variant="body" color={colors.primary}>
              {upcomingVisit.time}
            </AppText>
          ) : null}
        </View>

        {upcomingVisit ? (
          <Card style={styles.visitCard}>
            <View style={styles.visitHeader}>
              <View style={styles.visitCopy}>
                <AppText variant="cardTitle" color={colors.primary}>
                  {upcomingVisit.title}
                </AppText>
                <InfoRow icon="doctor" text={upcomingVisit.specialist ?? 'Специалист не указан'} />
                <InfoRow icon="calendar-month-outline" text={formatVisitDateTime(upcomingVisit)} />
                <InfoRow icon="map-marker-outline" text={upcomingVisit.location ?? 'Место не указано'} />
                <AppText variant="caption" color={colors.textSecondary}>
                  {visitStatusLabels[upcomingVisit.status]}
                </AppText>
                {upcomingVisit.notes ? (
                  <AppText variant="bodySmall" color={colors.textSecondary}>
                    {upcomingVisit.notes}
                  </AppText>
                ) : null}
                {upcomingVisit.preparationNotes ? (
                  <AppText variant="bodySmall" color={colors.textSecondary}>
                    Подготовка: {upcomingVisit.preparationNotes}
                  </AppText>
                ) : null}
              </View>
              <View style={styles.visitIcon}>
                <MaterialCommunityIcons
                  name="medical-bag"
                  size={22}
                  color={colors.primary}
                />
              </View>
            </View>

            <Button
              leftIcon={
                <MaterialCommunityIcons
                  name="clipboard-check-outline"
                  size={22}
                  color={colors.white}
                />
              }
              onPress={() => router.push('/tabs/doctor/prepare')}
              size="md"
              title="Подготовиться"
            />
          </Card>
        ) : (
          <Card variant="muted" shadow="none" style={styles.stateCard}>
            <EmptyState
              title="Ближайших визитов нет"
              description="Добавьте визит, чтобы Mamelia напомнила о приёме."
            />
          </Card>
        )}
      </View>

      <Card style={styles.visitFormCard}>
        <AppText variant="subtitle">
          {editingVisitId ? 'Редактировать визит' : 'Добавить визит'}
        </AppText>
        <Input
          label="Название"
          value={visitForm.title}
          onChangeText={(value) => updateVisitForm('title', value)}
          placeholder="Приём гинеколога"
          error={visitFormErrors.title}
          variant="filled"
        />
        <Input
          label="Специалист"
          value={visitForm.specialist}
          onChangeText={(value) => updateVisitForm('specialist', value)}
          placeholder="Акушер-гинеколог"
          variant="filled"
        />
        <View style={styles.formRow}>
          <Input
            label="Дата"
            value={visitForm.date}
            onChangeText={(value) => updateVisitForm('date', formatDateInput(value))}
            placeholder="дд.мм.гггг"
            keyboardType="number-pad"
            maxLength={10}
            error={visitFormErrors.date}
            variant="filled"
            containerStyle={styles.formHalf}
          />
          <Input
            label="Время"
            value={visitForm.time}
            onChangeText={(value) => updateVisitForm('time', formatTimeInput(value))}
            placeholder="10:30"
            keyboardType="number-pad"
            maxLength={5}
            error={visitFormErrors.time}
            variant="filled"
            containerStyle={styles.formHalf}
          />
        </View>
        <Input
          label="Место"
          value={visitForm.location}
          onChangeText={(value) => updateVisitForm('location', value)}
          placeholder="Клиника, кабинет"
          variant="filled"
        />
        <Input
          label="Заметки"
          value={visitForm.notes}
          onChangeText={(value) => updateVisitForm('notes', value)}
          placeholder="Что важно обсудить"
          variant="filled"
        />
        <Input
          label="Подготовка"
          value={visitForm.preparationNotes}
          onChangeText={(value) => updateVisitForm('preparationNotes', value)}
          placeholder="Анализы, документы, вопросы"
          variant="filled"
        />
        <View style={styles.statusRow}>
          {visitStatuses.map((status) => (
            <Pressable
              accessibilityRole="button"
              key={status}
              onPress={() => updateVisitForm('status', status)}
              style={[
                styles.statusChip,
                visitForm.status === status && styles.statusChipSelected,
              ]}
            >
              <AppText
                variant="caption"
                color={visitForm.status === status ? colors.primary : colors.textSecondary}
              >
                {visitStatusLabels[status]}
              </AppText>
            </Pressable>
          ))}
        </View>
        <Button
          title={isSubmittingVisit ? 'Сохраняем...' : editingVisitId ? 'Сохранить визит' : 'Добавить визит'}
          disabled={isSubmittingVisit}
          onPress={handleSubmitVisit}
        />
        {editingVisitId ? (
          <Button
            title="Отмена"
            variant="outline"
            onPress={cancelEditingVisit}
          />
        ) : null}
        {submitError ? (
          <AppText variant="bodySmall" color={colors.danger}>
            {submitError}
          </AppText>
        ) : null}
      </Card>

      <Pressable
        accessibilityLabel="Сформировать отчёт для врача"
        accessibilityRole="button"
        onPress={() => router.push('/tabs/doctor/report')}
        style={({ pressed }) => [styles.reportCard, pressed && styles.pressed]}
      >
        <View style={styles.reportLabel}>
          <View style={styles.reportIcon}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={20}
              color={colors.white}
            />
          </View>
          <AppText variant="label" color={colors.white} uppercase>
            Отчёт для врача
          </AppText>
        </View>
        <AppText variant="subtitle" color={colors.white} style={styles.reportTitle}>
          Сформировать отчёт для врача
        </AppText>
        <AppText variant="bodySmall" color={colors.peachSoft}>
          Сводка по самочувствию, вопросам, весу и давлению за последние 14 дней
        </AppText>
        <View pointerEvents="none" style={styles.chartDecoration}>
          <View style={[styles.chartBar, styles.chartBarShort]} />
          <View style={[styles.chartBar, styles.chartBarMedium]} />
          <View style={[styles.chartBar, styles.chartBarTall]} />
        </View>
      </Pressable>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AppText variant="subtitle">Вопросы врачу</AppText>
          <Pressable
            accessibilityLabel="Добавить вопрос врачу"
            accessibilityRole="button"
            onPress={() => router.push('/tabs/doctor/question-new')}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
            <AppText variant="bodySmall" color={colors.primary}>
              Добавить
            </AppText>
          </Pressable>
        </View>

        {questions.length === 0 ? (
          <Card variant="muted" shadow="none" style={styles.stateCard}>
            <EmptyState
              title="Вопросов пока нет"
              description="Добавьте вопрос, который хотите обсудить с врачом."
            />
          </Card>
        ) : (
          <View style={styles.listGap}>
            {questions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <AppText variant="subtitle">Визиты</AppText>
        {visits.length === 0 ? (
          <Card variant="muted" shadow="none" style={styles.stateCard}>
            <EmptyState
              title="Визитов пока нет"
              description="Добавьте первый визит к врачу."
            />
          </Card>
        ) : (
          <View style={styles.listGap}>
            {visits.map((visit) => (
              <VisitListCard
                key={visit.id}
                visit={visit}
                onEdit={startEditingVisit}
                onDelete={confirmDeleteVisit}
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <AppText variant="subtitle">История отчётов</AppText>
        <View style={styles.reportList}>
          {doctorReports.map((report, index) => (
            <ReportRow
              key={report.id}
              report={report}
              showDivider={index < doctorReports.length - 1}
            />
          ))}
          <Pressable
            accessibilityLabel="Показать все отчёты"
            accessibilityRole="button"
            onPress={() => router.push('/tabs/doctor/reports')}
            style={({ pressed }) => [styles.showAllButton, pressed && styles.pressed]}
          >
            <AppText variant="bodySmall" color={colors.primary} align="center">
              Показать всё
            </AppText>
          </Pressable>
        </View>
      </View>

      <AppText variant="caption" color={colors.textMuted}>
        {MEDICAL_DISCLAIMER}
      </AppText>
    </Screen>
  );
}

type QuestionCardProps = {
  question: DoctorQuestion;
};

type InfoRowProps = {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  text: string;
};

function InfoRow({ icon, text }: InfoRowProps) {
  return (
    <View style={styles.inlineRow}>
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={colors.textSecondary}
      />
      <AppText variant="bodySmall" color={colors.textSecondary} style={styles.flexText}>
        {text}
      </AppText>
    </View>
  );
}

function QuestionCard({ question }: QuestionCardProps) {
  const toneStyle = question.status === 'ANSWERED' ? styles.lavender : styles.rose;

  return (
    <Pressable
      accessibilityLabel={question.question}
      accessibilityRole="button"
      onPress={() => router.push(`/tabs/doctor/questions/${question.id}`)}
      style={({ pressed }) => [styles.questionCard, pressed && styles.pressed]}
    >
      <View style={[styles.questionAccent, toneStyle]} />
      <View style={styles.questionCopy}>
        <AppText variant="bodySmall" color={colors.textPrimary}>
          {question.question}
        </AppText>
        {question.answer ? (
          <AppText variant="caption" color={colors.textSecondary}>
            Ответ: {question.answer}
          </AppText>
        ) : null}
        <AppText variant="caption" color={colors.textSecondary}>
          {doctorQuestionStatusLabels[question.status]} • {formatCreatedAt(question.createdAt)}
        </AppText>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={colors.textSecondary}
      />
    </Pressable>
  );
}

type VisitListCardProps = {
  visit: Visit;
  onEdit: (visit: Visit) => void;
  onDelete: (visit: Visit) => void;
};

function VisitListCard({ visit, onEdit, onDelete }: VisitListCardProps) {
  return (
    <View style={styles.eventCard}>
      <View style={styles.eventIcon}>
        <MaterialCommunityIcons
          name="calendar-month-outline"
          size={30}
          color={colors.primary}
        />
      </View>
      <View style={styles.eventCopy}>
        <AppText variant="bodySmall" color={colors.textPrimary}>
          {visit.title}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {formatVisitDateTime(visit)} • {visitStatusLabels[visit.status]}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {visit.specialist ?? 'Специалист не указан'} • {visit.location ?? 'Место не указано'}
        </AppText>
      </View>
      <View style={styles.cardActions}>
        <Pressable
          accessibilityLabel="Редактировать визит"
          accessibilityRole="button"
          onPress={() => onEdit(visit)}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.primary} />
        </Pressable>
        <Pressable
          accessibilityLabel="Удалить визит"
          accessibilityRole="button"
          onPress={() => onDelete(visit)}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}

type ReportRowProps = {
  report: DoctorReport;
  showDivider: boolean;
};

function ReportRow({ report, showDivider }: ReportRowProps) {
  return (
    <View style={[styles.reportRow, showDivider && styles.reportDivider]}>
      <MaterialCommunityIcons
        name="file-pdf-box"
        size={26}
        color={colors.primary}
      />
      <View style={styles.reportRowCopy}>
        <AppText variant="bodySmall" color={colors.textPrimary}>
          {report.fileName}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {report.createdAt}
        </AppText>
      </View>
      <Pressable
        accessibilityLabel={`Скачать ${report.fileName}`}
        accessibilityRole="button"
        hitSlop={8}
        style={({ pressed }) => [styles.downloadButton, pressed && styles.pressed]}
      >
        {/* TODO: подключить скачивание отчёта после появления storage/API. */}
        <MaterialCommunityIcons
          name="download-outline"
          size={22}
          color={colors.primary}
        />
      </Pressable>
    </View>
  );
}

function validateVisitForm(form: VisitFormState) {
  const errors: VisitFormErrors = {};
  const dateError = validateDateInput(form.date);
  const timeError = validateTimeInput(form.time);

  if (!form.title.trim()) {
    errors.title = 'Укажите название визита';
  }

  if (dateError) {
    errors.date = dateError;
  }

  if (timeError) {
    errors.time = timeError;
  }

  return errors;
}

function buildVisitCreatePayload(form: VisitFormState): CreateVisitRequest {
  return {
    title: form.title.trim(),
    date: toApiDateFromRuInput(form.date),
    status: form.status,
    ...(form.specialist.trim() ? { specialist: form.specialist.trim() } : {}),
    ...(form.time.trim() ? { time: form.time.trim() } : {}),
    ...(form.location.trim() ? { location: form.location.trim() } : {}),
    ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    ...(form.preparationNotes.trim()
      ? { preparationNotes: form.preparationNotes.trim() }
      : {}),
  };
}

function buildVisitUpdatePayload(form: VisitFormState): UpdateVisitRequest {
  return {
    title: form.title.trim(),
    date: toApiDateFromRuInput(form.date),
    status: form.status,
    specialist: form.specialist.trim() || null,
    time: form.time.trim() || null,
    location: form.location.trim() || null,
    notes: form.notes.trim() || null,
    preparationNotes: form.preparationNotes.trim() || null,
  };
}

function toRuDateInput(value: string) {
  const [year, month, day] = value.split('-');

  return `${day}.${month}.${year}`;
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
    paddingBottom: 122,
    paddingTop: spacing.sm,
  },
  header: {
    gap: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stateCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  visitCard: {
    gap: spacing.xl,
    padding: spacing.xl,
  },
  visitHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  visitCopy: {
    flex: 1,
    gap: spacing.md,
  },
  inlineRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexText: {
    flex: 1,
  },
  visitIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRose,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  visitFormCard: {
    gap: spacing.md,
    padding: spacing.xl,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  formHalf: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: 'transparent',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusChipSelected: {
    backgroundColor: colors.surfaceRose,
    borderColor: colors.pink,
  },
  reportCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    gap: spacing.md,
    minHeight: 208,
    overflow: 'hidden',
    padding: spacing.xl,
    ...shadows.medium,
  },
  reportLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  reportIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  reportTitle: {
    maxWidth: 260,
  },
  chartDecoration: {
    alignItems: 'flex-end',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.lg,
    borderWidth: 12,
    bottom: -10,
    flexDirection: 'row',
    gap: spacing.md,
    height: 92,
    opacity: 0.26,
    padding: spacing.md,
    position: 'absolute',
    right: -8,
    width: 128,
  },
  chartBar: {
    backgroundColor: colors.white,
    borderRadius: radius.xs,
    width: 14,
  },
  chartBarShort: {
    height: 28,
  },
  chartBarMedium: {
    height: 48,
  },
  chartBarTall: {
    height: 68,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.pinkSoft,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 42,
    paddingHorizontal: spacing.lg,
  },
  listGap: {
    gap: spacing.md,
  },
  questionCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xl,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 96,
    padding: spacing.lg,
  },
  questionAccent: {
    borderRadius: radius.pill,
    height: 48,
    width: 8,
  },
  rose: {
    backgroundColor: colors.pinkSoft,
  },
  lavender: {
    backgroundColor: colors.lavenderSoft,
  },
  questionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  eventCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    minHeight: 96,
    padding: spacing.lg,
  },
  eventIcon: {
    alignItems: 'center',
    backgroundColor: colors.peachSoft,
    borderRadius: radius.pill,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  lavenderBubble: {
    backgroundColor: colors.lavenderSoft,
  },
  peachBubble: {
    backgroundColor: colors.peachSoft,
  },
  eventCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  cardActions: {
    alignItems: 'center',
    gap: spacing.md,
  },
  reportList: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  reportRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 76,
    paddingHorizontal: spacing.lg,
  },
  reportDivider: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  reportRowCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  downloadButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  showAllButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xl,
    minHeight: 52,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.78,
  },
});
