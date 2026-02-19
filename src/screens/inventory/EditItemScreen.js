import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function EditItemScreen({ navigation }) {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, padding: 12 }]}>
      <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>Add / Edit Item</Text>
      <TextInput placeholder="Item name" placeholderTextColor={theme.colors.textSecondary} style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.textPrimary }]} />
      <TextInput placeholder="SKU" placeholderTextColor={theme.colors.textSecondary} style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.textPrimary }]} />
      <TextInput placeholder="Quantity" placeholderTextColor={theme.colors.textSecondary} style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.textPrimary }]} keyboardType="numeric" />
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.goBack()}>
        <Text style={{ color: '#fff' }}>Save item</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, input: { marginTop: 12, padding: 12, borderRadius: 10 }, button: { marginTop: 12, padding: 12, borderRadius: 10, alignItems: 'center' } });
