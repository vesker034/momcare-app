import { formatPregnancyWeekTitle } from '../../../src/shared/utils/pregnancyTerm';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  EmptyState,
  Header,
  IconButton,
  ProgressBar,
  Screen,
} from '../../../src/shared/components';
import { getArticlesByWeek } from '../../../src/services/api/articlesApi';
import {
  deleteChecklistItem,
  getChecklistByWeek,
  toggleChecklistItem,
} from '../../../src/services/api/checklistsApi';
import { ApiError } from '../../../src/services/api/apiClient';
import { getPregnancyWeekContent } from '../../../src/services/api/pregnancyWeeksApi';
import {
  getFruitImage,
  getFruitImageScale,
  hasFruitComparison,
} from '../../../src/features/calendar/data/fruitImages';
import {
  getBabyDevelopmentImage,
  getNewbornComparisonImage,
} from '../../../src/features/calendar/data/babyImages';
import {
  rememberCalendarReturn,
} from '../../../src/features/calendar/data/calendarUiState';
import { MEDICAL_DISCLAIMER } from '../../../src/config/constants';
import { colors, radius, shadows, spacing } from '../../../src/shared/theme';
import { ChecklistItemsPanel } from '../../../src/features/calendar/components/ChecklistItemsPanel';
import { WeekNavigation } from '../../../src/features/calendar/components/WeekNavigation';
import {
  articleCategoryLabels,
  getTrimesterId,
  getTrimesterLabel,
} from '../../../src/features/calendar/mappers/calendarMappers';
import type {
  ArticleListItem,
  ChecklistItem,
  PregnancyWeekContent,
} from '../../../src/types/api';
import type { TrimesterId } from '../../../src/features/calendar/data/pregnancyWeeks';

type WeekRouteParams = {
  week?: string;
  fromTrimester?: string;
};

type ContentLoadState =
  | { status: 'loading' }
  | { status: 'ready'; content: PregnancyWeekContent }
  | { status: 'empty' }
  | { status: 'invalid' }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string };

const MIN_WEEK = 1;
const MAX_WEEK = 42;

function parseWeekParam(week: string | undefined): number | null {
  if (week === undefined || week.trim() === '') {
    return null;
  }

  const weekNumber = Number(week);

  if (!Number.isInteger(weekNumber) || weekNumber < MIN_WEEK || weekNumber > MAX_WEEK) {
    return null;
  }

  return weekNumber;
}

