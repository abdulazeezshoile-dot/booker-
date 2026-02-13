import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function ForgotPasswordScreen({ navigation }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={{ color: theme.muted }}>Enter your account email</Text>
        <TextInput style={[styles.input, { color: theme.text }]} placeholder="you@store.com" placeholderTextColor={theme.muted} />
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Send reset link</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  card: { width: '100%', padding: 16, borderRadius: 12 },
  input: { marginTop: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  button: { marginTop: 12, padding: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' }
});
