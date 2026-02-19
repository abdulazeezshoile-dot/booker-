import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Subtle } from '../../components/UI';
import { useTheme } from '../../theme/ThemeContext';

const BR = [{ id: '1', name: 'Main Store' }, { id: '2', name: 'Outlet' }];

export default function BranchListScreen() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList data={BR} keyExtractor={(b) => b.id} contentContainerStyle={{ padding: 12 }} renderItem={({ item }) => (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>{item.name}</Text>
              <Subtle>2 managers</Subtle>
            </View>
            <TouchableOpacity>
              <Text style={{ color: theme.colors.primary }}>Manage</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )} ListEmptyComponent={() => <View style={{ padding: 20 }}><Subtle>No branches yet</Subtle></View>} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
