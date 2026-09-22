import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle, Home } from 'lucide-react-native';
import { colors, fonts } from '@/lib/theme';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <View style={styles.screen}>
      <View style={styles.icon}>
        <AlertTriangle size={28} color={colors.red600} />
      </View>
      <Text style={styles.title}>404 — Page Not Found</Text>
      <Text style={styles.body}>The emergency dispatch route you are trying to open does not exist.</Text>
      <Pressable style={styles.button} onPress={() => router.replace('/')}>
        <Home size={16} color={colors.white} />
        <Text style={styles.buttonText}>Return to Pulse Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.red50,
    borderWidth: 1,
    borderColor: colors.red200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.slate900, textAlign: 'center' },
  body: { fontFamily: fonts.regular, fontSize: 14, color: colors.slate600, textAlign: 'center', lineHeight: 20 },
  button: {
    marginTop: 8,
    backgroundColor: colors.blue600,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: { color: colors.white, fontFamily: fonts.bold, fontSize: 13 },
});
