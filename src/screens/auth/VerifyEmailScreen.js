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
import { Card, AppButton } from '../../components/UI';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeContext';

export default function VerifyEmailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const initialEmail = route?.params?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const isCompact = width < 380;
  const formWidth = Math.min(width - (isCompact ? 24 : 36), 460);

  const handleVerify = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { email: email.trim(), code: code.trim() });
      navigation.navigate('Login');
    } catch (err) {
      setError(err?.message || 'Unable to verify email');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: email.trim() });
    } catch (err) {
      setError(err?.message || 'Unable to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Card style={{ width: formWidth }}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Verify Email</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Enter the 6-digit code sent to your email.</Text>

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessible
          accessibilityLabel="Email address"
        />

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Verification code</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="number-pad"
          maxLength={6}
          accessible
          accessibilityLabel="Verification code"
        />

        {error ? <Text style={{ color: theme.colors.danger || '#d32f2f', marginBottom: 10 }}>{error}</Text> : null}

        <AppButton
          title={loading ? 'Verifying…' : 'Verify email'}
          onPress={handleVerify}
          loading={loading}
          disabled={loading || !email.trim() || !code.trim()}
          style={{ marginTop: 14 }}
          accessibilityLabel="Verify email"
        />
        <AppButton
          title={resending ? 'Resending…' : 'Resend code'}
          onPress={handleResend}
          loading={resending}
          disabled={resending}
          variant="secondary"
          style={{ marginTop: 10 }}
          accessibilityLabel="Resend code"
        />
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  form: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 13, marginBottom: 12 },
  label: { fontSize: 12, marginTop: 8 },
  input: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  button: { padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
