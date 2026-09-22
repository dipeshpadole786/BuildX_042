import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts } from '@/lib/theme';

export type UrgencyStatus =
  | 'critical'
  | 'unavailable'
  | 'in-progress'
  | 'limited'
  | 'available'
  | 'complete'
  | string;

interface StatusBadgeProps {
  status: UrgencyStatus;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const CRITICAL = ['critical', 'unavailable', 'red', 'high'];
const PROGRESS = ['in-progress', 'limited', 'yellow', 'medium', 'en route', 'dispatched'];
const READY = ['available', 'complete', 'green', 'low', 'picked up', 'arrived', 'ready'];

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'md', style }) => {
  const normalized = status.toLowerCase();
  const tone = CRITICAL.includes(normalized) ? 'critical' : PROGRESS.includes(normalized) ? 'progress' : READY.includes(normalized) ? 'ready' : 'neutral';
  const display = label || status.toUpperCase();

  return (
    <View style={[styles.base, styles[tone], sizeStyles[size], style]}>
      <View style={[styles.dot, dotStyles[tone]]} />
      <Text style={[styles.label, labelStyles[tone], sizeText[size]]} numberOfLines={2}>
        {display}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
  },
  critical: { backgroundColor: colors.red50, borderColor: colors.red200 },
  progress: { backgroundColor: colors.amber50, borderColor: colors.amber200 },
  ready: { backgroundColor: colors.emerald50, borderColor: colors.emerald200 },
  neutral: { backgroundColor: '#F1F5F9', borderColor: colors.borderStrong },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontFamily: fonts.semibold, textTransform: 'uppercase', flexShrink: 1 },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingHorizontal: 8, paddingVertical: 3 },
  md: { paddingHorizontal: 10, paddingVertical: 5 },
  lg: { paddingHorizontal: 14, paddingVertical: 7, borderWidth: 2 },
});

const sizeText = StyleSheet.create({
  sm: { fontSize: 10 },
  md: { fontSize: 12 },
  lg: { fontSize: 14, fontFamily: fonts.extrabold },
});

const labelStyles = StyleSheet.create({
  critical: { color: colors.red700 },
  progress: { color: colors.amber800 },
  ready: { color: colors.emerald800 },
  neutral: { color: colors.slate700 },
});

const dotStyles = StyleSheet.create({
  critical: { backgroundColor: colors.red600 },
  progress: { backgroundColor: colors.amber500 },
  ready: { backgroundColor: colors.emerald600 },
  neutral: { backgroundColor: colors.slate500 },
});
