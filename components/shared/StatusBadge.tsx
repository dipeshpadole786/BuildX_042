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
const LIVE = ['in-progress', 'en route', 'dispatched'];
const WAIT = ['limited', 'yellow', 'medium'];
const READY = ['available', 'complete', 'green', 'low', 'picked up', 'arrived', 'ready'];

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'md', style }) => {
  const normalized = status.toLowerCase();
  const tone = CRITICAL.includes(normalized)
    ? 'critical'
    : LIVE.includes(normalized)
      ? 'live'
      : WAIT.includes(normalized)
        ? 'wait'
        : READY.includes(normalized)
          ? 'ready'
          : 'neutral';
  const display = label || status.toUpperCase();

  return (
    <View style={[styles.base, styles[tone], sizeStyles[size], style]}>
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
  critical: { backgroundColor: colors.primary, borderColor: colors.primary },
  live: { backgroundColor: colors.accent, borderColor: colors.accent },
  wait: { backgroundColor: colors.warning, borderColor: colors.warning },
  ready: { backgroundColor: colors.successSoft, borderColor: colors.successSoft },
  neutral: { backgroundColor: colors.surface, borderColor: colors.border },
  label: { fontFamily: fonts.bold, flexShrink: 1 },
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
  critical: { color: colors.white },
  live: { color: colors.white },
  wait: { color: colors.ink },
  ready: { color: colors.emerald800 },
  neutral: { color: colors.text },
});


