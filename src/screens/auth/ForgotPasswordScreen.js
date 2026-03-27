import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { AppButton, Card } from '../../components/UI';
import { api } from '../../api/client';

export default function ForgotPasswordScreen({ navigation }) {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const cardWidth = Math.min(width - (isCompact ? 24 : 36), 460);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSendReset = async () => {
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSuccess(true);
    } catch (err) {
      setError(err?.message || 'Unable to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={[styles.brand, { color: theme.colors.textPrimary }]}>BizRecord</Text>
      <Text style={[styles.title, { color: theme.colors.textPrimary, fontSize: isCompact ? 20 : 22 }]}>Reset Password</Text>
      <Card style={{ width: cardWidth }}>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 8 }}>Enter your account email</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
          placeholder="you@store.com"
          placeholderTextColor={theme.colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessible
          accessibilityLabel="Email address"
          returnKeyType="done"
        />
        {error ? <Text style={{ color: theme.colors.danger || '#d32f2f', marginTop: 10 }}>{error}</Text> : null}
        {success ? (
          <Text style={{ color: theme.colors.success || '#388e3c', marginTop: 10 }}>
            Reset link sent! Check your email.
          </Text>
        ) : null}
        <AppButton
          title={loading ? 'Sending…' : 'Send reset link'}
          onPress={handleSendReset}
          loading={loading}
          disabled={loading || !email.trim()}
          style={{ marginTop: 16 }}
          accessibilityLabel="Send reset link"
        />
        <AppButton
          title="Back to login"
          onPress={() => navigation.navigate('Login')}
          variant="secondary"
          style={{ marginTop: 10 }}
          accessibilityLabel="Back to login"
        />
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20, justifyContent: 'center' },
  brand: { fontSize: 28, fontWeight: '700', marginBottom: 12 },
  title: { fontWeight: '700', marginBottom: 12 },
  input: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
});
