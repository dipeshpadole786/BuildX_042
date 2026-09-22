import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, Phone } from 'lucide-react-native';
import { colors, fonts } from '@/lib/theme';
import { callPhone } from '@/lib/phone';

export function Header() {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.push('/')} style={styles.brand} accessibilityRole="button">
        <View style={styles.mark}>
          <Activity size={18} color={colors.white} />
        </View>
        <View>
          <Text style={styles.name}>Pulse</Text>
          <Text style={styles.sub}>One tap. Fastest help.</Text>
        </View>
      </Pressable>

      <Pressable style={styles.hotline} onPress={() => callPhone('108')} accessibilityRole="button">
        <Phone size={14} color={colors.primary} />
        <Text style={styles.hotlineText}>108</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  mark: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text, letterSpacing: -0.4 },
  sub: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  hotline: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  hotlineText: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
});
