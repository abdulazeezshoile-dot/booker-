import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export const Card = ({ children, style }) => {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  return <View style={[styles.card, { backgroundColor: theme.colors.card, shadowColor: '#000' }, style]}>{children}</View>;
};

export const Title = ({ children }) => {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  return <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{children}</Text>;
};

export const Subtle = ({ children }) => {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  return <Text style={[styles.subtle, { color: theme.colors.textSecondary }]}>{children}</Text>;
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
