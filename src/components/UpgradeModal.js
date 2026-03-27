import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppButton } from './UI';
import { useTheme } from '../theme/ThemeContext';

export default function UpgradeModal({
  visible,
  onClose,
  onUpgrade,
  title = 'Upgrade required',
  message,
  plan,
  limit,
  current,
}) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.warning}20` }]}>
            <MaterialIcons name="workspace-premium" size={22} color={theme.colors.warning} />
          </View>

          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {message || 'You have reached your current workspace limit. Upgrade your plan to continue.'}
          </Text>

          {(plan || limit !== undefined || current !== undefined) && (
            <View style={[styles.metaBox, { borderColor: theme.colors.border }]}>
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>Plan: {String(plan || 'unknown').toUpperCase()}</Text>
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>Usage: {current ?? 0} / {limit ?? '-'}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <AppButton title="Not now" variant="secondary" onPress={onClose} style={styles.actionBtn} />
            <AppButton
              title="Upgrade plan"
              icon="arrow-upward"
              onPress={onUpgrade || onClose}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaBox: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
  },
});
