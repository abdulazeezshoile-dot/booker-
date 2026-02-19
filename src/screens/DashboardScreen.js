import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Card, Title, Subtle } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const { user } = useAuth();
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Good morning</Text>
          <Subtle>{user ? `${user.name} • ${user.role}` : 'Guest'}</Subtle>
        </View>
      </View>

      <Card style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Title>Total inventory value</Title>
            <Text style={{ color: theme.colors.textPrimary, fontSize: 20, fontWeight: '700', marginTop: 6 }}>$12,450</Text>
            <Subtle>Across {user?.branches?.length || 0} branches</Subtle>
          </View>
          <View style={{ justifyContent: 'center' }}>
            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Admin</Text>
          </View>
        </View>
      </Card>

      <View>
        <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>Quick actions</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <TouchableOpacity style={[styles.action, { backgroundColor: theme.colors.card }]}>
            <Text style={{ color: theme.colors.textPrimary }}>+ Add item</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.action, { backgroundColor: theme.colors.card }]}>
            <Text style={{ color: theme.colors.textPrimary }}>+ Record sale</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.action, { backgroundColor: theme.colors.card }]}>
            <Text style={{ color: theme.colors.textPrimary }}>+ Expense</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={{ color: theme.colors.textSecondary, marginTop: 14 }}>Recent activity</Text>
      <Card>
        <View>
          <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>Sale recorded</Text>
          <Subtle>John • Outlet • $120 • 2h ago</Subtle>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  action: { padding: 12, borderRadius: 10, width: '30%', alignItems: 'center' }
});
