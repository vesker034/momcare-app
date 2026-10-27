import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AppText, Card, EmptyState } from '../../../shared/components';
import { colors, radius, spacing } from '../../../shared/theme';
import {
    formatDiaryDate,
    getMoodEmojis,
    getSymptomLabels,
} from '../mappers/diaryMappers';
import type { DiaryEntry } from '../../../types/api';

type DiaryHistorySectionProps = {
    entries: DiaryEntry[];
    isLoading: boolean;
    error: string;
    onSeeAll: () => void;
};

export function DiaryHistorySection({
    entries,
    isLoading,
    error,
    onSeeAll,
}: DiaryHistorySectionProps) {
    return (
        <>
            <View style={styles.historyHeader}>
                <AppText variant="cardTitle">История записей</AppText>
                <Pressable
                    accessibilityRole="button"
                    onPress={onSeeAll}
                >
                    <AppText variant="bodySmall" color={colors.primary} serif>
                        См. все
                    </AppText>
                </Pressable>
            </View>

            {isLoading ? (
                <Card variant="muted" shadow="none" style={styles.stateCard}>
                    <AppText variant="bodySmall" color={colors.textSecondary}>
                        Загружаем записи дневника...
                    </AppText>
                </Card>
            ) : null}

            {!isLoading && error ? (
                <Card variant="muted" shadow="none" style={styles.stateCard}>
                    <AppText variant="bodySmall" color={colors.danger}>
                        {error}
                    </AppText>
                </Card>
            ) : null}

            {!isLoading && !error && entries.length === 0 ? (
                <Card variant="muted" shadow="none" style={styles.stateCard}>
                    <EmptyState
                        title="Записей пока нет"
                        description="Сохраните первое самочувствие, и оно появится здесь."
                    />
                </Card>
            ) : null}

            {!isLoading && !error && entries.length > 0 ? (
                <View style={styles.historyList}>
                    {entries.slice(0, 3).map((entry) => (
                        <HistoryItem key={entry.id} entry={entry} />
                    ))}
                </View>
            ) : null}
        </>
    );
}

type HistoryItemProps = {
    entry: DiaryEntry;
};

function HistoryItem({ entry }: HistoryItemProps) {
    const symptomLabels = getSymptomLabels(entry.symptoms).filter(
        (label) => label !== 'Без симптомов',
    );
    const symptomText = symptomLabels.length > 0 ? symptomLabels.join(', ') : 'Все было хорошо';
    const displayDate = formatDiaryDate(entry.date);
    const [displayDay, displayMonth] = displayDate.split(' ');

    return (
        <Pressable
            accessibilityLabel="Открыть запись дневника"
            accessibilityRole="button"
            onPress={() =>
                router.push({
                    pathname: '/tabs/diary/[entryId]',
                    params: {
                        entryId: entry.id,
                        returnTo: '/tabs/diary',
                    },
                })
            }
            style={({ pressed }) => [styles.historyItem, pressed && styles.pressed]}
        >
            <View style={styles.historyDate}>
                <AppText variant="caption" color={colors.textMuted} align="center">
                    {displayMonth ?? ''}
                </AppText>
                <AppText variant="title" align="center">
                    {displayDay}
                </AppText>
            </View>
            <View style={styles.historyCopy}>
                <AppText variant="bodySmall" color={colors.textPrimary} serif>
                    {getMoodEmojis(entry.moods)[0] ?? '😐'} {entry.note || symptomText}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                    Сон: {entry.sleepHours.toFixed(entry.sleepHours % 1 === 0 ? 0 : 1)}ч • Энергия: {entry.energyLevel}/5
                </AppText>
            </View>
            <MaterialCommunityIcons
                name="chevron-right"
                size={26}
                color={colors.textSecondary}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    historyHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    stateCard: {
        gap: spacing.md,
        padding: spacing.lg,
    },
    historyList: {
        gap: spacing.md,
    },
    historyItem: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.borderSoft,
        borderRadius: radius.xl,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        minHeight: 72,
        padding: spacing.md,
    },
    historyDate: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        height: 58,
        justifyContent: 'center',
        width: 58,
    },
    historyCopy: {
        flex: 1,
        gap: spacing.xs,
    },
    pressed: {
        opacity: 0.76,
    },
});