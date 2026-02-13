import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Card, Subtle } from '../components/UI';

export default function ReportsScreen() {
  const { theme } = useTheme();
  const [range, setRange] = useState('Daily');
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={{ padding: 12 }}>
        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 18 }}>Reports</Text>
        <Subtle>Select range</Subtle>
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          {['Daily', 'Weekly', 'Monthly'].map((r) => (
            <TouchableOpacity key={r} onPress={() => setRange(r)} style={[styles.range, { backgroundColor: range === r ? theme.primary : theme.card }]}>
              <Text style={{ color: range === r ? '#fff' : theme.text }}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Card style={{ margin: 12 }}>
        <Text style={{ color: theme.text, fontWeight: '700' }}>Sales vs Expenses</Text>
        <Subtle>Chart placeholder</Subtle>
      </Card>

      <Card style={{ marginHorizontal: 12 }}>
        <Text style={{ color: theme.text, fontWeight: '700' }}>Inventory movement</Text>
        <Subtle>Chart placeholder</Subtle>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, range: { padding: 10, borderRadius: 8, marginRight: 8 } });
