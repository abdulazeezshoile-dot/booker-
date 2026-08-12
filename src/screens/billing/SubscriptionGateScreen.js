import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { AppButton } from '../../components/UI';
import { getSubscriptionUrl } from '../../services/websiteUrl';

export default function SubscriptionGateScreen({ onRetry }) {
  const { theme } = useTheme();

  const openWebsite = () => {
    Linking.openURL(getSubscriptionUrl()).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.warning}18` }]}>
          <MaterialIcons name="lock-clock" size={28} color={theme.colors.warning} />
        </View>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Subscription required
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Your BizRecord subscription is inactive or expired. Subscribe on the
          website to keep using the app.
        </Text>
        <AppButton
          title="Subscribe on the website"
          icon="language"
          onPress={openWebsite}
          style={{ marginTop: 8 }}
        />
        <AppButton
          title="Try again"
          variant="secondary"
          onPress={onRetry}
          style={{ marginTop: 10 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
  },
});
