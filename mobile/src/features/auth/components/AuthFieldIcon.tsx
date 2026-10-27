import { Image, Pressable, StyleSheet, type ImageSourcePropType } from 'react-native';

import { colors, spacing } from '../../../shared/theme';

const eyeIcon = require('../../../../assets/icons/auth/eye.png');
const eyeOffIcon = require('../../../../assets/icons/auth/eye-off.png');

type AuthFieldIconProps = {
  source: ImageSourcePropType;
};

export function AuthFieldIcon({ source }: AuthFieldIconProps) {
  return (
    <Image
      resizeMode="contain"
      source={source}
      style={styles.icon}
    />
  );
}

type PasswordToggleProps = {
  isVisible: boolean;
  onPress: () => void;
};

export function PasswordToggle({ isVisible, onPress }: PasswordToggleProps) {
  return (
    <Pressable
      accessibilityLabel={isVisible ? 'Скрыть пароль' : 'Показать пароль'}
      accessibilityRole="button"
      hitSlop={spacing.sm}
      onPress={onPress}
      style={styles.pressable}
    >
      <Image
        resizeMode="contain"
        source={isVisible ? eyeOffIcon : eyeIcon}
        style={styles.icon}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  icon: {
    height: 20,
    tintColor: colors.border,
    width: 20,
  },
});