export default function CalendarWeekScreen() {
  const { week, fromTrimester } = useLocalSearchParams<WeekRouteParams>();
  const weekNumber = useMemo(() => parseWeekParam(week), [week]);
  const returnTrimester = useMemo((): TrimesterId => {
    const parsed = Number(fromTrimester);
    if (parsed === 1 || parsed === 2 || parsed === 3) {
      return parsed;
    }
    return weekNumber ? getTrimesterId(weekNumber) : 1;
  }, [fromTrimester, weekNumber]);

  const [contentState, setContentState] = useState<ContentLoadState>({
    status: 'loading',
  });
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [isChecklistLoading, setIsChecklistLoading] = useState(false);
  const [checklistError, setChecklistError] = useState('');
  const [articlesError, setArticlesError] = useState('');
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const checklistRequestId = useRef(0);

  const loadChecklist = useCallback(async (week: number) => {
    const requestId = ++checklistRequestId.current;
    setIsChecklistLoading(true);
    setChecklistError('');

    try {
      const response = await getChecklistByWeek(week);
      if (requestId === checklistRequestId.current) {
        setChecklistItems(response.items);
      }
    } catch (error) {
      if (requestId === checklistRequestId.current) {
        setChecklistItems([]);
        setChecklistError(getErrorMessage(error));
      }
    } finally {
      if (requestId === checklistRequestId.current) {
        setIsChecklistLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (weekNumber !== null) {
        void loadChecklist(weekNumber);
      }

      return () => {
        checklistRequestId.current += 1;
      };
    }, [loadChecklist, reloadKey, weekNumber]),
  );

  useEffect(() => {
    let isMounted = true;

    async function loadWeekData() {
      if (weekNumber === null) {
        setContentState({ status: 'invalid' });
        setChecklistItems([]);
        setArticles([]);
        setIsChecklistLoading(false);
        setChecklistError('');
        setArticlesError('');
        setArticlesLoading(false);
        return;
      }

      setContentState({ status: 'loading' });
      setArticlesLoading(true);
      setArticlesError('');
      setArticles([]);

      const [contentResult, weekArticlesResult] =
        await Promise.allSettled([
          getPregnancyWeekContent(weekNumber),
          getArticlesByWeek(weekNumber),
        ]);

      if (!isMounted) {
        return;
      }

      if (contentResult.status === 'fulfilled') {
        setContentState({
          status: 'ready',
          content: contentResult.value.content,
        });
      } else {
        setContentState(mapContentFailure(contentResult.reason));
      }

      if (weekArticlesResult.status === 'fulfilled') {
        setArticles(weekArticlesResult.value.articles);
        setArticlesError('');
      } else {
        setArticles([]);
        setArticlesError(getErrorMessage(weekArticlesResult.reason));
      }

      setArticlesLoading(false);
    }

    void loadWeekData();

    return () => {
      isMounted = false;
    };
  }, [weekNumber, reloadKey]);

  async function handleDeletePersonal(item: ChecklistItem) {
    setChecklistError('');
    try {
      await deleteChecklistItem(item.id);
      if (weekNumber !== null) await loadChecklist(weekNumber);
    } catch (error) {
      setChecklistError(getErrorMessage(error));
    }
  }

  function handleEditPersonal(item: ChecklistItem) {
    if (weekNumber === null) return;
    router.push({ pathname: '/tabs/more/checklists', params: {
      week: String(weekNumber), source: 'week', editItemId: item.id,
      returnTo: `/tabs/calendar/${weekNumber}?fromTrimester=${returnTrimester}`,
      fromTrimester: String(returnTrimester),
    } });
  }

  async function handleToggleChecklistItem(id: string) {
    setTogglingItemId(id);
    setChecklistError('');

    try {
      const response = await toggleChecklistItem(id);

      setChecklistItems((currentItems) =>
        currentItems.map((item) =>
          item.id === response.item.id ? response.item : item,
        ),
      );
    } catch (error) {
      setChecklistError(getErrorMessage(error));
    } finally {
      setTogglingItemId(null);
    }
  }

  const headerTitle =
    weekNumber !== null ? formatPregnancyWeekTitle(weekNumber) : 'Неделя беременности';
  const headerSubtitle =
    contentState.status === 'ready'
      ? getTrimesterLabel(contentState.content.week)
      : undefined;

  function navigateToWeek(targetWeek: number) {
    if (targetWeek < MIN_WEEK || targetWeek > MAX_WEEK) {
      return;
    }

    const targetTrimester = getTrimesterId(targetWeek);
    rememberCalendarReturn(targetTrimester, targetWeek);
    router.replace({
      pathname: '/tabs/calendar/[week]',
      params: {
        week: String(targetWeek),
        fromTrimester: String(targetTrimester),
      },
    });
  }

  return (
    <Screen contentStyle={styles.scrollContent} style={styles.container}>
      <Header
        title={headerTitle}
        subtitle={headerSubtitle}
        left={
          <IconButton
            icon={<AppText variant="subtitle" color={colors.primary}>‹</AppText>}
            label="Назад к календарю"
            onPress={() => {
              if (weekNumber !== null) {
                rememberCalendarReturn(returnTrimester, weekNumber);
              }
              router.replace('/tabs/calendar');
            }}
          />
        }
      />

      {weekNumber !== null ? (
        <WeekNavigation week={weekNumber} onSelectWeek={navigateToWeek} />
      ) : null}

      {contentState.status === 'loading' ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            Загружаем неделю беременности...
          </AppText>
        </Card>
      ) : null}

      {contentState.status === 'invalid' ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <EmptyState
            title="Некорректный номер недели"
            description={`Укажите неделю от ${MIN_WEEK} до ${MAX_WEEK}.`}
          />
        </Card>
      ) : null}

      {contentState.status === 'unavailable' || contentState.status === 'error' ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <EmptyState
            title={
              contentState.status === 'unavailable'
                ? 'Сервер недоступен'
                : 'Не удалось загрузить контент'
            }
            description={contentState.message}
          />
        </Card>
      ) : null}

      {contentState.status === 'empty' ? (
        <Card variant="muted" shadow="none" style={styles.stateCard}>
          <EmptyState
            title="Контент недели отсутствует"
            description="Описание для выбранной недели пока не найдено."
          />
        </Card>
      ) : null}

      {contentState.status === 'ready' ? (
        <>
          <SummaryCard content={contentState.content} />

          <View style={styles.section}>
            <SectionTitle icon="baby-face-outline" title="Малыш на этой неделе" />
            <Card variant="rose" shadow="none" style={styles.babyCard}>
              {getBabyDevelopmentImage(contentState.content.week) ? (
                <Image
                  accessibilityIgnoresInvertColors
                  source={getBabyDevelopmentImage(contentState.content.week)!}
                  resizeMode="contain"
                  style={styles.babyImage}
                />
              ) : (
                <MaterialCommunityIcons
                  name="baby-face-outline"
                  size={72}
                  color={colors.primary}
                />
              )}
              <AppText variant="subtitle" color={colors.primary}>
                {contentState.content.title}
              </AppText>
              {hasFruitComparison(contentState.content.fruitComparison) ? (
                <AppText variant="bodySmall" color={colors.primary}>
                  Сравнение: {contentState.content.fruitComparison}
                </AppText>
              ) : null}
              <AppText variant="bodySmall" color={colors.textSecondary}>
                {contentState.content.babyDevelopment}
              </AppText>
            </Card>
          </View>

          <View style={styles.section}>
            <SectionTitle icon="heart-outline" title="Что происходит с мамой" />
            <Card style={styles.motherCard}>
              <AppText variant="bodySmall" color={colors.textSecondary}>
                {contentState.content.motherChanges}
              </AppText>
              <Pressable
                accessibilityLabel="Записать самочувствие"
                accessibilityRole="button"
                onPress={() => router.push('/tabs/diary')}
                style={styles.textAction}
              >
                <AppText variant="bodySmall" color={colors.primary} serif>
                  Записать самочувствие
                </AppText>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={22}
                  color={colors.primary}
                />
              </Pressable>
            </Card>
          </View>

          <View style={styles.section}>
            <SectionTitle icon="calendar-check-outline" title="Рекомендации недели" />
            <Card style={styles.motherCard}>
              <AppText variant="bodySmall" color={colors.textSecondary}>
                {contentState.content.recommendation}
              </AppText>
            </Card>
          </View>

          {contentState.content.symptoms ? (
            <View style={styles.section}>
              <SectionTitle icon="heart-outline" title="Возможные симптомы" />
              <Card variant="muted" shadow="none" style={styles.stateCard}>
                <AppText variant="bodySmall" color={colors.textSecondary}>
                  {contentState.content.symptoms}
                </AppText>
              </Card>
            </View>
          ) : null}

          {contentState.content.warnings ? (
            <View style={styles.section}>
              <SectionTitle icon="calendar-check-outline" title="Предупреждения" />
              <Card variant="muted" shadow="none" style={styles.stateCard}>
                <AppText variant="bodySmall" color={colors.danger}>
                  {contentState.content.warnings}
                </AppText>
              </Card>
            </View>
          ) : null}
        </>
      ) : null}

      {weekNumber !== null ? (
        <>
          <Card variant="muted" shadow="none" style={styles.checklistCard}>
            <View style={styles.checklistHeader}>
              <AppText variant="cardTitle">Чек-лист недели</AppText>
              <MaterialCommunityIcons
                name="format-list-checks"
                size={24}
                color={colors.primary}
              />
            </View>
            <ChecklistItemsPanel
              items={checklistItems}
              isLoading={isChecklistLoading}
              error={checklistError}
              togglingItemId={togglingItemId}
              onToggle={handleToggleChecklistItem}
              onEditPersonal={handleEditPersonal}
              onDeletePersonal={handleDeletePersonal}
            />
            <Button
              title="Открыть полный чек-лист"
              variant="outline"
              onPress={() =>
                router.push({
                  pathname: '/tabs/more/checklists',
                  params: {
                    week: String(weekNumber),
                    source: 'week',
                    returnTo: `/tabs/calendar/${weekNumber}?fromTrimester=${returnTrimester}`,
                    fromTrimester: String(returnTrimester),
                  },
                })
              }
              style={styles.secondaryButton}
            />
          </Card>

          <View style={styles.section}>
            <AppText variant="cardTitle">Статьи недели</AppText>
            {articlesLoading ? (
              <Card variant="muted" shadow="none" style={styles.stateCard}>
                <AppText variant="bodySmall" color={colors.textSecondary}>
                  Загружаем статьи...
                </AppText>
              </Card>
            ) : null}
            {!articlesLoading && articlesError ? (
              <Card variant="muted" shadow="none" style={styles.stateCard}>
                <EmptyState
                  title="Статьи не загрузились"
                  description={articlesError}
                  actionTitle="Повторить"
                  onActionPress={() => setReloadKey((value) => value + 1)}
                />
              </Card>
            ) : null}
            {!articlesLoading && !articlesError && articles.length === 0 ? (
              <Card variant="muted" shadow="none" style={styles.stateCard}>
                <EmptyState
                  title="Статей пока нет"
                  description="Для этой недели материалы пока не найдены."
                />
              </Card>
            ) : null}
            {!articlesLoading && !articlesError && articles.length > 0 ? (
              <View style={styles.articleList}>
                {articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    weekNumber={weekNumber}
                    returnTrimester={returnTrimester}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </>
      ) : null}

      <Card variant="muted" shadow="none" style={styles.stateCard}>
        <AppText variant="caption" color={colors.textMuted}>
          {MEDICAL_DISCLAIMER}
        </AppText>
      </Card>

      <View style={styles.actions}>
        <Button
          leftIcon={
            <MaterialCommunityIcons
              name="format-list-checks"
              size={22}
              color={colors.white}
            />
          }
          title="Записать самочувствие"
          onPress={() => router.push('/tabs/diary')}
        />
        <Button
          leftIcon={
            <MaterialCommunityIcons
              name="comment-plus-outline"
              size={22}
              color={colors.primary}
            />
          }
          title="Добавить вопрос врачу"
          variant="outline"
          onPress={() => router.push('/tabs/doctor')}
          style={styles.secondaryButton}
        />
      </View>
    </Screen>
  );
}

type SummaryCardProps = {
  content: PregnancyWeekContent;
};

function SummaryCard({ content }: SummaryCardProps) {
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((content.week / 40) * 100)),
  );
  const fruitImage = getFruitImage(content.fruitComparison);
  const sizeComparisonImage = content.week >= 40 ? getNewbornComparisonImage() : fruitImage;
  const fruitImageScale = getFruitImageScale(content.fruitComparison);

  return (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View style={styles.summaryTitleGroup}>
          <AppText variant="cardTitle" serif>
            {formatPregnancyWeekTitle(content.week)}{'\n'}беременности
          </AppText>
          <AppText variant="bodySmall" color={colors.textSecondary} serif>
            {content.title}
          </AppText>
        </View>
      </View>

      <View style={styles.progressLine}>
        <AppText variant="caption" color={colors.textSecondary}>
          Прогресс беременности
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} serif>
          {progressPercent}%
        </AppText>
      </View>
      <ProgressBar
        value={progressPercent}
        height={8}
        fillColor={colors.primary}
        trackColor={colors.surfaceMuted}
      />

      <View style={styles.sizeCard}>
        <View style={styles.sizeImage}>
          {sizeComparisonImage ? (
            <Image
              accessibilityIgnoresInvertColors
              source={sizeComparisonImage}
              resizeMode="contain"
              style={[
                styles.sizeFruitImage,
                ...(content.week >= 40 ? [] : [{ transform: [{ scale: fruitImageScale }] }]),
              ]}
            />
          ) : (
            <MaterialCommunityIcons name="ruler" size={32} color={colors.primary} />
          )}
        </View>
        <View style={styles.sizeCopy}>
          <AppText variant="label" color={colors.textMuted} uppercase>
            Малыш размером
          </AppText>
          <AppText variant="subtitle" color={colors.primary}>
            {content.babySize ??
              (hasFruitComparison(content.fruitComparison)
                ? content.fruitComparison
                : 'данные уточняются')}
          </AppText>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            Вес {content.babyWeight ?? '—'}
          </AppText>
          {hasFruitComparison(content.fruitComparison) ? (
            <AppText variant="caption" color={colors.textMuted}>
              Как {content.fruitComparison}
            </AppText>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

type ArticleCardProps = {
  article: ArticleListItem;
  weekNumber: number;
  returnTrimester: TrimesterId;
};

function ArticleCard({ article, weekNumber, returnTrimester }: ArticleCardProps) {
  return (
    <Pressable
      accessibilityLabel={article.title}
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/tabs/calendar/articles/[articleId]',
          params: {
            articleId: article.id,
            week: String(weekNumber),
            returnTo: `/tabs/calendar/${weekNumber}?fromTrimester=${returnTrimester}`,
          },
        })
      }
      style={({ pressed }) => [styles.articleCard, pressed && styles.pressed]}
    >
      <View style={styles.articleIcon}>
        <MaterialCommunityIcons
          name="book-open-page-variant"
          size={24}
          color={colors.primary}
        />
      </View>
      <View style={styles.articleCopy}>
        <AppText variant="bodySmall" color={colors.textPrimary} serif>
          {article.title}
        </AppText>
        {article.summary ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {article.summary}
          </AppText>
        ) : null}
        <AppText variant="caption" color={colors.primary}>
          {articleCategoryLabels[article.category]}
        </AppText>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
    </Pressable>
  );
}

