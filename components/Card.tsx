import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, shadow } from '@/lib/theme';

type CardTone = 'surface' | 'accent' | 'warning' | 'danger' | 'success';

interface CardProps {
  children: React.ReactNode;
  tone?: CardTone;
  style?: ViewStyle;
  padded?: boolean;
}

export function Card({ children, tone = 'surface', style, padded = true }: CardProps) {
  return <View style={[styles.base, toneStyles[tone], padded && styles.padded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    ...shadow.card,
  },
  padded: { padding: 16 },
});

const toneStyles = StyleSheet.create({
  surface: { backgroundColor: colors.surface },
  accent: { backgroundColor: colors.accentSoft },
  warning: { backgroundColor: colors.warningSoft },
  danger: { backgroundColor: colors.primarySoft },
  success: { backgroundColor: colors.successSoft },
});
