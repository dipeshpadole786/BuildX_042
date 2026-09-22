import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts } from '@/lib/theme';

type BadgeTone = 'live' | 'wait' | 'ok' | 'alert' | 'neutral';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
}

export function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  return (
    <View style={[styles.base, toneStyles[tone], style]}>
      <Text style={[styles.label, labelStyles[tone]]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: { fontFamily: fonts.bold, fontSize: 12 },
});

const toneStyles = StyleSheet.create({
  live: { backgroundColor: colors.accent },
  wait: { backgroundColor: colors.warning },
  ok: { backgroundColor: colors.successSoft },
  alert: { backgroundColor: colors.primary },
  neutral: { backgroundColor: colors.surface },
});

const labelStyles = StyleSheet.create({
  live: { color: colors.white },
  wait: { color: colors.ink },
  ok: { color: colors.emerald800 },
  alert: { color: colors.white },
  neutral: { color: colors.text },
});
