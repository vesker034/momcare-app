import { formatPregnancyWeekTitle } from '../../../../src/shared/utils/pregnancyTerm';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MEDICAL_DISCLAIMER } from '../../../../src/config/constants';
import {
  AppText,
  Card,
  EmptyState,
  Header,
  IconButton,
  Screen,
} from '../../../../src/shared/components';
import { getArticleById } from '../../../../src/services/api/articlesApi';
import { colors, radius, spacing } from '../../../../src/shared/theme';
import type { Article } from '../../../../src/types/api';
import { articleCategoryLabels } from '../../../../src/features/calendar/mappers/calendarMappers';

type ArticleRouteParams = {
  articleId?: string;
  week?: string;
  returnTo?: string;
};

type ArticleSection = {
  title: string | null;
  body: string;
};

const SECTION_TITLES = [
  'Краткое описание',
  'Что происходит с малышом',
  'Какие изменения может замечать будущая мама',
  'На что можно обратить внимание',
  'На что можно обратить внимание и что при необходимости обсудить с врачом',
  'Что подготовить',
  'Что можно отмечать',
  'Что учитывать',
  'Что можно пробовать',
] as const;

function parseArticleSections(content: string): ArticleSection[] {
  const normalized = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const sections: ArticleSection[] = [];
  let currentTitle: string | null = null;
  let currentBody: string[] = [];

  const flush = () => {
    if (!currentTitle && currentBody.length === 0) {
      return;
    }

    sections.push({
      title: currentTitle,
      body: currentBody.join('\n\n'),
    });
    currentTitle = null;
    currentBody = [];
  };

  for (const line of normalized) {
    const matchedTitle = SECTION_TITLES.find(
      (title) => line === title || line === `${title}.`,
    );

    if (matchedTitle) {
      flush();
      currentTitle = matchedTitle.replace(/\.$/, '');
      continue;
    }

    currentBody.push(line);
  }

  flush();
  return sections.length > 0 ? sections : [{ title: null, body: content.trim() }];
}

export default function ArticleScreen() {
  const { articleId, week, returnTo } = useLocalSearchParams<ArticleRouteParams>();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const sections = useMemo(
    () => (article ? parseArticleSections(article.content) : []),
    [article],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadArticle() {
      if (!articleId) {
        setArticle(null);
        setError('Не указан идентификатор статьи.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await getArticleById(articleId);

        if (isMounted) {
          setArticle(response.article);
        }
      } catch (loadError) {
        if (isMounted) {
          setArticle(null);
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadArticle();

    return () => {
      isMounted = false;
    };
  }, [articleId, reloadKey]);

  function handleBack() {
    if (typeof returnTo === 'string' && returnTo.trim() !== '') {
      router.replace(returnTo as never);
      return;
    }

    const weekNumber = Number(week);
    if (Number.isInteger(weekNumber) && weekNumber >= 1 && weekNumber <= 42) {
      router.replace(`/tabs/calendar/${weekNumber}`);
      return;
    }

    if (article?.pregnancyWeek) {
      router.replace(`/tabs/calendar/${article.pregnancyWeek}`);
      return;
    }

    router.replace('/tabs/calendar');
  }

  return (
    <Screen contentStyle={styles.scrollContent} style={styles.container}>
      <Header
        title="Статья"
        left={
          <IconButton
            icon={<AppText variant="subtitle" color={colors.primary}>‹</AppText>}
            label="Назад к неделе"
            onPress={handleBack}
          />
        }
      />

      {isLoading ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            Загружаем статью...
          </AppText>
        </Card>
      ) : null}

      {!isLoading && error ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <EmptyState
            title="Статья не загрузилась"
            description={error}
            actionTitle="Повторить"
            onActionPress={() => setReloadKey((value) => value + 1)}
          />
        </Card>
      ) : null}

      {!isLoading && !error && !article ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <EmptyState
            title="Статья не найдена"
            description="Материал отсутствует или больше не опубликован."
          />
        </Card>
      ) : null}

      {!isLoading && !error && article ? (
        <Card style={styles.articleCard}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="book-open-page-variant"
              size={38}
              color={colors.primary}
            />
          </View>
          <AppText variant="title" color={colors.primary} align="center">
            {article.title}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} align="center">
            {articleCategoryLabels[article.category]}
            {article.pregnancyWeek ? ` • ${formatPregnancyWeekTitle(article.pregnancyWeek)}` : ''}
          </AppText>
          {article.summary ? (
            <AppText variant="body" color={colors.textSecondary} serif style={styles.summary}>
              {article.summary}
            </AppText>
          ) : null}

          <View style={styles.sections}>
            {sections.map((section, index) => (
              <View key={`${section.title ?? 'body'}-${index}`} style={styles.section}>
                {section.title ? (
                  <AppText variant="cardTitle" color={colors.primary} style={styles.sectionTitle}>
                    {section.title}
                  </AppText>
                ) : null}
                <AppText variant="bodySmall" color={colors.textPrimary} style={styles.content}>
                  {section.body}
                </AppText>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <Card variant="muted" shadow="none" style={styles.disclaimerCard}>
        <AppText variant="caption" color={colors.textMuted}>
          {MEDICAL_DISCLAIMER}
        </AppText>
      </Card>
    </Screen>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось загрузить статью.';
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
  stateCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  articleCard: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  iconWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surfaceRose,
    borderRadius: radius.pill,
    height: 78,
    justifyContent: 'center',
    width: 78,
  },
  summary: {
    marginTop: spacing.xs,
  },
  sections: {
    gap: spacing.xl,
    marginTop: spacing.sm,
    width: '100%',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
  content: {
    lineHeight: 23,
  },
  disclaimerCard: {
    padding: spacing.lg,
  },
});
