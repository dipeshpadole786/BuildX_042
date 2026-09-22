import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Expand, Locate, Search, Shrink, Truck } from 'lucide-react-native';
import { PulseMap } from '@/components/map/PulseMap';
import { TripStatusPanel } from '@/components/ambulance/TripStatusPanel';
import { NoticeBanner } from '@/components/shared/NoticeBanner';
import { Ambulance, Hospital, Patient, mockAmbulances, mockHospitals, mockPatients } from '@/lib/mockData';
import { geocodeCityOrAddress, getRealLocationAndHospitals, LiveLocationData } from '@/lib/locationStore';
import { fetchOsrmRoute, RouteSegment } from '@/lib/osrm';
import { getDeviceCoordinates } from '@/lib/geo';
import { colors, fonts, shadow } from '@/lib/theme';

const NANDANVAN: [number, number] = [21.1384, 79.1235];
const STAGE_LABELS = ['Dispatched', 'En Route Patient', 'Patient Picked Up', 'En Route Hospital', 'Arrived'];

export default function AmbulanceScreen() {
  const insets = useSafeAreaInsets();
  const [ambulance, setAmbulance] = useState<Ambulance>(mockAmbulances[0]);
  const [patient, setPatient] = useState<Patient>(mockPatients[0]);
  const [assignedHospital, setAssignedHospital] = useState<Hospital>(mockHospitals[0]);
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>(mockHospitals);
  const [routeData, setRouteData] = useState<RouteSegment | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(1);
  const [isLocating, setIsLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>('Radius expansion search (1 km → 10 km) active...');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const isPatientPickedUp = currentStageIndex >= 2;
  const startPos: [number, number] = isPatientPickedUp
    ? [patient.lat, patient.lng]
    : [ambulance.currentLat, ambulance.currentLng];
  const targetPos: [number, number] = isPatientPickedUp
    ? [assignedHospital.lat, assignedHospital.lng]
    : [patient.lat, patient.lng];
  const startName = isPatientPickedUp
    ? `Patient: ${patient.name} (Picked Up)`
    : `ALS Ambulance (${ambulance.vehicleNumber})`;
  const targetName = isPatientPickedUp ? assignedHospital.name : `Patient: ${patient.name}`;

  const applyLive = async (live: LiveLocationData, destination: [number, number], notice: string) => {
    setPatient(live.patient);
    setAssignedHospital(live.assignedHospital);
    setNearbyHospitals(live.nearbyHospitals);
    setAmbulance(live.ambulance);
    const route = await fetchOsrmRoute(live.ambulance.currentLat, live.ambulance.currentLng, destination[0], destination[1]);
    setRouteData(route);
    setLocationNotice(notice);
  };

  const loadPreset = async () => {
    setIsLocating(true);
    setLocationNotice('Checking OpenStreetMap hospitals around Nandanvan, Nagpur...');
    const live = await getRealLocationAndHospitals(NANDANVAN[0], NANDANVAN[1]);
    await applyLive(
      live,
      NANDANVAN,
      `Min distance found: ${live.assignedHospital.name} (${live.assignedHospital.distanceKm} km away)`
    );
    setIsLocating(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLocating(true);
      setLocationNotice('Searching OpenStreetMap hospitals around your location...');
      const coords = await getDeviceCoordinates();
      if (cancelled) return;
      if (!coords) {
        await loadPreset();
        return;
      }
      const live = await getRealLocationAndHospitals(coords.lat, coords.lng);
      if (cancelled) return;
      await applyLive(
        live,
        [coords.lat, coords.lng],
        `Nearest real hospital: ${live.assignedHospital.name} (${live.assignedHospital.distanceKm} km away)`
      );
      setIsLocating(false);
    })();
    return () => {
      cancelled = true;
    };
    // Mount-only location bootstrap. Preset and live helpers close over setters only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchOsrmRoute(startPos[0], startPos[1], targetPos[0], targetPos[1]).then((route) => {
      if (!cancelled) setRouteData(route);
    });
    return () => {
      cancelled = true;
    };
  }, [startPos[0], startPos[1], targetPos[0], targetPos[1]]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setLocationNotice(`Expanding radius search for "${searchQuery}"...`);
    const coords = await geocodeCityOrAddress(searchQuery);
    if (!coords) {
      setLocationNotice(`Could not locate "${searchQuery}". Try another landmark.`);
      setIsSearching(false);
      return;
    }
    const live = await getRealLocationAndHospitals(coords[0], coords[1]);
    await applyLive(
      live,
      coords,
      `Nearest hospital (${live.assignedHospital.distanceKm} km): ${live.assignedHospital.name}`
    );
    setIsSearching(false);
  };

  const handleAdvanceStage = async () => {
    const nextIdx = Math.min(4, currentStageIndex + 1);
    setCurrentStageIndex(nextIdx);
    if (nextIdx >= 2) {
      const route = await fetchOsrmRoute(patient.lat, patient.lng, assignedHospital.lat, assignedHospital.lng);
      setRouteData(route);
      setLocationNotice(
        `Patient picked up. Route recalculated: ${patient.locationName} → ${assignedHospital.name} (${assignedHospital.distanceKm} km)`
      );
    }
  };

  const handleSelectHospital = async (hospital: Hospital) => {
    setAssignedHospital(hospital);
    if (currentStageIndex >= 2) {
      const route = await fetchOsrmRoute(patient.lat, patient.lng, hospital.lat, hospital.lng);
      setRouteData(route);
    }
  };

  const actionLabel =
    currentStageIndex === 0
      ? 'Confirm Dispatch Acknowledgement'
      : currentStageIndex === 1
        ? 'Mark Patient Picked Up'
        : currentStageIndex === 2
          ? 'Start Transit to Hospital'
          : 'Mark Arrived at Emergency Bay';

  return (
    <View style={styles.screen}>
      <ScrollView
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {locationNotice ? <NoticeBanner message={locationNotice} tag="RADIUS SEARCH" /> : null}

        <View style={styles.headerCard}>
          <View style={styles.titleRow}>
            <View style={styles.truckBox}>
              <Truck size={22} color={colors.amber600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Driver Cockpit · {ambulance.vehicleNumber}</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                Nearest hospital: <Text style={styles.subtitleStrong}>{assignedHospital.name} ({assignedHospital.distanceKm} km)</Text>
              </Text>
            </View>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search city or area"
              placeholderTextColor={colors.slate400}
              style={styles.input}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <Pressable style={styles.iconBtn} onPress={handleSearch} disabled={isSearching}>
              <Search size={16} color={colors.white} />
            </Pressable>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.gpsBtn} onPress={loadPreset} disabled={isLocating}>
              <Locate size={14} color={colors.white} />
              <Text style={styles.gpsText}>{isLocating ? 'Locating...' : 'Nagpur preset'}</Text>
            </Pressable>
            <Pressable style={styles.gpsBtn} onPress={() => {
              setIsLocating(true);
              getDeviceCoordinates().then(async (coords) => {
                if (!coords) {
                  await loadPreset();
                  return;
                }
                const live = await getRealLocationAndHospitals(coords.lat, coords.lng);
                await applyLive(live, [coords.lat, coords.lng], `GPS locked. ${live.assignedHospital.name} (${live.assignedHospital.distanceKm} km)`);
                setIsLocating(false);
              });
            }} disabled={isLocating}>
              <Locate size={14} color={colors.white} />
              <Text style={styles.gpsText}>Detect GPS</Text>
            </Pressable>
            <Pressable style={styles.mapBtn} onPress={() => setIsMapFullscreen(true)}>
              <Expand size={14} color={colors.white} />
              <Text style={styles.gpsText}>Full map</Text>
            </Pressable>
          </View>
        </View>

        {isMapFullscreen ? null : (
          <PulseMap
            startPos={startPos}
            ambulancePos={[ambulance.currentLat, ambulance.currentLng]}
            targetPos={targetPos}
            startName={startName}
            targetName={targetName}
            routeData={routeData}
            height={340}
            hospitals={nearbyHospitals}
            onSelectHospital={handleSelectHospital}
            onToggleFullscreen={() => setIsMapFullscreen(true)}
          />
        )}

        <TripStatusPanel
          currentStageIndex={currentStageIndex}
          onAdvanceStage={handleAdvanceStage}
          patient={patient}
          assignedHospital={assignedHospital}
          nearbyHospitals={nearbyHospitals}
          onSelectHospital={handleSelectHospital}
        />
      </ScrollView>

      <Modal visible={isMapFullscreen} animationType="slide" onRequestClose={() => setIsMapFullscreen(false)}>
        <View style={[styles.fullScreen, { paddingTop: insets.top }]}>
          <PulseMap
            startPos={startPos}
            ambulancePos={[ambulance.currentLat, ambulance.currentLng]}
            targetPos={targetPos}
            startName={startName}
            targetName={targetName}
            routeData={routeData}
            fullscreen
            hospitals={nearbyHospitals}
            onSelectHospital={handleSelectHospital}
            onToggleFullscreen={() => setIsMapFullscreen(false)}
            controlsBottom={230}
            style={{ flex: 1 }}
          />
          <View style={[styles.sheet, { paddingBottom: Math.max(16, insets.bottom) }]}>
            <Pressable style={styles.exitBtn} onPress={() => setIsMapFullscreen(false)}>
              <Shrink size={14} color="#C4B5FD" />
              <Text style={styles.exitText}>Exit fullscreen map</Text>
            </Pressable>
            <View style={styles.sheetMeta}>
              <Text style={styles.sheetKicker}>CURRENT STAGE</Text>
              <Text style={[styles.stagePill, currentStageIndex >= 2 ? styles.stagePillDone : styles.stagePillActive]}>
                {STAGE_LABELS[currentStageIndex]}
              </Text>
            </View>
            <Text style={styles.sheetLine} numberOfLines={1}>
              {patient.name} · {patient.locationName}
            </Text>
            <Text style={styles.sheetLine} numberOfLines={1}>
              {assignedHospital.name} · {assignedHospital.distanceKm} km · {assignedHospital.etaMins} min
            </Text>
            {currentStageIndex < 4 ? (
              <Pressable style={styles.sheetAction} onPress={handleAdvanceStage}>
                <Truck size={16} color={colors.white} />
                <Text style={styles.sheetActionText}>{actionLabel}</Text>
              </Pressable>
            ) : (
              <View style={styles.sheetDone}>
                <Text style={styles.sheetDoneText}>Trip complete — patient handover done</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 28, gap: 12 },
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
    ...shadow.card,
  },
  titleRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  truckBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.amber50,
    borderWidth: 1,
    borderColor: colors.amber200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.slate900 },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate500, marginTop: 2 },
  subtitleStrong: { fontFamily: fonts.bold, color: colors.blue700 },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.slate900,
  },
  iconBtn: {
    width: 42,
    borderRadius: 12,
    backgroundColor: colors.slate800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 8 },
  gpsBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: colors.blue600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  mapBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: colors.purple600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  gpsText: { color: colors.white, fontFamily: fonts.extrabold, fontSize: 11 },
  fullScreen: { flex: 1, backgroundColor: colors.white },
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
    ...shadow.raised,
  },
  exitBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.slate900, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  exitText: { color: colors.white, fontFamily: fonts.extrabold, fontSize: 11 },
  sheetMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetKicker: { fontFamily: fonts.bold, fontSize: 10, color: colors.slate500, letterSpacing: 0.4 },
  stagePill: { overflow: 'hidden', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, fontFamily: fonts.extrabold, fontSize: 11 },
  stagePillActive: { backgroundColor: colors.amber100, color: colors.amber800 },
  stagePillDone: { backgroundColor: colors.emerald100, color: colors.emerald700 },
  sheetLine: { fontFamily: fonts.semibold, fontSize: 12, color: colors.slate800 },
  sheetAction: {
    marginTop: 4,
    backgroundColor: colors.red600,
    borderRadius: 12,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sheetActionText: { color: colors.white, fontFamily: fonts.extrabold, fontSize: 13, textTransform: 'uppercase' },
  sheetDone: { backgroundColor: colors.emerald50, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.emerald200 },
  sheetDoneText: { textAlign: 'center', color: colors.emerald800, fontFamily: fonts.bold, fontSize: 13 },
});
