import { StatusBar } from 'expo-status-bar';
import type { RefObject } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme';

type ScreenProps = ViewProps & {
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  withHorizontalPadding?: boolean;
  scrollRef?: RefObject<ScrollView | null>;
};

export function Screen({
  children,
  scroll = true,
  contentStyle,
  withHorizontalPadding = true,
  scrollRef,
  style,
  ...props
}: ScreenProps) {
  const content = (
    <View
      {...props}
      style={[
        styles.content,
        withHorizontalPadding && styles.horizontalPadding,
        style,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  horizontalPadding: {
    paddingHorizontal: spacing.xl,
  },
});
