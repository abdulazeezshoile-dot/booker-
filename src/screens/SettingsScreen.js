import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={{ padding: 12 }}>
        <Text style={{ color: theme.text, fontWeight: '700' }}>Profile</Text>
        <Text style={{ color: theme.muted }}>{user?.email}</Text>
      </View>
      <TouchableOpacity style={[styles.row, { backgroundColor: theme.card }]} onPress={toggle}>
        <Text style={{ color: theme.text }}>Toggle theme</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.row, { backgroundColor: theme.card }]} onPress={logout}>
        <Text style={{ color: theme.text }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, row: { padding: 14, margin: 12, borderRadius: 10 } });
