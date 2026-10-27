import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { MEDICAL_DISCLAIMER } from '../../../src/config/constants';
import {
  AppText,
  Button,
  Card,
  Header,
  IconButton,
  Screen,
} from '../../../src/shared/components';
import { createDoctorQuestion } from '../../../src/services/api/doctorQuestionsApi';
import { colors, radius, spacing } from '../../../src/shared/theme';

export default function DoctorQuestionNewScreen() {
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError('Введите вопрос врачу');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createDoctorQuestion({
        question: trimmedQuestion,
        status: 'NEW',
      });
      router.replace('/tabs/doctor');
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen contentStyle={styles.scrollContent} style={styles.container}>
      <Header
        title="Добавить вопрос"
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
            name="comment-plus-outline"
            size={42}
            color={colors.primary}
          />
        </View>
        <AppText variant="subtitle" align="center">
          Новый вопрос врачу
        </AppText>
        <TextInput
          accessibilityLabel="Вопрос врачу"
          multiline
          onChangeText={setQuestion}
          placeholder="Что вы хотите обсудить на приёме?"
          placeholderTextColor={colors.textMuted}
          style={styles.questionInput}
          textAlignVertical="top"
          value={question}
        />
        {error ? (
          <AppText variant="bodySmall" color={colors.danger}>
            {error}
          </AppText>
        ) : null}
        <Button
          title={isSubmitting ? 'Сохраняем...' : 'Сохранить вопрос'}
          disabled={isSubmitting}
          onPress={handleSubmit}
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

  return 'Не удалось сохранить вопрос. Попробуйте ещё раз.';
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
  questionInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 132,
    padding: spacing.lg,
    width: '100%',
  },
});
