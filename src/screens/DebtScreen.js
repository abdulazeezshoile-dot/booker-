import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../api/client';
import { cacheDebts, getCachedDebts } from '../storage/offlineStore';
import { Card, Subtle, EmptyState, SkeletonBlock, AppButton } from '../components/UI';
import { MaterialIcons } from '@expo/vector-icons';

const getDueInfo = (dueDate) => {
  if (!dueDate) return { label: 'No due date', overdue: false };
  const due = new Date(dueDate);
  const now = new Date();

  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { label: `${Math.abs(diffDays)} day(s) overdue`, overdue: true };
  }
  return { label: `${diffDays} day(s) remaining`, overdue: false };
};

export default function DebtScreen({ navigation }) {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const { currentWorkspaceId, repo } = useWorkspace();
  const { width } = useWindowDimensions();

  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const isCompact = width < 390;
  const contentWidth = Math.min(width - (isCompact ? 20 : 32), 820);
  const edgePadding = isCompact ? 12 : 16;

  useFocusEffect(
    React.useCallback(() => {
      setRefreshTick((prev) => prev + 1);
    }, []),
  );

  useEffect(() => {
    const loadDebts = async () => {
      if (!currentWorkspaceId) {
        setDebts([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Always read from local repo first
        const localRows = await repo.getDebts();
        let localList = [];
        if (localRows?.rows?.length > 0) {
          for (let i = 0; i < localRows.rows.length; i++) {
            const row = localRows.rows.item(i);
            const data = row.data ? JSON.parse(row.data) : {};
            if (data.type === 'debt') {
              localList.push({ ...data, local_id: row.local_id, sync_status: row.sync_status });
            }
          }
        }
        setDebts(localList);

        // Optionally, fetch remote and update local cache if online
        try {
          const data = await api.get(`/workspaces/${currentWorkspaceId}/transactions`, {
            type: 'debt',
          });
          const list = Array.isArray(data) ? data : [];
          setDebts(list);
          cacheDebts(currentWorkspaceId, list).catch(() => null);
        } catch (err) {
          // Ignore fetch error, stay local
        }
      } catch (err) {
        setError('Unable to load debts');
      } finally {
        setLoading(false);
      }
    };

    loadDebts();
  }, [currentWorkspaceId, refreshTick, repo]);

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
    if (!repo || !currentWorkspaceId) return;
    try {
      // Try to re-queue the failed action
      let action = null;
      if (item.sync_status === 'failed') {
        if (item.local_id && item.pending_action) {
          action = { ...item.pending_action };
        } else {
          action = {
            method: 'put',
            path: `/workspaces/${currentWorkspaceId}/transactions/${item.id}`,
            body: { ...item },
          };
        }
        if (repo.queueAction) {
          await repo.queueAction(action);
        }
        Alert.alert('Retry', 'Sync retry queued and will sync once online');
      }
    } catch (err) {
      Alert.alert('Error', err?.message || 'Unable to retry sync');
    }
  };

  const sendWhatsApp = (phone, name, amount) => {
    const message = `Hello ${name}, this is a reminder from your shop regarding your balance of ₦${amount.toFixed(
      2,
    )}. Please make payment when you can.`;
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encoded}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open WhatsApp', 'Please ensure WhatsApp is installed.');
    });
  };

  const markAsPaid = async (transactionId) => {
    try {
      await api.put(`/workspaces/${currentWorkspaceId}/transactions/${transactionId}/status`, {
        status: 'completed',
      });
      setDebts((prev) =>
        prev.map((d) => (d.id === transactionId ? { ...d, status: 'completed' } : d)),
      );
    } catch (err) {
      Alert.alert('Error', err?.message || 'Unable to update debt status');
    }
  };

  const pendingCount = useMemo(() => debts.filter((d) => d.status === 'pending').length, [debts]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.header, { alignSelf: 'center', width: contentWidth, paddingHorizontal: edgePadding }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
            style={[styles.backButton, { borderColor: theme.colors.border, opacity: navigation.canGoBack() ? 1 : 0.35 }]}
            disabled={!navigation.canGoBack()}
          >
            <MaterialIcons name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View>
          <Text style={[styles.title, { color: theme.colors.textPrimary, fontSize: isCompact ? 20 : 22 }]}>Who Owes Me</Text>
          <Subtle>
            {pendingCount} pending • Tap the button to send a reminder
          </Subtle>
          {error ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text> : null}
          </View>
        </View>
        <AppButton title="Add" icon="add" variant="primary" onPress={() => navigation.navigate('RecordDebt')} style={styles.addButton} />
      </View>

      {loading ? (
        <View style={{ alignSelf: 'center', width: contentWidth, paddingHorizontal: edgePadding, marginTop: 24 }}>
          <SkeletonBlock height={28} width="50%" style={{ marginBottom: 18, borderRadius: 8 }} />
          <SkeletonBlock height={90} style={{ marginBottom: 18, borderRadius: 16 }} />
          <SkeletonBlock height={90} style={{ marginBottom: 18, borderRadius: 16 }} />
          <SkeletonBlock height={90} style={{ marginBottom: 18, borderRadius: 16 }} />
        </View>
      ) : (
        <FlatList
          data={debts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: edgePadding, paddingBottom: 32 }}
          style={{ alignSelf: 'center', width: contentWidth }}
          ListEmptyComponent={() => (
            <EmptyState
              icon="account-balance-wallet"
              title="No debts yet"
              subtitle="Record debt entries to track who owes your business"
              style={{ marginTop: 32 }}
              ctaLabel="Record a debt"
              onCtaPress={() => navigation.navigate('RecordDebt')}
              accessibilityLabel="No debts yet. Record a debt entry."
            />
          )}
          renderItem={({ item }) => {
            const dueInfo = getDueInfo(item.dueDate);
            const isPending = item.status === 'pending';

            return (
              <Card style={[styles.card, { borderColor: theme.colors.border, marginBottom: 18, borderRadius: 14, elevation: 2 }]}
                accessible accessibilityLabel={`Debt for ${item.customerName || 'Unknown'}: ${dueInfo.label}, Status: ${isPending ? 'Pending' : 'Paid'}`}
              >
                <View style={styles.row}>
                  <View style={styles.info}>
                    <Text style={{ color: theme.colors.textPrimary, fontWeight: '700', fontSize: isCompact ? 16 : 18 }}>
                      {item.customerName || 'Unknown'}
                    </Text>
                    <Subtle style={{ marginTop: 4 }}>{dueInfo.label}</Subtle>
                    <Subtle style={{ marginTop: 2 }}>Status: {isPending ? 'Pending' : 'Paid'}</Subtle>
                  </View>
                  <View style={styles.amountContainer}>
                    <Text style={{ color: theme.colors.error, fontWeight: '700', fontSize: 17 }}>
                      ₦{parseFloat(item.totalAmount).toLocaleString()}
                    </Text>
                    <AppButton
                      title="WhatsApp"
                      variant="primary"
                      onPress={() => sendWhatsApp(item.phone || '', item.customerName || 'Friend', parseFloat(item.totalAmount))}
                      style={[styles.whatsappButton, { backgroundColor: '#25D366', borderColor: '#25D366', marginTop: 8 }]}
                      accessibilityLabel={`Send WhatsApp reminder to ${item.customerName || 'Friend'}`}
                    />
                    {isPending ? (
                      <AppButton
                        title="Mark Paid"
                        variant="primary"
                        onPress={() => markAsPaid(item.id)}
                        style={[styles.payButton, { backgroundColor: theme.colors.success, borderColor: theme.colors.success, marginTop: 8 }]}
                        accessibilityLabel={`Mark debt for ${item.customerName || 'Unknown'} as paid`}
                      />
                    ) : null}
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  errorText: { marginTop: 8 },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1 },
  amountContainer: { alignItems: 'flex-end', marginLeft: 12, maxWidth: '45%' },
  whatsappButton: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  payButton: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
});
