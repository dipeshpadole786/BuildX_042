import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, PhoneCall } from 'lucide-react-native';
import { colors, fonts } from '@/lib/theme';
import { callPhone } from '@/lib/phone';

export const AppHeader: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.push('/')} style={styles.brand} accessibilityRole="button">
        <LinearGradient colors={[colors.red600, colors.amber500]} style={styles.logo}>
          <Activity size={22} color={colors.white} />
        </LinearGradient>
        <View>
          <Text style={styles.name}>Pulse</Text>
          <Text style={styles.sub}>EMERGENCY DISPATCH SYSTEM</Text>
        </View>
      </Pressable>

      <Pressable style={styles.hotline} onPress={() => callPhone('108')} accessibilityRole="button">
        <PhoneCall size={14} color={colors.red600} />
        <Text style={styles.hotlineText}>HOTLINE: 108</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.slate900, letterSpacing: -0.3 },
  sub: { fontFamily: fonts.bold, fontSize: 9, color: colors.red600, letterSpacing: 0.6 },
  hotline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.red50,
    borderWidth: 1,
    borderColor: colors.red200,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  hotlineText: { fontFamily: fonts.bold, fontSize: 11, color: colors.red700 },
});
