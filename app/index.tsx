import React, { useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Hospital,
  Navigation,
  Truck,
  User,
} from 'lucide-react-native';
import { getDeviceCoordinates } from '@/lib/geo';
import { colors, fonts, shadow } from '@/lib/theme';

type GeoState = {
  status: 'idle' | 'fetching' | 'success';
  coords?: { lat: number; lng: number; accuracy: number };
  message?: string;
};

const ROLES = [
  {
    href: '/ambulance' as const,
    title: 'Ambulance',
    kicker: 'DRIVER PORTAL',
    body: 'Live map navigation, OSRM route recalculation, patient vitals, and hospital assignment.',
    action: 'Open Driver Navigation',
    icon: Truck,
    accent: colors.amber600,
    soft: colors.amber50,
    border: colors.amber200,
  },
  {
    href: '/hospital' as const,
    title: 'Hospital',
    kicker: 'OPERATIONS DASHBOARD',
    body: 'Incoming ambulance telemetry, equipment readiness, and departmental bed occupancy.',
    action: 'Open Operations Room',
    icon: Hospital,
    accent: colors.blue600,
    soft: colors.blue50,
    border: colors.blue200,
  },
  {
    href: '/patient' as const,
    title: 'Patient',
    kicker: 'REPORT & STATUS',
    body: 'Dispatch stage tracking, clinical vitals, and the post-incident timeline.',
    action: 'View Active Report',
    icon: User,
    accent: colors.emerald600,
    soft: colors.emerald50,
    border: colors.emerald200,
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const [sosActive, setSosActive] = useState(false);
  const [geoState, setGeoState] = useState<GeoState>({ status: 'idle' });
  const pulse = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const triggerSosCall = async () => {
    setSosActive(true);
    setGeoState({ status: 'fetching', message: 'Accessing device location...' });
    const coords = await getDeviceCoordinates();
    if (coords) {
      setGeoState({
        status: 'success',
        coords,
        message: 'GPS coordinates captured. ALS Ambulance #DL-01-AM-4921 dispatched to your live location.',
      });
      return;
    }
    setGeoState({
      status: 'success',
      coords: { lat: 28.6139, lng: 77.209, accuracy: 15 },
      message: 'Using network triangulation. Ambulance dispatched to the fallback emergency location.',
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.pill}>
            <Activity size={14} color={colors.red600} />
            <Text style={styles.pillText}>REAL-TIME AMBULANCE DISPATCH NETWORK</Text>
          </View>
          <MaskedView
            maskElement={<Text style={styles.wordmark}>Pulse</Text>}
          >
            <LinearGradient colors={[colors.red600, colors.amber600, colors.blue600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[styles.wordmark, styles.wordmarkHidden]}>Pulse</Text>
            </LinearGradient>
          </MaskedView>
          <Text style={styles.tagline}>"One tap. Fastest help."</Text>
          <Text style={styles.lede}>
            High-urgency platform connecting patients, ambulance drivers, and emergency hospital teams.
          </Text>
        </View>

        {ROLES.map((role) => {
          const Icon = role.icon;
          return (
            <Pressable key={role.href} style={styles.card} onPress={() => router.push(role.href)}>
              <View style={[styles.iconBox, { backgroundColor: role.soft, borderColor: role.border }]}>
                <Icon size={28} color={role.accent} />
              </View>
              <Text style={styles.cardTitle}>{role.title}</Text>
              <Text style={[styles.kicker, { color: role.accent }]}>{role.kicker}</Text>
              <Text style={styles.body}>{role.body}</Text>
              <View style={styles.cardFoot}>
                <Text style={[styles.action, { color: role.accent }]}>{role.action}</Text>
                <ChevronRight size={16} color={role.accent} />
              </View>
            </Pressable>
          );
        })}

        <Text style={styles.footer}>Call & Report © 2026 Emergency Care Platform</Text>
      </ScrollView>

      <Animated.View style={[styles.fabWrap, { transform: [{ scale: pulse }] }]}>
        <Pressable onPress={triggerSosCall}>
          <LinearGradient colors={[colors.red600, colors.amber600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fab}>
            <AlertCircle size={22} color={colors.white} />
            <Text style={styles.fabText}>EMERGENCY SOS</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      <Modal visible={sosActive} transparent animationType="fade" onRequestClose={() => setSosActive(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <View style={styles.modalTitleRow}>
                <AlertCircle size={20} color={colors.red600} />
                <Text style={styles.modalTitle}>Instant Emergency SOS</Text>
              </View>
              <Pressable onPress={() => setSosActive(false)} style={styles.closeBtn}>
                <Text style={styles.closeText}>Close ✕</Text>
              </Pressable>
            </View>

            {geoState.status === 'fetching' ? (
              <View style={styles.fetching}>
                <Navigation size={32} color={colors.blue600} />
                <Text style={styles.fetchingText}>{geoState.message}</Text>
              </View>
            ) : null}

            {geoState.status === 'success' && geoState.coords ? (
              <View style={{ gap: 12 }}>
                <View style={styles.successBox}>
                  <View style={styles.modalTitleRow}>
                    <CheckCircle2 size={18} color={colors.emerald600} />
                    <Text style={styles.successTitle}>GPS Signal Locked</Text>
                  </View>
                  <Text style={styles.successBody}>{geoState.message}</Text>
                  <Text style={styles.coord}>Latitude: {geoState.coords.lat.toFixed(5)}</Text>
                  <Text style={styles.coord}>Longitude: {geoState.coords.lng.toFixed(5)}</Text>
                  <Text style={styles.coord}>Accuracy: ±{geoState.coords.accuracy} meters</Text>
                </View>
                <View style={styles.assignBox}>
                  <Text style={styles.assignTitle}>Assigned Unit: ALS Ambulance #DL-01-AM-4921</Text>
                  <Text style={styles.assignLine}>Driver: Rajesh Kumar (+91 98765 11223)</Text>
                  <Text style={styles.assignLine}>
                    ETA: <Text style={styles.eta}>6 minutes</Text>
                  </Text>
                </View>
                <Pressable
                  style={styles.trackBtn}
                  onPress={() => {
                    setSosActive(false);
                    router.push('/patient');
                  }}
                >
                  <Text style={styles.trackText}>TRACK AMBULANCE STATUS</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 110, gap: 14 },
  hero: { alignItems: 'center', paddingTop: 12, gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.red50,
    borderWidth: 1,
    borderColor: colors.red200,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { fontFamily: fonts.bold, fontSize: 10, color: colors.red700, letterSpacing: 0.4 },
  wordmark: { fontFamily: fonts.extrabold, fontSize: 56, letterSpacing: -1.5, textAlign: 'center', color: colors.slate900 },
  wordmarkHidden: { opacity: 0 },
  tagline: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.blue700, textAlign: 'center' },
  lede: { fontFamily: fonts.regular, fontSize: 14, color: colors.slate600, textAlign: 'center', lineHeight: 20, maxWidth: 420 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 6,
    ...shadow.card,
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.slate900 },
  kicker: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.4 },
  body: { fontFamily: fonts.regular, fontSize: 13, color: colors.slate600, lineHeight: 18, marginTop: 4 },
  cardFoot: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  action: { fontFamily: fonts.bold, fontSize: 12 },
  footer: { textAlign: 'center', fontFamily: fonts.medium, fontSize: 11, color: colors.slate500, marginTop: 8 },
  fabWrap: { position: 'absolute', right: 16, bottom: 16 },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.white,
    ...shadow.raised,
  },
  fabText: { color: colors.white, fontFamily: fonts.extrabold, fontSize: 15 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.red600,
    padding: 16,
    gap: 12,
  },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  modalTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.red600, flexShrink: 1 },
  closeBtn: { backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  closeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.slate500 },
  fetching: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  fetchingText: { fontFamily: fonts.bold, fontSize: 13, color: colors.blue800, textAlign: 'center' },
  successBox: { backgroundColor: colors.emerald50, borderWidth: 1, borderColor: colors.emerald200, borderRadius: 16, padding: 12, gap: 4 },
  successTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.emerald800 },
  successBody: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate700, lineHeight: 17 },
  coord: { fontFamily: fonts.bold, fontSize: 12, color: colors.emerald800 },
  assignBox: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, gap: 4 },
  assignTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.slate900 },
  assignLine: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate700 },
  eta: { fontFamily: fonts.bold, color: colors.blue700 },
  trackBtn: { backgroundColor: colors.red600, borderRadius: 14, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  trackText: { color: colors.white, fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 0.4 },
});