function mapContentFailure(error: unknown): ContentLoadState {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return {
        status: 'unavailable',
        message: error.message,
      };
    }

    if (error.status === 404) {
      return { status: 'empty' };
    }

    if (error.status === 400) {
      return { status: 'invalid' };
    }

    return {
      status: 'error',
      message: error.message,
    };
  }

  return {
    status: 'error',
    message: getErrorMessage(error),
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось загрузить данные недели.';
}

type SectionTitleProps = {
  icon: 'baby-face-outline' | 'heart-outline' | 'calendar-check-outline';
  title: string;
};

function SectionTitle({ icon, title }: SectionTitleProps) {
  return (
    <View style={styles.sectionTitle}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      <AppText variant="cardTitle">{title}</AppText>
    </View>
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
  summaryCard: {
    gap: spacing.md,
    padding: spacing.xl,
  },
  stateCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  summaryHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  summaryTitleGroup: {
    flex: 1,
    gap: spacing.sm,
  },
  progressLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sizeCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xxl,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  sizeImage: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 70,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 70,
    ...shadows.soft,
  },
  sizeFruitImage: {
    height: 58,
    width: 58,
  },
  sizeCopy: {
    flex: 1,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  babyCard: {
    alignItems: 'center',
    borderColor: colors.pinkSoft,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  babyImage: {
    alignSelf: 'center',
    height: 220,
    width: '100%',
  },
  motherCard: {
    gap: spacing.xl,
    padding: spacing.xl,
  },
  textAction: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  checklistCard: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  checklistHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  articleList: {
    gap: spacing.md,
  },
  articleCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 92,
    padding: spacing.lg,
  },
  articleIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRose,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  articleCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  actions: {
    gap: spacing.md,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.76,
  },
});
