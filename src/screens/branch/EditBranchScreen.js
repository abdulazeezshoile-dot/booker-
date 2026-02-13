import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function EditBranchScreen({ navigation }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background, padding: 12 }]}>
      <Text style={{ color: theme.text, fontWeight: '700' }}>Create / Edit Branch</Text>
      <TextInput placeholder="Branch name" placeholderTextColor={theme.muted} style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} />
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => navigation.goBack()}>
        <Text style={{ color: '#fff' }}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, input: { marginTop: 12, padding: 12, borderRadius: 10 }, button: { marginTop: 12, padding: 12, borderRadius: 10, alignItems: 'center' } });
