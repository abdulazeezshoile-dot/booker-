import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { Card, AppButton, Title } from '../../components/UI';
import { api } from '../../api/client';
import * as offlineStore from '../../storage/offlineStore';
import { getSubscriptionUrl } from '../../services/websiteUrl';

const PLAN_ORDER = ['basic', 'pro'];
const DEFAULT_ADDONS = {
  workspaceSlot: { monthly: 1500, yearly: Math.round(1500 * 12 * 0.8) },
  staffSeat: { monthly: 500, yearly: Math.round(500 * 12 * 0.8) },
  whatsappBundle100: { monthly: 2000, yearly: Math.round(2000 * 12 * 0.8) },
};

function normalizePlansResponse(payload) {
  if (payload?.basic || payload?.pro) return payload;
  const normalized = {};
  for (const plan of payload?.plans || []) {
    normalized[plan.key] = {
      pricing: {
        monthly: Number(plan.monthly || 0),
        yearly: Number(plan.yearly || 0),
      },
      addons: DEFAULT_ADDONS,
    };
  }
  return {
    basic: normalized.basic || {
      pricing: { monthly: 2500, yearly: Math.round(2500 * 12 * 0.8) },
      addons: DEFAULT_ADDONS,
    },
    pro: normalized.pro || {
      pricing: { monthly: 7000, yearly: Math.round(7000 * 12 * 0.8) },
      addons: DEFAULT_ADDONS,
    },
  };
}

