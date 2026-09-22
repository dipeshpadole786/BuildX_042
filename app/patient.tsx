import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Hospital as HospitalIcon, Locate, Phone, Search, Truck, User } from 'lucide-react-native';
import { PulseMap } from '@/components/map/PulseMap';
import { VitalsCard } from '@/components/patient/VitalsCard';
import { StatusTimeline } from '@/components/patient/StatusTimeline';
import { SectionCard } from '@/components/shared/SectionCard';
import { StageStepper } from '@/components/shared/StageStepper';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { NoticeBanner } from '@/components/shared/NoticeBanner';
import { Ambulance, Hospital, Patient, mockAmbulances, mockHospitals, mockPatients } from '@/lib/mockData';
import { geocodeCityOrAddress, getRealLocationAndHospitals, LiveLocationData } from '@/lib/locationStore';
import { fetchOsrmRoute, RouteSegment } from '@/lib/osrm';
import { getDeviceCoordinates } from '@/lib/geo';
import { callPhone } from '@/lib/phone';
import { colors, fonts, shadow } from '@/lib/theme';

const PATIENT_STAGES = [
  'Call Placed',
  'Ambulance Dispatched',
  'Ambulance Arriving',
  'Picked Up',
  'En Route Hospital',
  'Arrived Emergency Bay',
];

const NANDANVAN: [number, number] = [21.1384, 79.1235];

