import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ChecklistItemsPanel } from '../../calendar/components/ChecklistItemsPanel';
import { checklistCategoryLabels } from '../../calendar/mappers/calendarMappers';
import {
  createChecklistItem,
  deleteChecklistItem,
  getChecklistByWeek,
  toggleChecklistItem,
  updateChecklistItem,
} from '../../../services/api/checklistsApi';
import { getPregnancyProfile } from '../../../services/api/pregnancyProfileApi';
import {
  AppText,
  Button,
  Card,
  Header,
  IconButton,
  Input,
  Screen,
} from '../../../shared/components';
import { colors, radius, spacing } from '../../../shared/theme';
import type { ChecklistCategory, ChecklistItem } from '../../../types/api';

const MIN_WEEK = 1;
const MAX_WEEK = 42;
const FALLBACK_WEEK = 24;

const CATEGORY_OPTIONS = Object.keys(checklistCategoryLabels) as ChecklistCategory[];

type ChecklistRouteParams = {
  week?: string;
  returnTo?: string;
  source?: string;
  editItemId?: string;
};

type EditorState = {
  mode: 'create' | 'edit';
  itemId?: string;
  title: string;
  description: string;
  category: ChecklistCategory;
  week: number;
};

function parseWeekParam(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const week = Number(raw);
  if (!Number.isInteger(week) || week < MIN_WEEK || week > MAX_WEEK) {
    return null;
  }
  return week;
}

function normalizeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return typeof value === 'string' ? value : '';
}

