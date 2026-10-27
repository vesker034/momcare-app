import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '../src/features/auth/context/AuthContext';
import { colors } from '../src/shared/theme';

export default function IndexRoute() {
  const { status } = useAuth();

  if (status === 'bootstrapping') {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={status === 'authenticated' ? '/tabs/home' : '/welcome'} />;
}

const styles = StyleSheet.create({
  loader: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