function getTrialDaysLeft(subscription) {
  if (!subscription?.trialEndsAt) return 0;
  const diffMs = new Date(subscription.trialEndsAt).getTime() - Date.now();
  return diffMs <= 0 ? 0 : Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

const isLikelyOfflineError = (err) => !err?.response;

const isActiveStatus = (status) =>
  status === 'active' || status === 'trialing';

export default function SubscriptionScreen({ navigation }) {
  const { theme } = useTheme();
  const [plans, setPlans] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [workspaceBilling, setWorkspaceBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [onlineRequired, setOnlineRequired] = useState(false);

  const workspace = useWorkspace();
  const { user } = useAuth();

  const currentWorkspace =
    workspace.currentWorkspace ||
    workspace.workspaces.find((w) => w.id === workspace.currentWorkspaceId);
  const userRole = currentWorkspace?.role || user?.role || 'user';
  const isWorkspaceOwner = userRole === 'owner';
  const workspaceCount = workspace.workspaces?.length || 0;
  const trialDaysLeft = getTrialDaysLeft(subscription);

  const subscriptionActive = isActiveStatus(subscription?.status);

  const refreshBilling = async () => {
    let workspaceId = currentWorkspace?.id;
    try {
      const [plansResp, subRes] = await Promise.all([
        api.get('/billing/plans'),
        workspaceId
          ? api.get(`/billing/workspaces/${workspaceId}/context`)
          : api.get('/billing/subscription'),
      ]);
      const normalizedPlans = normalizePlansResponse(plansResp);
      setOnlineRequired(false);
      setPlans(normalizedPlans);

      const billingCtx = workspaceId ? subRes : (subRes ? { plan: subRes.plan, billingCycle: subRes.billingCycle || 'monthly', ...subRes } : {});
      setSubscription(billingCtx);
      setWorkspaceBilling(billingCtx);
      setUsage({
        whatsappMessagesUsedThisMonth: billingCtx?.usage?.whatsappMessagesUsedThisMonth ?? 0,
        limits: billingCtx?.limits || {},
      });
      setBillingCycle(billingCtx?.billingCycle || 'monthly');

      if (workspaceId) {
        try {
          await offlineStore.cacheBillingContext(workspaceId, billingCtx);
        } catch {
          // ignore cache errors
        }
      }
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        await refreshBilling();
      } catch (err) {
        if (!mounted) return;
        if (isLikelyOfflineError(err)) {
          setOnlineRequired(true);
        } else {
          Alert.alert('Billing', err?.message || 'Unable to load billing details.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [currentWorkspace?.id]);

  useEffect(() => {
    if (!navigation) return;
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        await refreshBilling();
      } catch (err) {
        console.error('Failed to refresh billing after focus:', err);
      }
    });
    return unsubscribe;
  }, [navigation, currentWorkspace?.id]);

  const openWebsite = () => {
    Linking.openURL(getSubscriptionUrl()).catch(() => {});
  };

  const notifyOwner = async () => {
    if (!currentWorkspace?.id) return;
    if (onlineRequired) {
      Alert.alert('Internet required', 'Connect to the internet to send a renewal reminder.');
      return;
    }
    try {
      setProcessing(true);
      await api.post(`/billing/workspaces/${currentWorkspace.id}/remind-owner`, {});
      Alert.alert('Reminder sent', 'We emailed the workspace owner to renew this subscription.');
    } catch (err) {
      Alert.alert('Unable to send reminder', err?.message || 'Please try again later.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (onlineRequired) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background, padding: 16 }]}>
        <Card style={{ width: '100%', maxWidth: 520 }}>
          <Title>Subscription & Billing</Title>
          <Text style={[styles.onlineRequiredText, { color: theme.colors.textSecondary }]}>
            Billing is online-only. Connect to the internet to view your subscription status and usage.
          </Text>
          <AppButton
            title="Try Again"
            onPress={async () => {
              setLoading(true);
              try {
                await refreshBilling();
              } catch {
                setOnlineRequired(true);
              }
              setLoading(false);
            }}
            style={{ marginTop: 12 }}
          />
          <AppButton
            title="Back"
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 10 }}
          />
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ padding: 16 }}
    >
      <View style={styles.headerRow}>
        <Title>Subscription & Billing</Title>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Current status</Text>
        {subscriptionActive ? (
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
            {(subscription?.plan || 'Basic').toUpperCase()} plan is active. {subscription?.currentPeriodEndsAt ? `Renews ${new Date(subscription.currentPeriodEndsAt).toLocaleDateString()}` : ''}
          </Text>
        ) : (
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
            No active subscription. Subscribe on the website to get started.
          </Text>
        )}
        {subscription?.status === 'trialing' && trialDaysLeft > 0 ? (
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
            Trial ends in {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'}.
          </Text>
        ) : null}
        {subscription?.currentPeriodEndsAt && (
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
            Renews / ends: {new Date(subscription.currentPeriodEndsAt).toLocaleDateString()}
          </Text>
        )}
        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
          Workspace usage: {workspaceCount}/{usage?.limits?.workspaceLimit ?? 0}
        </Text>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Plans</Text>
        <View style={styles.cycleSwitcher}>
          {['monthly', 'yearly'].map((cycle) => {
            const active = billingCycle === cycle;
            return (
              <TouchableOpacity
                key={cycle}
                style={[
                  styles.cycleChip,
                  {
                    backgroundColor: active ? theme.colors.primary : 'transparent',
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setBillingCycle(cycle)}
              >
                <Text style={{ color: active ? '#fff' : theme.colors.textPrimary, fontWeight: '700', fontSize: 12 }}>
                  {cycle === 'yearly' ? 'Yearly (20% off)' : 'Monthly'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {PLAN_ORDER.map((planKey) => {
          const basePrice = billingCycle === 'yearly'
            ? planKey === 'pro'
              ? plans?.pro?.pricing?.yearly || Math.round(7000 * 12 * 0.8)
              : plans?.basic?.pricing?.yearly || Math.round(2500 * 12 * 0.8)
            : planKey === 'pro'
              ? plans?.pro?.pricing?.monthly || 7000
              : plans?.basic?.pricing?.monthly || 2500;

          return (
            <View
              key={planKey}
              style={[
                styles.planItem,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: 'transparent',
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.planTitle, { color: theme.colors.textPrimary }]}>
                  {planKey.toUpperCase()}
                </Text>
                <Text style={[styles.planPrice, { color: theme.colors.textSecondary }]}>
                  NGN {basePrice.toLocaleString()}/{billingCycle === 'yearly' ? 'year' : 'month'}
                </Text>
              </View>
            </View>
          );
        })}

        <AppButton
          title="Subscribe on the website"
          icon="language"
          onPress={openWebsite}
          style={{ marginTop: 8 }}
        />
        {!isWorkspaceOwner && (
          <Text style={[styles.meta, { color: theme.colors.textSecondary, marginTop: 8 }]}>
            Only the workspace owner can renew or upgrade this subscription.
          </Text>
        )}
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Usage dashboard</Text>
        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
          Workspace: {workspaceCount}/{usage?.limits?.workspaceLimit ?? 0}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
          Staff seats limit: {usage?.limits?.staffSeatLimit ?? 0}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
          WhatsApp: {usage?.whatsappMessagesUsedThisMonth ?? 0}/{usage?.limits?.whatsappMonthlyQuota ?? 0}
        </Text>
        {usage?.automationPaused ? (
          <Text style={[styles.meta, { color: theme.colors.warning }]}>Automation paused: {usage?.reason}</Text>
        ) : null}
      </Card>

      <Card>
        <AppButton
          title="Refresh"
          variant="secondary"
          onPress={async () => {
            setLoading(true);
            try {
              await refreshBilling();
            } catch {
              // ignore
            }
            setLoading(false);
          }}
        />
        {!isWorkspaceOwner && (
          <AppButton
            title="Notify workspace owner"
            variant="secondary"
            onPress={notifyOwner}
            disabled={processing}
            style={{ marginTop: 8 }}
          />
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  onlineRequiredText: { fontSize: 14, lineHeight: 22, marginTop: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  meta: { fontSize: 13, marginBottom: 4 },
  planItem: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  planTitle: { fontSize: 14, fontWeight: '700' },
  planPrice: { fontSize: 12 },
  cycleSwitcher: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  cycleChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
});
