import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Card, Subtle } from '../components/UI';

const DUMMY = new Array(12).fill(0).map((_, i) => ({ id: i + '', name: `Item ${i + 1}`, sku: `SKU${1000 + i}`, qty: Math.floor(Math.random() * 30), cost: (10 + i).toFixed(2), price: (15 + i).toFixed(2) }));

export default function InventoryScreen() {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const filtered = DUMMY.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()) || d.sku.toLowerCase().includes(query.toLowerCase()));
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={{ padding: 12 }}>
        <TextInput placeholder="Search items or SKU" placeholderTextColor={theme.muted} style={[styles.search, { backgroundColor: theme.card, color: theme.text }]} value={query} onChangeText={setQuery} />
      </View>
      <FlatList data={filtered} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: 12 }} renderItem={({ item }) => (
        <Card style={{ padding: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontWeight: '700', color: theme.text }}>{item.name}</Text>
              <Subtle>{item.sku}</Subtle>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: theme.text }}>{item.qty} pcs</Text>
              <Subtle>${item.price} • cost ${item.cost}</Subtle>
              {item.qty < 5 && <Text style={{ color: theme.danger, marginTop: 6 }}>Low stock</Text>}
            </View>
          </View>
        </Card>
      )} ListEmptyComponent={() => <View style={{ padding: 20 }}><Subtle>No items yet</Subtle></View>} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, search: { padding: 12, borderRadius: 10 } });