export function ChecklistsScreen() {
  const params = useLocalSearchParams<ChecklistRouteParams>();
  const editItemId = params.editItemId;

  const [selectedWeek, setSelectedWeek] = useState(FALLBACK_WEEK);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorError, setEditorError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [scrollVersion, setScrollVersion] = useState(0);
  const checklistRequestId = useRef(0);
  const weekChipOffsets = useRef<Record<number, number>>({});
  const weekChipsRef = useRef<ScrollView>(null);
  const skipManualSelectionScroll = useRef(false);
  const handledEditItemId = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function syncSelectedWeek() {
        const source = normalizeParam(params.source);
        const weekFromParams = parseWeekParam(params.week);
        const fromCalendarOrWeek = source === 'calendar' || source === 'week';

        if (fromCalendarOrWeek && weekFromParams !== null) {
          if (isActive) {
            setSelectedWeek(weekFromParams);
            setScrollVersion((value) => value + 1);
          }
          return;
        }

        try {
          const response = await getPregnancyProfile();
          const profileWeek = response.profile?.pregnancyWeek;

          if (!isActive) {
            return;
          }

          if (
            typeof profileWeek === 'number' &&
            Number.isInteger(profileWeek) &&
            profileWeek >= MIN_WEEK &&
            profileWeek <= MAX_WEEK
          ) {
            setSelectedWeek(profileWeek);
            setScrollVersion((value) => value + 1);
            return;
          }
        } catch {
          // fallback below
        }

        if (!isActive) {
          return;
        }

        if (weekFromParams !== null && source !== 'more') {
          setSelectedWeek(weekFromParams);
          setScrollVersion((value) => value + 1);
          return;
        }

        setSelectedWeek(FALLBACK_WEEK);
        setScrollVersion((value) => value + 1);
      }

      void syncSelectedWeek();

      return () => {
        isActive = false;
      };
    }, [params.source, params.week]),
  );

  const loadChecklist = useCallback(async (week: number) => {
    const requestId = ++checklistRequestId.current;
    setIsLoading(true);
    setError('');

    try {
      const response = await getChecklistByWeek(week);
      if (requestId === checklistRequestId.current) {
        setItems(response.items);
      }
    } catch (loadError) {
      if (requestId === checklistRequestId.current) {
        setItems([]);
        setError(getErrorMessage(loadError));
      }
    } finally {
      if (requestId === checklistRequestId.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadChecklist(selectedWeek);
      return () => {
        checklistRequestId.current += 1;
      };
    }, [loadChecklist, selectedWeek]),
  );

  useEffect(() => {
    if (skipManualSelectionScroll.current) {
      skipManualSelectionScroll.current = false;
      return;
    }

    const x = weekChipOffsets.current[selectedWeek];
    if (typeof x === 'number') {
      requestAnimationFrame(() => weekChipsRef.current?.scrollTo({ x: Math.max(x - 24, 0), animated: false }));
    }
  }, [scrollVersion, selectedWeek]);

  useEffect(() => {
    if (!editItemId || handledEditItemId.current === editItemId) return;
    const item = items.find((candidate) => candidate.id === editItemId);
    if (!item) return;
    handledEditItemId.current = editItemId;
    openEditEditor(item);
  }, [editItemId, items]);

  function selectWeekManually(week: number) {
    if (week === selectedWeek) {
      return;
    }
    skipManualSelectionScroll.current = true;
    setSelectedWeek(week);
  }

  function handleBack() {
    if (typeof params.returnTo === 'string' && params.returnTo.trim() !== '') {
      router.replace(params.returnTo as never);
      return;
    }

    router.replace('/tabs/more');
  }

  async function handleToggle(id: string) {
    setTogglingItemId(id);
    setError('');

    try {
      const response = await toggleChecklistItem(id);
      setItems((current) =>
        current.map((item) =>
          item.id === response.item.id ? response.item : item,
        ),
      );
    } catch (toggleError) {
      setError(getErrorMessage(toggleError));
    } finally {
      setTogglingItemId(null);
    }
  }

  function openCreateEditor() {
    setEditorError('');
    setEditor({
      mode: 'create',
      title: '',
      description: '',
      category: 'OTHER',
      week: selectedWeek,
    });
  }

  function openEditEditor(item: ChecklistItem) {
    setEditorError('');
    setEditor({
      mode: 'edit',
      itemId: item.id,
      title: item.title,
      description: item.description ?? '',
      category: item.category,
      week: item.week,
    });
  }

  async function handleSaveEditor() {
    if (!editor) {
      return;
    }

    const title = editor.title.trim();
    if (!title) {
      setEditorError('Введите название пункта.');
      return;
    }

    setIsSaving(true);
    setEditorError('');

    try {
      const payload = {
        week: editor.week,
        title,
        description: editor.description.trim() || null,
        category: editor.category,
      };

      if (editor.mode === 'create') {
        await createChecklistItem(payload);
      } else if (editor.itemId) {
        await updateChecklistItem(editor.itemId, payload);
      }

      setEditor(null);
      await loadChecklist(selectedWeek);
    } catch (saveError) {
      setEditorError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeletePersonal(item: ChecklistItem) {
    setError('');

    try {
      await deleteChecklistItem(item.id);
      await loadChecklist(selectedWeek);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    }
  }

  return (
    <Screen contentStyle={styles.scrollContent} style={styles.container}>
      <Header
        title="Чек-листы"
        subtitle="Планы и важные дела на выбранную неделю"
        left={
          <IconButton
            icon={<AppText variant="subtitle" color={colors.primary}>‹</AppText>}
            label="Назад"
            onPress={handleBack}
          />
        }
      />

      <Card style={styles.weekCard}>
        <AppText variant="cardTitle">Неделя {selectedWeek}</AppText>
        <AppText variant="bodySmall" color={colors.textSecondary}>
          Выберите неделю беременности.
        </AppText>
        <ScrollView
          ref={weekChipsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekChips}
        >
          {Array.from({ length: MAX_WEEK - MIN_WEEK + 1 }, (_, index) => {
            const week = MIN_WEEK + index;
            const selected = week === selectedWeek;

            return (
              <Pressable
                key={week}
                onLayout={(event) => { weekChipOffsets.current[week] = event.nativeEvent.layout.x; }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => selectWeekManually(week)}
                style={[styles.weekChip, selected && styles.weekChipSelected]}
              >
                <AppText
                  variant="caption"
                  color={selected ? colors.white : colors.textSecondary}
                >
                  {week}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </Card>

      <Card style={styles.listCard}>
        <View style={styles.listHeader}>
          <AppText variant="cardTitle">Дела на неделю</AppText>
          <Button title="Добавить пункт" onPress={openCreateEditor} />
        </View>

        <ChecklistItemsPanel
          items={items}
          isLoading={isLoading}
          error={error}
          togglingItemId={togglingItemId}
          onToggle={handleToggle}
          onEditPersonal={openEditEditor}
          onDeletePersonal={handleDeletePersonal}
          emptyDescription="На эту неделю пока нет дел. Можно добавить свой пункт."
        />

        {!isLoading && error ? (
          <Button
            title="Повторить"
            variant="outline"
            onPress={() => void loadChecklist(selectedWeek)}
            style={styles.retryButton}
          />
        ) : null}
      </Card>

      <Modal
        visible={editor !== null}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isSaving) setEditor(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboard}
        >
          <View style={styles.modalOverlay}>
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Card style={styles.modalCard}>
            <AppText variant="cardTitle">
              {editor?.mode === 'edit' ? 'Редактировать пункт' : 'Новый пункт'}
            </AppText>

            <Input
              label="Название"
              value={editor?.title ?? ''}
              onChangeText={(value) =>
                setEditor((current) => (current ? { ...current, title: value } : current))
              }
              maxLength={120}
            />
            <Input
              label="Описание (необязательно)"
              value={editor?.description ?? ''}
              onChangeText={(value) =>
                setEditor((current) =>
                  current ? { ...current, description: value } : current,
                )
              }
              maxLength={500}
              multiline
            />

            <AppText variant="caption" color={colors.textSecondary}>
              Категория
            </AppText>
            <View style={styles.categoryRow}>
              {CATEGORY_OPTIONS.map((category) => {
                const selected = editor?.category === category;
                return (
                  <Pressable
                    key={category}
                    onPress={() =>
                      setEditor((current) =>
                        current ? { ...current, category } : current,
                      )
                    }
                    style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  >
                    <AppText
                      variant="caption"
                      color={selected ? colors.white : colors.textSecondary}
                    >
                      {checklistCategoryLabels[category]}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <AppText variant="caption" color={colors.textSecondary}>
              Неделя: {editor?.week ?? selectedWeek}
            </AppText>

            {editorError ? (
              <AppText variant="bodySmall" color={colors.danger}>
                {editorError}
              </AppText>
            ) : null}

            <View style={styles.modalActions}>
              <Button
                title="Отмена"
                variant="outline"
                onPress={() => setEditor(null)}
                disabled={isSaving}
                style={styles.modalButton}
              />
              <Button
                title={isSaving ? 'Сохраняем...' : 'Сохранить'}
                onPress={() => void handleSaveEditor()}
                disabled={isSaving}
                style={styles.modalButton}
              />
            </View>
              </Card>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось загрузить чек-лист.';
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.sm,
  },
  weekCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  weekChips: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  weekChip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    minWidth: 36,
    paddingHorizontal: spacing.sm,
  },
  weekChipSelected: {
    backgroundColor: colors.primary,
  },
  listCard: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  listHeader: {
    gap: spacing.md,
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  modalOverlay: {
    backgroundColor: 'rgba(40, 30, 28, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  modalKeyboard: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    gap: spacing.md,
    maxHeight: '90%',
    padding: spacing.xl,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});
