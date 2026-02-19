import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Card, Subtle } from '../components/UI';
import { useTheme } from '../theme/ThemeContext';

const TX = [
  { id: '1', type: 'Sale', amount: 120, branch: 'Outlet', date: 'Today' },
  { id: '2', type: 'Expense', amount: 45, branch: 'Main Store', date: 'Today' }
];

export default function TransactionsScreen() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList data={TX} keyExtractor={(t) => t.id} contentContainerStyle={{ padding: 12 }} renderItem={({ item }) => (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>{item.type}</Text>
              <Subtle>{item.branch} • {item.date}</Subtle>
            </View>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>${item.amount}</Text>
          </View>
        </Card>
      )} ListEmptyComponent={() => <View style={{ padding: 20 }}><Subtle>No transactions</Subtle></View>} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
