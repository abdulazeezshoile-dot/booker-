import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../api/client';
import { cacheTransactions, getCachedTransactions } from '../storage/offlineStore';
import { Card, Subtle, EmptyState, SkeletonBlock, AppButton } from '../components/UI';
import { Linking, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';



export default function SalesScreen({ navigation }) {
  const { theme } = useTheme();
  const workspace = useWorkspace();
  const { repo } = workspace;
  const { width } = useWindowDimensions();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contentWidth = Math.min(width - 24, 860);
  const listPadding = width < 390 ? 12 : 16;

  // Local-first list rendering with pending overlay
  const loadSales = useCallback(async () => {
    if (!workspace.currentWorkspaceId) {
      setSales([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Always read from local repo first
      const localRows = await repo.getTransactions();
      let localList = [];
      if (localRows?.rows?.length > 0) {
        for (let i = 0; i < localRows.rows.length; i++) {
          const row = localRows.rows.item(i);
          const data = row.data ? JSON.parse(row.data) : {};
          if (data.type === 'sale') {
            localList.push({ ...data, local_id: row.local_id, sync_status: row.sync_status });
          }
        }
      }
      setSales(localList);

      // Optionally, fetch remote and update local cache if online
      try {
        const data = await api.get(`/workspaces/${workspace.currentWorkspaceId}/transactions`, {
          type: 'sale',
          take: 50,
        });
        const list = Array.isArray(data) ? data : [];
        setSales(list);
        cacheTransactions(workspace.currentWorkspaceId, 'sale', list).catch(() => null);
      } catch (err) {
        // Ignore fetch error, stay local
      }
    } catch (err) {
      setError('Unable to load sales');
    } finally {
      setLoading(false);
    }
  }, [workspace.currentWorkspaceId, repo]);
  
  const sendWhatsAppReceipt = (phone, name, receiptUrl) => {
    if (!phone) {
      Alert.alert('No phone number', 'No customer phone number available for WhatsApp receipt.');
      return;
    }
    const message = `Hello ${name}, here is your sales receipt.\n${receiptUrl ? `View/download: ${receiptUrl}` : ''}`;
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encoded}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open WhatsApp', 'Please ensure WhatsApp is installed.');
    });
  };

  // Add sync status badge to each row (Not synced, Syncing, Failed) and retry button for failed
  const renderSyncBadge = (item) => {
    if (item.sync_status === 'pending_create' || item.sync_status === 'pending_update') {
      return <Text style={{ color: '#FFA500', fontSize: 11, marginLeft: 6 }}>Not synced</Text>;
    }
    if (item.sync_status === 'failed') {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6 }}>
          <Text style={{ color: '#E53935', fontSize: 11 }}>Failed</Text>
          <TouchableOpacity
            onPress={() => handleRetrySync(item)}
            style={{ marginLeft: 4 }}
            accessibilityLabel="Retry sync"
          >
            <MaterialIcons name="refresh" size={16} color="#E53935" />
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  // Row-level retry for failed syncs
  const handleRetrySync = async (item) => {
    if (!workspace.queueAction || !workspace.currentWorkspaceId) return;
    try {
      let action = null;
      if (item.sync_status === 'failed') {
        if (item.local_id && item.pending_action) {
          action = { ...item.pending_action };
        } else {
          action = {
            method: 'put',
            path: `/workspaces/${workspace.currentWorkspaceId}/transactions/${item.id}`,
            body: { ...item },
          };
        }
        await workspace.queueAction(action);
        Alert.alert('Retry', 'Sync retry queued and will sync once online');
      }
    } catch (err) {
      Alert.alert('Error', err?.message || 'Unable to retry sync');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, [loadSales]),
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.pageHeader, { alignSelf: 'center', width: contentWidth, paddingHorizontal: listPadding }]}> 
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
          style={[styles.backButton, { borderColor: theme.colors.border, opacity: navigation.canGoBack() ? 1 : 0.35 }]}
          disabled={!navigation.canGoBack()}
        >
          <MaterialIcons name="arrow-back" size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>Sales</Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
            Sold goods history for this workspace
          </Text>
        </View>
        <AppButton title="Record" icon="add" variant="primary" onPress={() => navigation.navigate('RecordSale')} />
      </View>

      {error ? (
        <View style={{ alignSelf: 'center', width: contentWidth, paddingHorizontal: listPadding }}>
          <Subtle>{error}</Subtle>
        </View>
      ) : null}

      {loading ? (
        <View style={{ alignSelf: 'center', width: contentWidth, paddingHorizontal: listPadding, marginTop: 12 }}>
          <SkeletonBlock height={20} width="40%" style={{ marginBottom: 12 }} />
          <SkeletonBlock height={72} style={{ marginBottom: 12 }} />
          <SkeletonBlock height={72} style={{ marginBottom: 12 }} />
          <SkeletonBlock height={72} />
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item, index) => (item?.id ? String(item.id) : `sale-${index}`)}
          contentContainerStyle={{ paddingHorizontal: listPadding, paddingBottom: 20 }}
          style={{ alignSelf: 'center', width: contentWidth }}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-long"
              title="No sales yet"
              subtitle="Record a sale to start tracking sold goods"
              style={{ marginTop: 24 }}
            />
          }
          renderItem={({ item }) => (
            <Card style={[styles.itemCard, { marginBottom: 14 }]}> 
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>
                    {item.customerName || 'Walk-in customer'}
                  </Text>
                  <Subtle>{new Date(item.createdAt).toLocaleString()}</Subtle>
                  <Subtle>Qty: {Number(item.quantity || 0)} • Unit: ₦{Number(item.unitPrice || 0).toLocaleString()}</Subtle>
                  {item.phone ? (
                    <Subtle>Phone: {item.phone}</Subtle>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: theme.colors.success, fontWeight: '700' }}>
                    ₦{Number(item.totalAmount || 0).toLocaleString()}
                  </Text>
                  <AppButton
                    title="Send Receipt"
                    icon="whatsapp"
                    variant="primary"
                    style={{ marginTop: 6, backgroundColor: '#25D366', borderColor: '#25D366' }}
                    onPress={() => sendWhatsAppReceipt(item.phone, item.customerName || 'Customer', item.receiptUrl)}
                    accessibilityLabel={`Send WhatsApp receipt to ${item.customerName || 'Customer'}`}
                  />
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
    gap: 10,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  itemCard: {
    marginBottom: 10,
  },
});
