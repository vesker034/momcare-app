import { Platform } from 'react-native';

const DEFAULT_WEB_API_URL = 'http://localhost:3000';
const DEFAULT_ANDROID_EMULATOR_API_URL = 'http://10.0.2.2:3000';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  (Platform.OS === 'android'
    ? DEFAULT_ANDROID_EMULATOR_API_URL
    : DEFAULT_WEB_API_URL);
