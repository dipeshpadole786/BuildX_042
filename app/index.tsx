import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle, CheckCircle2, ChevronRight, Droplet, Hospital, Navigation, Siren, Truck, User } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { getDeviceCoordinates } from '@/lib/geo';
import { colors, fonts } from '@/lib/theme';

type GeoState = {
  status: 'idle' | 'fetching' | 'success';
  coords?: { lat: number; lng: number; accuracy: number };
  message?: string;
};

const ROLES = [
  {
    href: '/ambulance' as const,
    title: 'Ambulance',
    kicker: 'Driver cockpit',
    body: 'Live map, route updates, and hospital assignment.',
    icon: Truck,
  },
  {
    href: '/hospital' as const,
    title: 'Hospital',
    kicker: 'Operations',
    body: 'Incoming units, equipment readiness, and bed capacity.',
    icon: Hospital,
  },
  {
    href: '/patient' as const,
    title: 'Patient',
    kicker: 'Incident status',
    body: 'Dispatch progress, vitals, and the handover timeline.',
    icon: User,
  },
  {
    href: '/blood' as const,
    title: 'Blood',
    kicker: 'Demo availability',
    body: 'Search O+, A+, and other groups at nearby Nagpur sites.',
    icon: Droplet,
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const [sosActive, setSosActive] = useState(false);
  const [geoState, setGeoState] = useState<GeoState>({ status: 'idle' });

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
          <Text style={styles.hello}>Hello</Text>
          <Text style={styles.lede}>Emergency dispatch for patients, drivers, and hospitals.</Text>
        </View>

        <Pressable onPress={() => router.push('/surge')}>
          <Card tone="danger" style={styles.roleCard}>
            <View style={styles.roleRow}>
              <View style={[styles.iconBox, styles.surgeIcon]}>
                <Siren size={22} color={colors.primary} />
              </View>
              <View style={styles.roleCopy}>
                <Text style={styles.kicker}>Command center</Text>
                <Text style={styles.cardTitle}>Emergency Surge</Text>
                <Text style={styles.body}>Highway accident, triage, hospital matching, and offline mode.</Text>
              </View>
              <View style={styles.chevron}>
                <ChevronRight size={18} color={colors.text} />
              </View>
            </View>
          </Card>
        </Pressable>

        {ROLES.map((role) => {
          const Icon = role.icon;
          return (
            <Pressable key={role.href} onPress={() => router.push(role.href)}>
              <Card style={styles.roleCard}>
                <View style={styles.roleRow}>
                  <View style={styles.iconBox}>
                    <Icon size={22} color={colors.accent} />
                  </View>
                  <View style={styles.roleCopy}>
                    <Text style={styles.kicker}>{role.kicker}</Text>
                    <Text style={styles.cardTitle}>{role.title}</Text>
                    <Text style={styles.body}>{role.body}</Text>
                  </View>
                  <View style={styles.chevron}>
                    <ChevronRight size={18} color={colors.text} />
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.fabWrap}>
        <Button label="Emergency SOS" onPress={triggerSosCall} icon={<AlertCircle size={18} color={colors.white} />} />
      </View>

      <Modal visible={sosActive} transparent animationType="fade" onRequestClose={() => setSosActive(false)}>
        <View style={styles.modalBackdrop}>
          <Card style={styles.modalCard}>
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
                <Button
                  label="Track ambulance"
                  onPress={() => {
                    setSosActive(false);
                    router.push('/patient');
                  }}
                />
              </View>
            ) : null}
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 200, gap: 14 },
  hero: { paddingTop: 8, paddingBottom: 6, gap: 6 },
  hello: { fontFamily: fonts.extrabold, fontSize: 34, color: colors.text, letterSpacing: -0.8 },
  lede: { fontFamily: fonts.regular, fontSize: 16, color: colors.textSecondary, lineHeight: 22, maxWidth: 320 },
  roleCard: { paddingVertical: 14 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surgeIcon: { backgroundColor: colors.surface },
  roleCopy: { flex: 1, gap: 2 },
  kicker: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text, letterSpacing: -0.3 },
  body: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  chevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabWrap: { position: 'absolute', left: 20, right: 20, bottom: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,17,17,0.35)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalCard: { gap: 14, marginBottom: 8 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  modalTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text, flexShrink: 1 },
  closeBtn: { backgroundColor: colors.bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  closeText: { fontFamily: fonts.bold, fontSize: 12, color: colors.textSecondary },
  fetching: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  fetchingText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.accent, textAlign: 'center' },
  successBox: { backgroundColor: colors.successSoft, borderRadius: 18, padding: 14, gap: 4 },
  successTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.emerald800 },
  successBody: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  coord: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  assignBox: { backgroundColor: colors.accentSoft, borderRadius: 18, padding: 14, gap: 4 },
  assignTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  assignLine: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  eta: { fontFamily: fonts.bold, color: colors.accent },
});
