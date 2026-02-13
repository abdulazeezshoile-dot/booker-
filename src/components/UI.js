import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export const Card = ({ children, style }) => {
  const { theme } = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }, style]}>{children}</View>;
};

export const Title = ({ children }) => {
  const { theme } = useTheme();
  return <Text style={[styles.title, { color: theme.text }]}>{children}</Text>;
};

export const Subtle = ({ children }) => {
  const { theme } = useTheme();
  return <Text style={[styles.subtle, { color: theme.muted }]}>{children}</Text>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3
  },
  title: { fontSize: 16, fontWeight: '600' },
  subtle: { fontSize: 13 }
});

export default { Card, Title, Subtle };
