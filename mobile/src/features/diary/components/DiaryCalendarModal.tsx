import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppText, Button } from '../../../shared/components';
import { colors, radius, spacing } from '../../../shared/theme';
import {
    addMonths,
    formatMonthTitle,
    getMonthMatrix,
    isSameDay,
    isSameMonth,
    startOfDay,
    startOfMonth,
    toDateKey,
    weekdayShort,
} from '../utils/diaryDates';

type DiaryCalendarModalProps = {
    visible: boolean;
    calendarMonth: Date;
    calendarDay: Date;
    onClose: () => void;
    onChangeMonth: (month: Date) => void;
    onChangeDay: (day: Date) => void;
    onApply: (date: Date) => void;
};

export function DiaryCalendarModal({
    visible,
    calendarMonth,
    calendarDay,
    onClose,
    onChangeMonth,
    onChangeDay,
    onApply,
}: DiaryCalendarModalProps) {
    const calendarDays = getMonthMatrix(calendarMonth);
    const calendarWeeks = Array.from({ length: 6 }, (_, weekIndex) =>
        calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7),
    );

    const changeMonth = (nextMonth: Date) => {
        const lastDay = new Date(
            nextMonth.getFullYear(),
            nextMonth.getMonth() + 1,
            0,
        ).getDate();
        const nextDay = startOfDay(
            new Date(
                nextMonth.getFullYear(),
                nextMonth.getMonth(),
                Math.min(calendarDay.getDate(), lastDay),
            ),
        );
        const today = startOfDay(new Date());

        onChangeMonth(startOfMonth(nextMonth));
        onChangeDay(nextDay > today ? today : nextDay);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalBackdrop} onPress={onClose}>
                <Pressable style={styles.modalCard} onPress={() => { }}>
                  <ScrollView
                    contentContainerStyle={styles.modalContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.calendarHeader}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Предыдущий месяц"
                            onPress={() => changeMonth(addMonths(calendarMonth, -1))}
                            style={styles.calendarArrow}
                        >
                            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.primary} />
                        </Pressable>

                        <AppText variant="cardTitle">{formatMonthTitle(calendarMonth)}</AppText>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Следующий месяц"
                            onPress={() => {
                                const next = addMonths(calendarMonth, 1);
                                if (next <= startOfMonth(new Date())) {
                                    changeMonth(next);
                                }
                            }}
                            disabled={addMonths(calendarMonth, 1) > startOfMonth(new Date())}
                            style={[
                                styles.calendarArrow,
                                addMonths(calendarMonth, 1) > startOfMonth(new Date()) &&
                                styles.calendarArrowDisabled,
                            ]}
                        >
                            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
                        </Pressable>
                    </View>

                    <View style={styles.calendarWeekdays}>
                        {weekdayShort.map((label) => (
                            <View key={label} style={styles.calendarWeekdayCell}>
                                <AppText variant="caption" color={colors.textSecondary} align="center">
                                    {label}
                                </AppText>
                            </View>
                        ))}
                    </View>

                    <View style={styles.calendarGrid}>
                        {calendarWeeks.map((week) => (
                            <View key={toDateKey(week[0])} style={styles.calendarWeek}>
                                {week.map((day) => {
                                    const isOutsideMonth = !isSameMonth(day, calendarMonth);
                                    const isFuture = day > startOfDay(new Date());
                                    const isSelected = isSameDay(day, calendarDay);
                                    const isToday = isSameDay(day, new Date());

                                    return (
                                        <Pressable
                                            key={toDateKey(day)}
                                            disabled={isFuture || isOutsideMonth}
                                            onPress={() => onChangeDay(startOfDay(day))}
                                            style={[
                                                styles.calendarDayCell,
                                                isSelected && styles.calendarDaySelected,
                                                isToday && !isSelected && styles.calendarDayToday,
                                                isOutsideMonth && styles.calendarDayOutside,
                                                isFuture && styles.calendarDayDisabled,
                                            ]}
                                        >
                                            <AppText
                                                variant="bodySmall"
                                                align="center"
                                                color={
                                                    isFuture || isOutsideMonth
                                                        ? colors.textMuted
                                                        : isSelected
                                                            ? colors.white
                                                            : colors.textPrimary
                                                }
                                            >
                                                {day.getDate()}
                                            </AppText>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        ))}
                    </View>

                    <View style={styles.calendarActions}>
                        <Button
                            title="Перейти к дате"
                            onPress={() => onApply(calendarDay)}
                        />
                        <Button title="Отмена" variant="outline" onPress={onClose} />
                    </View>
                  </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: {
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
        flex: 1,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modalCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        gap: spacing.md,
        maxHeight: '80%',
        padding: spacing.lg,
        width: '100%',
    },
    modalContent: {
        gap: spacing.md,
    },
    calendarHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    calendarArrow: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.pill,
        height: 36,
        justifyContent: 'center',
        width: 36,
    },
    calendarArrowDisabled: {
        opacity: 0.4,
    },
    calendarWeekdays: {
        flexDirection: 'row',
        marginBottom: spacing.xs,
    },
    calendarWeekdayCell: {
        flex: 1,
        paddingVertical: spacing.xs,
    },
    calendarGrid: {
        marginBottom: spacing.md,
    },
    calendarWeek: {
        flexDirection: 'row',
    },
    calendarDayCell: {
        alignItems: 'center',
        borderRadius: radius.pill,
        flex: 1,
        height: 40,
        justifyContent: 'center',
    },
    calendarDaySelected: {
        backgroundColor: colors.primary,
    },
    calendarDayToday: {
        borderColor: colors.primary,
        borderWidth: 1,
    },
    calendarDayDisabled: {
        opacity: 0.4,
    },
    calendarDayOutside: {
        opacity: 0.32,
    },
    calendarActions: {
        gap: spacing.sm,
    },
});
