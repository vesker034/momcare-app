import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppText } from '../../../shared/components';
import { colors, radius, spacing } from '../../../shared/theme';

type ReminderButtonProps = {
    label?: string;
};

export function ReminderButton({ label = 'Настроить напоминания' }: ReminderButtonProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            disabled
            style={[styles.reminderButton, styles.reminderButtonDisabled]}
        >
            <MaterialCommunityIcons
                name="bell-outline"
                size={18}
                color={colors.textMuted}
            />
            <AppText variant="bodySmall" color={colors.textMuted} serif>
                {label}
            </AppText>
            <View style={styles.reminderBadge}>
                <AppText variant="caption" color={colors.white} serif>
                    Скоро
                </AppText>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    reminderButton: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderRadius: radius.pill,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.sm,
        justifyContent: 'center',
        minHeight: 44,
        paddingHorizontal: spacing.lg,
    },
    reminderButtonDisabled: {
        opacity: 0.6,
    },
    reminderBadge: {
        backgroundColor: colors.textMuted,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
    },
});