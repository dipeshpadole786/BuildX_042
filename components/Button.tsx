import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts, radius } from '@/lib/theme';

type ButtonTone = 'primary' | 'accent' | 'ink' | 'surface';

interface ButtonProps {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({ label, onPress, tone = 'primary', disabled = false, icon, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        toneStyles[tone],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
      <Text style={[styles.label, tone === 'surface' ? styles.labelDark : styles.labelLight]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },
  label: { fontFamily: fonts.bold, fontSize: 15 },
  labelLight: { color: colors.white },
  labelDark: { color: colors.text },
});

const toneStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  accent: { backgroundColor: colors.accent },
  ink: { backgroundColor: colors.ink },
  surface: { backgroundColor: colors.surface },
});
