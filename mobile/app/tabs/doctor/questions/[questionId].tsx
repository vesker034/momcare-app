import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { MEDICAL_DISCLAIMER } from '../../../../src/config/constants';
import {
  AppText,
  Button,
  Card,
  Header,
  IconButton,
  Screen,
} from '../../../../src/shared/components';
import {
  deleteDoctorQuestion,
  getDoctorQuestionById,
  updateDoctorQuestion,
} from '../../../../src/services/api/doctorQuestionsApi';
import { colors, radius, spacing } from '../../../../src/shared/theme';
import type {
  DoctorQuestion,
  DoctorQuestionStatus,
} from '../../../../src/types/api';
import {
  doctorQuestionStatusLabels,
  formatCreatedAt,
} from '../../../../src/features/doctor/mappers/doctorMappers';

type QuestionRouteParams = {
  questionId?: string;
};

const questionStatuses: DoctorQuestionStatus[] = ['NEW', 'ANSWERED', 'ARCHIVED'];

export default function DoctorQuestionDetailsScreen() {
  const { questionId } = useLocalSearchParams<QuestionRouteParams>();
  const [question, setQuestion] = useState<DoctorQuestion | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState<DoctorQuestionStatus>('NEW');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadQuestion() {
      if (!questionId) {
        setError('Не указан идентификатор вопроса.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await getDoctorQuestionById(questionId);

        if (isMounted) {
          setQuestion(response.question);
          setQuestionText(response.question.question);
          setAnswer(response.question.answer ?? '');
          setStatus(response.question.status);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadQuestion();

    return () => {
      isMounted = false;
    };
  }, [questionId]);

  async function handleSave() {
    if (!questionId || !questionText.trim()) {
      setError('Введите вопрос врачу');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await updateDoctorQuestion(questionId, {
        question: questionText.trim(),
        answer: answer.trim() || null,
        status,
      });

      setQuestion(response.question);
      router.replace('/tabs/doctor');
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Удалить вопрос?', questionText, [
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
    if (!questionId) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await deleteDoctorQuestion(questionId);
      router.replace('/tabs/doctor');
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen contentStyle={styles.scrollContent} style={styles.container}>
      <Header
        title="Вопрос врачу"
        left={
          <IconButton
            icon={<AppText variant="subtitle" color={colors.primary}>‹</AppText>}
            label="Назад к врачу"
            onPress={() => router.push('/tabs/doctor')}
          />
        }
      />

      <Card style={styles.card}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name="comment-question-outline"
            size={42}
            color={colors.primary}
          />
        </View>
        {isLoading ? (
          <AppText variant="bodySmall" color={colors.textSecondary} align="center">
            Загружаем вопрос...
          </AppText>
        ) : null}
        {!isLoading && question ? (
          <>
            <AppText variant="caption" color={colors.textSecondary} align="center">
              Создан: {formatCreatedAt(question.createdAt)}
            </AppText>
            <View style={styles.section}>
              <AppText variant="label" color={colors.primary} uppercase>
                Вопрос
              </AppText>
              <TextInput
                accessibilityLabel="Вопрос врачу"
                multiline
                onChangeText={setQuestionText}
                placeholder="Вопрос врачу"
                placeholderTextColor={colors.textMuted}
                style={styles.textInput}
                textAlignVertical="top"
                value={questionText}
              />
            </View>
            <View style={styles.section}>
              <AppText variant="label" color={colors.primary} uppercase>
                Ответ врача
              </AppText>
              <TextInput
                accessibilityLabel="Ответ врача"
                multiline
                onChangeText={setAnswer}
                placeholder="Запишите ответ после консультации"
                placeholderTextColor={colors.textMuted}
                style={styles.textInput}
                textAlignVertical="top"
                value={answer}
              />
            </View>
            <View style={styles.statusRow}>
              {questionStatuses.map((item) => (
                <Pressable
                  accessibilityRole="button"
                  key={item}
                  onPress={() => setStatus(item)}
                  style={[
                    styles.statusChip,
                    status === item && styles.statusChipSelected,
                  ]}
                >
                  <AppText
                    variant="caption"
                    color={status === item ? colors.primary : colors.textSecondary}
                  >
                    {doctorQuestionStatusLabels[item]}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
        {error ? (
          <AppText variant="bodySmall" color={colors.danger}>
            {error}
          </AppText>
        ) : null}
        <Button
          title={isSubmitting ? 'Сохраняем...' : 'Сохранить'}
          disabled={isSubmitting || isLoading || !question}
          onPress={handleSave}
        />
        <Button
          title="Удалить вопрос"
          variant="outline"
          disabled={isSubmitting || isLoading || !question}
          onPress={confirmDelete}
        />
      </Card>

      <AppText variant="caption" color={colors.textMuted}>
        {MEDICAL_DISCLAIMER}
      </AppText>
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
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRose,
    borderRadius: radius.pill,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  section: {
    gap: spacing.md,
    width: '100%',
  },
  textInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 116,
    padding: spacing.lg,
    width: '100%',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
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
});
