import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  AccessibilityInfo,
} from 'react-native';
import { Card, AppButton, EmptyState, SkeletonBlock } from '../../components/UI';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import * as offlineStore from '../../storage/offlineStore';
import UpgradeModal from '../../components/UpgradeModal';

export default function WorkspaceSetupScreen({ navigation }) {
  const { theme } = useTheme();
  const { setWorkspaces, setCurrentWorkspaceId, refreshWorkspaces, repo, queueAction } = useWorkspace();
  const { logout, user } = useAuth();
  const [showRenewalModal, setShowRenewalModal] = useState(false);

  React.useEffect(() => {
    if (user?.upgradeRequired) {
      setShowRenewalModal(true);
    }
  }, [user]);
  const { width } = useWindowDimensions();
  const isModal = navigation && navigation.canGoBack();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePayload, setUpgradePayload] = useState(null);
  const [skeleton, setSkeleton] = useState(true);

  const compact = width < 380;
  const cardWidth = Math.min(width - (compact ? 24 : 36), 520);

  React.useEffect(() => {
    // Simulate loading for skeleton
    setSkeleton(true);
    const timer = setTimeout(() => setSkeleton(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const openUpgradeModal = (payload) => {
    setUpgradePayload(payload || null);
    setShowUpgradeModal(true);
  };

  const handleCreateWorkspace = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Workspace name required', 'Please enter a workspace name.');
      return;
    }

    setLoading(true);
    try {
      let online = true;
      try {
        // Try online first
        const created = await api.post('/workspaces', {
          name: trimmedName,
          description: description.trim() || undefined,
        });
        const createdId = created?.id;
        if (createdId) {
          setWorkspaces((prev) => {
            const exists = prev.some((item) => item.id === createdId);
            if (exists) { return prev; }
            return [created, ...prev];
          });
          setCurrentWorkspaceId(createdId);
          if (isModal) { navigation.goBack(); }
          return;
        }
        await refreshWorkspaces();
        if (isModal) { navigation.goBack(); }
        return;
      } catch (err) {
        // If fetch fails, treat as offline
        online = false;
        if (err?.data?.code === 'PLAN_LIMIT_REACHED') {
          openUpgradeModal(err.data);
          setLoading(false);
          return;
        }
      }

      // --- OFFLINE WORKSPACE CREATION ---
      if (!online) {
        const localId = `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const localWorkspace = {
          local_id: localId,
          server_id: null,
          name: trimmedName,
          description: description.trim() || '',
          status: 'active',
          sync_status: 'pending_create',
          last_error: null,
          updated_at_local: Date.now(),
        };
        await offlineStore.executeSql(
          `INSERT OR REPLACE INTO local_workspaces (local_id, server_id, name, description, status, sync_status, last_error, updated_at_local)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            localWorkspace.local_id,
            null,
            localWorkspace.name,
            localWorkspace.description,
            localWorkspace.status,
            localWorkspace.sync_status,
            null,
            localWorkspace.updated_at_local,
          ]
        );
        setWorkspaces((prev) => [localWorkspace, ...prev]);
        setCurrentWorkspaceId(localId);
        // Queue outbox action for sync
        await offlineStore.addSyncOutboxAction({
          action_id: `create_workspace_${localId}`,
          action_type: 'create_workspace',
          entity_type: 'workspace',
          entity_local_id: localId,
          workspace_ref: localId,
          payload: {
            name: trimmedName,
            description: description.trim() || '',
          },
          depends_on_action_id: null,
          retry_count: 0,
          next_retry_at: null,
          last_error: null,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
        Alert.alert('Offline', 'Workspace created locally and will sync when online.', [
          { text: 'OK', onPress: () => { if (isModal) navigation.goBack(); } },
        ]);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showRenewalModal && (
        <UpgradeModal
          visible={showRenewalModal}
          onClose={() => setShowRenewalModal(false)}
          onUpgrade={() => {
            setShowRenewalModal(false);
            navigation.navigate('Subscription');
          }}
          title="Renewal required"
          message="Your subscription has expired or requires renewal. Please upgrade your plan to continue."
          plan={user?.plan}
          limit={null}
          current={null}
        />
      )}
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Card style={{ width: cardWidth }}>
          {isModal && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.closeButton}
              accessibilityLabel="Close setup"
              accessibilityRole="button"
            >
              <MaterialIcons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
          <View style={styles.iconWrap}>
            <MaterialIcons name="business" size={30} color={theme.colors.primary} />
          </View>
          {skeleton ? (
            <>
              <SkeletonBlock height={28} width={180} style={{ marginBottom: 8 }} />
              <SkeletonBlock height={16} width={220} style={{ marginBottom: 18 }} />
              <SkeletonBlock height={14} width={120} style={{ marginBottom: 6 }} />
              <SkeletonBlock height={44} width={"100%"} style={{ marginBottom: 10 }} />
              <SkeletonBlock height={14} width={120} style={{ marginBottom: 6 }} />
              <SkeletonBlock height={44} width={"100%"} style={{ marginBottom: 18 }} />
              <SkeletonBlock height={44} width={"100%"} style={{ marginBottom: 10 }} />
            </>
          ) : (
            <>
              <Text
                style={[styles.title, { color: theme.colors.textPrimary, fontSize: compact ? 21 : 24 }]}
                accessibilityRole="header"
              >
                Create your first workspace
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                You need at least one workspace before recording sales, inventory, and debts.
              </Text>

              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Workspace name *</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                placeholder="e.g. Main Store"
                placeholderTextColor={theme.colors.textSecondary}
                value={name}
                onChangeText={setName}
                accessible
                accessibilityLabel="Workspace name"
                accessibilityHint="Enter a name for your workspace"
                returnKeyType="done"
                autoFocus
              />

              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                placeholder="Small note about this workspace"
                placeholderTextColor={theme.colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                accessible
                accessibilityLabel="Workspace description"
                accessibilityHint="Enter a description for your workspace"
              />

              <AppButton
                title="Create Workspace"
                onPress={handleCreateWorkspace}
                loading={loading}
                disabled={loading}
                style={{ marginTop: 14 }}
                accessibilityLabel="Create workspace button"
                accessibilityRole="button"
              />

              {!isModal && (
                <AppButton
                  title="Sign out"
                  onPress={logout}
                  variant="secondary"
                  style={{ marginTop: 10 }}
                  accessibilityLabel="Sign out button"
                  accessibilityRole="button"
                />
              )}
            </>
          )}
        </Card>

        {/* Empty state/CTA for users with no workspaces (if needed in future) */}
        {/*
        {workspaces.length === 0 && !skeleton && (
          <EmptyState
            icon="business"
            title="No workspaces yet"
            subtitle="Create your first workspace to get started."
            style={{ marginTop: 32 }}
          />
        )}
        */}

        <UpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => {
            setShowUpgradeModal(false);
            navigation.navigate('Subscription');
          }}
          title="Workspace limit reached"
          message={upgradePayload?.message || 'Your current plan workspace limit has been reached. Upgrade to continue.'}
          plan={upgradePayload?.meta?.plan || user?.plan}
          limit={upgradePayload?.meta?.limit}
          current={upgradePayload?.meta?.current}
        />
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 4,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59,130,246,0.12)',
    marginBottom: 12,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    marginTop: 6,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  primaryButton: {
    marginTop: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryText: {
    fontWeight: '600',
  },
});