export default function PatientScreen() {
  const [patient, setPatient] = useState<Patient>(mockPatients[0]);
  const [ambulance, setAmbulance] = useState<Ambulance>(mockAmbulances[0]);
  const [hospital, setHospital] = useState<Hospital>(mockHospitals[0]);
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>(mockHospitals);
  const [routeData, setRouteData] = useState<RouteSegment | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(2);
  const [isLocating, setIsLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>('Searching OpenStreetMap hospitals...');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const applyLive = async (live: LiveLocationData, destination: [number, number], message: string) => {
    setPatient(live.patient);
    setHospital(live.assignedHospital);
    setNearbyHospitals(live.nearbyHospitals);
    setAmbulance(live.ambulance);
    const route = await fetchOsrmRoute(
      live.ambulance.currentLat,
      live.ambulance.currentLng,
      destination[0],
      destination[1]
    );
    setRouteData(route);
    setNotice(message);
  };

  const loadPreset = async () => {
    setIsLocating(true);
    setNotice('Searching OpenStreetMap emergency hospitals around Nandanvan, Nagpur...');
    const live = await getRealLocationAndHospitals(NANDANVAN[0], NANDANVAN[1]);
    await applyLive(
      live,
      NANDANVAN,
      `Nearest real hospital (${live.assignedHospital.distanceKm} km): ${live.assignedHospital.name}`
    );
    setIsLocating(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLocating(true);
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
        `Nearest hospital (${live.assignedHospital.distanceKm} km): ${live.assignedHospital.name}`
      );
      setIsLocating(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchOsrmRoute(ambulance.currentLat, ambulance.currentLng, patient.lat, patient.lng).then((route) => {
      if (!cancelled) setRouteData(route);
    });
    return () => {
      cancelled = true;
    };
  }, [ambulance.currentLat, ambulance.currentLng, patient.lat, patient.lng]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setNotice(`Searching real hospitals around "${searchQuery}"...`);
    const coords = await geocodeCityOrAddress(searchQuery);
    if (!coords) {
      setNotice(`Could not locate "${searchQuery}". Try another landmark.`);
      setIsSearching(false);
      return;
    }
    const live = await getRealLocationAndHospitals(coords[0], coords[1]);
    await applyLive(
      live,
      coords,
      `Nearest real hospital (${live.assignedHospital.distanceKm} km): ${live.assignedHospital.name}`
    );
    setIsSearching(false);
  };

  const detectGps = async () => {
    setIsLocating(true);
    const coords = await getDeviceCoordinates();
    if (!coords) {
      await loadPreset();
      return;
    }
    const live = await getRealLocationAndHospitals(coords.lat, coords.lng);
    await applyLive(
      live,
      [coords.lat, coords.lng],
      `GPS locked. Nearest hospital (${live.assignedHospital.distanceKm} km): ${live.assignedHospital.name}`
    );
    setIsLocating(false);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      {notice ? <NoticeBanner message={notice} tone="emerald" tag="MIN KM SEARCH" /> : null}

      <View style={styles.headerCard}>
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <User size={22} color={colors.emerald600} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Patient Emergency Dispatch</Text>
            <Text style={styles.meta}>
              {patient.name} · <Text style={styles.reg}>{patient.registrationNumber}</Text>
            </Text>
          </View>
        </View>
        <View style={styles.searchRow}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search area"
            placeholderTextColor={colors.slate400}
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <Pressable style={styles.searchBtn} onPress={handleSearch} disabled={isSearching}>
            <Search size={16} color={colors.white} />
          </Pressable>
        </View>
        <View style={styles.actionRow}>
          <Pressable style={styles.gpsBtn} onPress={detectGps} disabled={isLocating}>
            <Locate size={14} color={colors.white} />
            <Text style={styles.gpsText}>{isLocating ? 'Locating...' : 'Detect GPS'}</Text>
          </Pressable>
          <StatusBadge status="in-progress" label={PATIENT_STAGES[currentStageIndex]} size="sm" />
        </View>
      </View>

      <SectionCard
        title={
          <View style={styles.titleRow}>
            <Truck size={18} color={colors.amber600} />
            <Text style={styles.sectionTitle}>Active Dispatch & Live Map</Text>
          </View>
        }
        subtitle="Live feed connecting the caller, the driver unit, and the receiving emergency bay"
      >
        <View style={styles.stepperBox}>
          <StageStepper
            stages={PATIENT_STAGES}
            currentStageIndex={currentStageIndex}
            onSelectStage={setCurrentStageIndex}
          />
        </View>

        <View style={styles.unitCard}>
          <View style={styles.unitHead}>
            <View style={styles.unitTitle}>
              <Truck size={14} color={colors.amber700} />
              <Text style={styles.unitTitleText}>Assigned Ambulance</Text>
            </View>
            <Text style={styles.etaPill}>ETA {ambulance.etaMins} min</Text>
          </View>
          <Text style={styles.unitName}>{ambulance.vehicleNumber}</Text>
          <Text style={styles.unitMeta}>Driver: {ambulance.driverName}</Text>
          <Text style={styles.unitMeta}>Phone: {ambulance.driverPhone}</Text>
          <Pressable style={styles.callAmber} onPress={() => callPhone(ambulance.driverPhone)}>
            <Phone size={14} color={colors.white} />
            <Text style={styles.callText}>Call Driver Directly</Text>
          </Pressable>
        </View>

        <View style={styles.unitCard}>
          <View style={styles.unitHead}>
            <View style={styles.unitTitle}>
              <HospitalIcon size={14} color={colors.blue700} />
              <Text style={[styles.unitTitleText, { color: colors.blue700 }]}>Nearest Hospital</Text>
            </View>
            <Text style={styles.kmPill}>{hospital.distanceKm} km away</Text>
          </View>
          <Text style={styles.unitName}>{hospital.name}</Text>
          <Text style={styles.unitMeta} numberOfLines={2}>
            {hospital.address}
          </Text>
          <Text style={styles.unitMeta}>
            {hospital.distanceKm} km · {hospital.etaMins} min · {hospital.traumaCenterLevel}
          </Text>
          <Pressable style={styles.callBlue} onPress={() => callPhone(hospital.contact)}>
            <Phone size={14} color={colors.white} />
            <Text style={styles.callText}>Call Hospital Desk</Text>
          </Pressable>
        </View>

        <Text style={styles.mapCaption}>LIVE AMBULANCE APPROACH · REAL-TIME OSRM</Text>
        <PulseMap
          ambulancePos={[ambulance.currentLat, ambulance.currentLng]}
          targetPos={[hospital.lat, hospital.lng]}
          targetName={hospital.name}
          startPos={[patient.lat, patient.lng]}
          startName={patient.locationName}
          height={240}
          routeData={routeData}
          hospitals={nearbyHospitals}
          onSelectHospital={setHospital}
        />
      </SectionCard>

      <VitalsCard patient={patient} />
      <StatusTimeline />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
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
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.emerald50,
    borderWidth: 1,
    borderColor: colors.emerald200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.slate900 },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate500, marginTop: 2 },
  reg: { fontFamily: fonts.bold, color: colors.blue700 },
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
  searchBtn: {
    width: 42,
    borderRadius: 12,
    backgroundColor: colors.slate800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  gpsBtn: {
    backgroundColor: colors.blue600,
    borderRadius: 12,
    minHeight: 36,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gpsText: { color: colors.white, fontFamily: fonts.bold, fontSize: 12 },
  sectionTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 16, color: colors.slate900 },
  stepperBox: { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 8 },
  unitCard: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 4,
  },
  unitHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 },
  unitTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  unitTitleText: { fontFamily: fonts.bold, fontSize: 13, color: colors.amber700 },
  etaPill: {
    backgroundColor: colors.blue50,
    color: colors.blue800,
    borderWidth: 1,
    borderColor: colors.blue200,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  kmPill: {
    backgroundColor: colors.emerald50,
    color: colors.emerald800,
    borderWidth: 1,
    borderColor: colors.emerald200,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  unitName: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.slate900 },
  unitMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate600 },
  callAmber: {
    marginTop: 8,
    backgroundColor: colors.amber600,
    borderRadius: 10,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  callBlue: {
    marginTop: 8,
    backgroundColor: colors.blue600,
    borderRadius: 10,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  callText: { color: colors.white, fontFamily: fonts.bold, fontSize: 12 },
  mapCaption: { marginTop: 14, marginBottom: 8, fontFamily: fonts.bold, fontSize: 10, color: colors.blue700, letterSpacing: 0.3 },
});
