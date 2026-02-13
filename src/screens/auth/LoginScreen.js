import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.logo, { color: theme.text }]}>Booker</Text>
      <View style={[styles.form, { backgroundColor: theme.card }]}>
        <Text style={[styles.label, { color: theme.muted }]}>Email</Text>
        <TextInput style={[styles.input, { color: theme.text }]} value={email} onChangeText={setEmail} placeholder="you@store.com" placeholderTextColor={theme.muted} />
        <Text style={[styles.label, { color: theme.muted }]}>Password</Text>
        <TextInput style={[styles.input, { color: theme.text }]} value={password} onChangeText={setPassword} placeholder="••••••" placeholderTextColor={theme.muted} secureTextEntry />
        <TouchableOpacity onPress={() => navigation.navigate('Forgot')}>
          <Text style={{ color: theme.primary, marginBottom: 12 }}>Forgot password?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => login(email, password)}>
          <Text style={styles.buttonText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  logo: { fontSize: 36, fontWeight: '700', marginBottom: 24 },
  form: { width: '100%', borderRadius: 14, padding: 16 },
  label: { fontSize: 12, marginTop: 8 },
  input: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginTop: 6, backgroundColor: 'transparent' },
  button: { padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  buttonText: { color: '#fff', fontWeight: '700' }
});
