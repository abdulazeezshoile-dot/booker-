import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Share, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { Card, Subtle, EmptyState, SkeletonBlock } from '../components/UI';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../api/client';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function ReportsScreen({ navigation }) {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const { currentWorkspaceId } = useWorkspace();
  const { width } = useWindowDimensions();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const contentWidth = Math.min(width - 24, 860);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const loadTransactions = async () => {
        if (!currentWorkspaceId) {
          if (mounted) setTransactions([]);
          return;
        }

        setLoading(true);
        try {
          const list = await api.get(`/workspaces/${currentWorkspaceId}/transactions`, {
            skip: 0,
            take: 500,
          });
          if (mounted) {
            setTransactions(Array.isArray(list) ? list : []);
          }
        } catch (err) {
          if (mounted) {
            setTransactions([]);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

      loadTransactions();

      return () => {
        mounted = false;
      };
    }, [currentWorkspaceId])
  );

  const formatCurrency = (value) => `₦${Number(value || 0).toLocaleString()}`;

  const analytics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthlyMap = new Map();

    let thisMonthIncome = 0;
    let thisYearIncome = 0;
    let thisMonthExpenses = 0;
    let thisYearExpenses = 0;
    let debtExposure = 0;
    let saleCount = 0;

    transactions.forEach((tx) => {
      const amount = Number(tx?.totalAmount ?? tx?.amount ?? 0);
      const txType = String(tx?.type || '').toLowerCase();
      const createdAt = tx?.createdAt ? new Date(tx.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return;

      const year = createdAt.getFullYear();
      const month = createdAt.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { key, label: createdAt.toLocaleString('default', { month: 'short' }), year, income: 0, expense: 0, debt: 0 });
      }

      const bucket = monthlyMap.get(key);
      if (txType === 'sale') {
        bucket.income += amount;
        saleCount += 1;
        if (year === currentYear) thisYearIncome += amount;
        if (year === currentYear && month === currentMonth) thisMonthIncome += amount;
      }

      if (txType === 'expense') {
        bucket.expense += amount;
        if (year === currentYear) thisYearExpenses += amount;
        if (year === currentYear && month === currentMonth) thisMonthExpenses += amount;
      }

      if (txType === 'debt') {
        bucket.debt += amount;
        debtExposure += amount;
      }
    });

    const monthlyRows = Array.from(monthlyMap.values()).sort((a, b) => a.key.localeCompare(b.key));
    const recentMonths = monthlyRows.slice(-6);
    const maxBarValue = Math.max(1, ...recentMonths.map((m) => Math.max(m.income, m.expense)));
    const avgSaleValue = saleCount > 0 ? thisYearIncome / saleCount : 0;
    const netThisYear = thisYearIncome - thisYearExpenses;
    const expenseToIncomeRatio = thisYearIncome > 0 ? thisYearExpenses / thisYearIncome : 0;
    const topIncomeMonth = monthlyRows.reduce((best, item) => (item.income > (best?.income || 0) ? item : best), null);

    return {
      thisMonthIncome,
      thisYearIncome,
      thisMonthExpenses,
      thisYearExpenses,
      debtExposure,
      avgSaleValue,
      netThisYear,
      expenseToIncomeRatio,
      topIncomeMonth,
      recentMonths,
      maxBarValue,
      totalTransactions: transactions.length,
      monthlyRows,
    };
  }, [transactions]);

  const exportCsv = async () => {
    const lines = [
      'Month,Year,Income,Expenses,Debt,Net',
      ...analytics.monthlyRows.map((row) => {
        const net = row.income - row.expense;
        return `${row.label},${row.year},${row.income},${row.expense},${row.debt},${net}`;
      }),
    ];

    const csv = `\uFEFF${lines.join('\n')}`;
    const dateTag = new Date().toISOString().slice(0, 10);
    const fileName = `bizrecord-analytics-${dateTag}.csv`;

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    const directory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (!directory) {
      await Share.share({
        title: 'BizRecord Analytics CSV',
        message: lines.join('\n'),
      });
      return;
    }

    const uri = `${directory}${fileName}`;
    await FileSystem.writeAsStringAsync(uri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export analytics CSV',
        UTI: 'public.comma-separated-values-text',
      });
      return;
    }

    await Share.share({
      title: 'BizRecord Analytics CSV',
      message: lines.join('\n'),
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.headerWrap, { width: contentWidth }]}> 
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => {
              if (navigation?.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
            style={[styles.backButton, { borderColor: theme.colors.border, opacity: navigation?.canGoBack && navigation.canGoBack() ? 1 : 0.35 }]}
            disabled={!(navigation?.canGoBack && navigation.canGoBack())}
          >
            <MaterialIcons name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ color: theme.colors.textPrimary, fontWeight: '700', fontSize: 20 }}>Analytics</Text>
        </View>
        <Subtle>Monthly and yearly performance snapshot</Subtle>
        <TouchableOpacity style={[styles.exportBtn, { borderColor: theme.colors.border }]} onPress={exportCsv}>
          <MaterialIcons name="file-download" size={18} color={theme.colors.textPrimary} />
          <Text style={{ color: theme.colors.textPrimary, marginLeft: 8, fontWeight: '600' }}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ width: contentWidth, marginTop: 12 }}>
          <SkeletonBlock height={20} width="35%" />
          <SkeletonBlock height={88} />
          <SkeletonBlock height={88} />
          <SkeletonBlock height={88} />
        </View>
      ) : (
        analytics.totalTransactions > 0 ? (
        <>
          <Card style={{ marginVertical: 8, width: contentWidth }}>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>Income This Month</Text>
            <Text style={{ color: theme.colors.success, fontSize: 22, fontWeight: '700', marginTop: 4 }}>
              {formatCurrency(analytics.thisMonthIncome)}
            </Text>
            <Subtle style={{ marginTop: 6 }}>Income this year: {formatCurrency(analytics.thisYearIncome)}</Subtle>
          </Card>

          <Card style={{ marginVertical: 8, width: contentWidth }}>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>Expenses</Text>
            <Text style={{ color: theme.colors.warning, fontSize: 22, fontWeight: '700', marginTop: 4 }}>
              {formatCurrency(analytics.thisMonthExpenses)}
            </Text>
            <Subtle style={{ marginTop: 6 }}>Expenses this year: {formatCurrency(analytics.thisYearExpenses)}</Subtle>
          </Card>

          <Card style={{ marginVertical: 8, width: contentWidth }}>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>Year Net Profit</Text>
            <Text style={{ color: theme.colors.primary, fontSize: 22, fontWeight: '700', marginTop: 4 }}>
              {formatCurrency(analytics.netThisYear)}
            </Text>
            <Subtle style={{ marginTop: 6 }}>Transactions: {analytics.totalTransactions}</Subtle>
          </Card>

          <Card style={{ marginVertical: 8, width: contentWidth }}>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: '700', marginBottom: 8 }}>Monthly Income vs Expense (last 6 months)</Text>
            {analytics.recentMonths.map((month) => {
              const incomeWidth = `${Math.max(4, (month.income / analytics.maxBarValue) * 100)}%`;
              const expenseWidth = `${Math.max(4, (month.expense / analytics.maxBarValue) * 100)}%`;
              return (
                <View key={month.key} style={{ marginBottom: 10 }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{month.label} {month.year}</Text>
                  <View style={[styles.track, { backgroundColor: theme.colors.border }]}>
                    <View style={[styles.incomeBar, { width: incomeWidth, backgroundColor: theme.colors.success }]} />
                  </View>
                  <View style={[styles.track, { backgroundColor: theme.colors.border, marginTop: 4 }]}>
                    <View style={[styles.expenseBar, { width: expenseWidth, backgroundColor: theme.colors.warning }]} />
                  </View>
                </View>
              );
            })}
            <Subtle>Green: income, Amber: expenses</Subtle>
          </Card>

          <Card style={{ marginVertical: 8, width: contentWidth }}>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>Extra Insights</Text>
            <Subtle style={{ marginTop: 6 }}>Average sale value (year): {formatCurrency(analytics.avgSaleValue)}</Subtle>
            <Subtle style={{ marginTop: 4 }}>Expense ratio (year): {(analytics.expenseToIncomeRatio * 100).toFixed(1)}%</Subtle>
            <Subtle style={{ marginTop: 4 }}>Debt exposure: {formatCurrency(analytics.debtExposure)}</Subtle>
            <Subtle style={{ marginTop: 4 }}>
              Top income month: {analytics.topIncomeMonth ? `${analytics.topIncomeMonth.label} ${analytics.topIncomeMonth.year} (${formatCurrency(analytics.topIncomeMonth.income)})` : 'N/A'}
            </Subtle>
          </Card>
        </>
        ) : (
          <EmptyState icon="analytics" title="No analytics data" subtitle="Record transactions to unlock monthly and yearly insights" style={{ width: contentWidth }} />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  headerWrap: { padding: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  exportBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  track: {
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  incomeBar: {
    height: '100%',
    borderRadius: 6,
  },
  expenseBar: {
    height: '100%',
    borderRadius: 6,
  },
});
