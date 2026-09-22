import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronUp, Truck, User } from 'lucide-react-native';
import { PulseMap } from '@/components/map/PulseMap';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { mockAmbulances, mockPatients } from '@/lib/mockData';
import { colors, fonts, shadow } from '@/lib/theme';

function statusText(stageIdx: number) {
  switch (stageIdx) {
    case 1:
      return 'Dispatched — En Route Patient';
    case 2:
      return 'Patient Picked Up — En Route';
    case 3:
      return 'Arriving Soon (< 5 mins)';
    case 4:
      return 'Arrived at Emergency Bay';
    default:
      return 'En Route';
  }
}

export const AmbulanceFeed: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>('amb-01');

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.titleRow}>
            <Truck size={18} color={colors.red600} />
            <Text style={styles.title}>Incoming Emergency Ambulances</Text>
          </View>
          <Text style={styles.subtitle}>Live telemetry and route tracking for triage preparation</Text>
        </View>
        <Text style={styles.count}>{mockAmbulances.length} Active</Text>
      </View>

      {mockAmbulances.map((amb) => {
        const patient = mockPatients.find((item) => item.id === amb.assignedPatientId) || mockPatients[0];
        const expanded = expandedId === amb.id;
        return (
          <View key={amb.id} style={[styles.card, expanded && styles.cardOpen]}>
            <Pressable style={styles.cardHead} onPress={() => setExpandedId(expanded ? null : amb.id)}>
              <View style={styles.truckIcon}>
                <Truck size={20} color={colors.red600} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicle}>{amb.vehicleNumber}</Text>
                <Text style={styles.driver} numberOfLines={1}>
                  {amb.driverName}
                </Text>
                <View style={styles.patientRow}>
                  <User size={12} color={colors.slate400} />
                  <Text style={styles.patient} numberOfLines={1}>
                    {patient.name}, {patient.age}y ({patient.gender})
                  </Text>
                </View>
              </View>
              <View style={styles.statusCol}>
                <StatusBadge
                  status={amb.currentStageIndex >= 3 ? 'complete' : 'in-progress'}
                  label={statusText(amb.currentStageIndex)}
                  size="sm"
                />
                <Text style={styles.eta}>
                  ETA: {amb.etaMins}m ({amb.distanceToTargetKm}km)
                </Text>
              </View>
              {expanded ? <ChevronUp size={18} color={colors.slate400} /> : <ChevronDown size={18} color={colors.slate400} />}
            </Pressable>

            {expanded ? (
              <View style={styles.body}>
                <View style={styles.snapshot}>
                  <Text style={styles.snapLabel}>Reported symptoms</Text>
                  <View style={styles.chips}>
                    {patient.reportedSymptoms.map((symptom) => (
                      <Text key={symptom} style={styles.chip}>
                        {symptom}
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.snapLabel}>Live vitals</Text>
                  <Text style={styles.vitalLine}>
                    BP <Text style={styles.vitalRed}>{patient.vitals.bpSystolic}/{patient.vitals.bpDiastolic}</Text> mmHg
                  </Text>
                  <Text style={styles.vitalLine}>
                    SpO₂ <Text style={styles.vitalAmber}>{patient.vitals.spo2}%</Text>
                    {'  '}HR <Text style={styles.vitalBlue}>{patient.vitals.heartRate} bpm</Text>
                  </Text>
                  <Text style={styles.snapLabel}>Driver telemetry</Text>
                  <Text style={styles.vitalLine}>
                    Speed <Text style={styles.vitalGreen}>{amb.speedKmH} km/h</Text>
                  </Text>
                  <Text style={styles.vitalLine}>Phone {amb.driverPhone}</Text>
                </View>
                <Text style={styles.mapCaption}>MINI ROUTE PREVIEW · AMBULANCE → HOSPITAL</Text>
                <PulseMap
                  ambulancePos={[amb.currentLat, amb.currentLng]}
                  targetPos={[28.6139, 77.209]}
                  targetName="Apex Hospital Emergency Bay"
                  startName={amb.vehicleNumber}
                  height={200}
                  interactive
                  routeData={{
                    coordinates: [
                      [amb.currentLat, amb.currentLng],
                      [28.605, 77.215],
                      [28.6139, 77.209],
                    ],
                    distanceKm: amb.distanceToTargetKm,
                    durationMins: amb.etaMins,
                    startName: 'Vehicle',
                    endName: 'Hospital',
                  }}
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 18, color: colors.slate900 },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate500 },
  count: {
    backgroundColor: colors.red50,
    color: colors.red700,
    borderWidth: 1,
    borderColor: colors.red200,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  cardOpen: { borderColor: '#60A5FA' },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12 },
  truckIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.red50,
    borderWidth: 1,
    borderColor: colors.red200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicle: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.slate900 },
  driver: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate500 },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  patient: { fontFamily: fonts.semibold, fontSize: 12, color: colors.slate800, flex: 1 },
  statusCol: { alignItems: 'flex-end', gap: 4, maxWidth: 130 },
  eta: { fontFamily: fonts.extrabold, fontSize: 11, color: colors.blue700 },
  body: { backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: colors.border, padding: 12, gap: 10 },
  snapshot: { backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 4 },
  snapLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.slate500, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: colors.red50,
    color: colors.red700,
    borderWidth: 1,
    borderColor: colors.red200,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  vitalLine: { fontFamily: fonts.regular, fontSize: 13, color: colors.slate800 },
  vitalRed: { color: colors.red600, fontFamily: fonts.bold },
  vitalAmber: { color: colors.amber600, fontFamily: fonts.bold },
  vitalBlue: { color: colors.blue600, fontFamily: fonts.bold },
  vitalGreen: { color: colors.emerald600, fontFamily: fonts.bold },
  mapCaption: { fontFamily: fonts.bold, fontSize: 10, color: colors.slate500, letterSpacing: 0.3 },
});
