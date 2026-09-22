import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, ChevronRight, Hospital, Phone, RefreshCw, ShieldCheck, User } from 'lucide-react-native';
import { StageStepper } from '@/components/shared/StageStepper';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Hospital as HospitalType, Patient, mockHospitals } from '@/lib/mockData';
import { callPhone } from '@/lib/phone';
import { colors, fonts, shadow } from '@/lib/theme';

interface TripStatusPanelProps {
  currentStageIndex: number;
  onAdvanceStage: () => void;
  patient: Patient;
  assignedHospital: HospitalType;
  nearbyHospitals?: HospitalType[];
  onSelectHospital: (hospital: HospitalType) => void;
}

const STAGES = ['Dispatched', 'En Route Patient', 'Patient Picked Up', 'En Route Hospital', 'Arrived'];

export const TripStatusPanel: React.FC<TripStatusPanelProps> = ({
  currentStageIndex,
  onAdvanceStage,
  patient,
  assignedHospital,
  nearbyHospitals = [],
  onSelectHospital,
}) => {
  const [showHospitalSelector, setShowHospitalSelector] = useState(false);
  const [callNotification, setCallNotification] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleCall = (targetName: string, phone: string) => {
    setCallNotification(`Dialing ${targetName} (${phone})...`);
    callPhone(phone);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCallNotification(null), 3500);
  };

  const actionLabel =
    currentStageIndex === 0
      ? 'Confirm Dispatch Acknowledgement'
      : currentStageIndex === 1
        ? 'Mark Patient Picked Up'
        : currentStageIndex === 2
          ? 'Start Transit to Hospital'
          : 'Mark Arrived at Emergency Bay';

  const hospitals = nearbyHospitals.length > 0 ? nearbyHospitals : mockHospitals;

  return (
    <View style={styles.card}>
      {callNotification ? (
        <View style={styles.toast}>
          <Phone size={14} color={colors.white} />
          <Text style={styles.toastText} numberOfLines={2}>
            {callNotification}
          </Text>
          <Text style={styles.toastTag}>CONNECTING</Text>
        </View>
      ) : null}

      <View style={styles.stageHeader}>
        <Text style={styles.kicker}>CALL STAGE PROGRESS</Text>
        <StatusBadge
          status={currentStageIndex >= 3 ? 'in-progress' : 'dispatched'}
          label={STAGES[currentStageIndex]}
          size="sm"
        />
      </View>
      <StageStepper stages={STAGES} currentStageIndex={currentStageIndex} />

      {currentStageIndex < 4 ? (
        <Pressable style={styles.primary} onPress={onAdvanceStage}>
          <CheckCircle2 size={20} color={colors.white} />
          <Text style={styles.primaryText}>{actionLabel}</Text>
        </Pressable>
      ) : (
        <View style={styles.complete}>
          <ShieldCheck size={18} color={colors.emerald600} />
          <Text style={styles.completeText}>Trip Complete — Patient Handover Done</Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <View style={styles.infoHead}>
          <View style={styles.infoTitle}>
            <User size={16} color={colors.red600} />
            <Text style={styles.infoTitleText}>Patient Onboard Details</Text>
          </View>
          <Text style={styles.sourceChip}>{patient.callerSource}</Text>
        </View>
        <Row label="Name / Age" value={`${patient.name}, ${patient.age}y`} />
        <Row label="Reg #" value={patient.registrationNumber} valueColor={colors.blue700} />
        <Text style={styles.symptomLabel}>Symptoms</Text>
        <View style={styles.chips}>
          {patient.reportedSymptoms.map((symptom) => (
            <Text key={symptom} style={styles.symptomChip}>
              {symptom}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoHead}>
          <View style={styles.infoTitle}>
            <Hospital size={16} color={colors.blue700} />
            <Text style={[styles.infoTitleText, { color: colors.blue700 }]}>Assigned Hospital</Text>
          </View>
          <Pressable onPress={() => setShowHospitalSelector((open) => !open)} style={styles.changeBtn}>
            <RefreshCw size={12} color={colors.blue600} />
            <Text style={styles.changeText}>Change</Text>
          </Pressable>
        </View>
        <Text style={styles.hospitalName} numberOfLines={2}>
          {assignedHospital.name}
        </Text>
        <Text style={styles.address} numberOfLines={2}>
          {assignedHospital.address}
        </Text>
        <View style={styles.chips}>
          <Text style={styles.etaChip}>
            ETA: {assignedHospital.etaMins}m ({assignedHospital.distanceKm}km)
          </Text>
          <Text style={styles.levelChip}>{assignedHospital.traumaCenterLevel}</Text>
        </View>
        <View style={styles.stats}>
          <Stat label="Gen Beds" value={`${assignedHospital.generalBedsFree} free`} color={colors.emerald600} />
          <Stat label="ICU Beds" value={`${assignedHospital.icuBedsFree} free`} color={colors.amber600} />
          <Stat
            label="OT Ready"
            value={assignedHospital.otReady ? 'YES' : 'NO'}
            color={assignedHospital.otReady ? colors.emerald600 : colors.red600}
          />
        </View>
      </View>

      {showHospitalSelector ? (
        <View style={styles.selector}>
          <View style={styles.selectorHead}>
            <Text style={styles.selectorTitle}>Nearby Hospitals (Min Distance)</Text>
            <Pressable onPress={() => setShowHospitalSelector(false)}>
              <Text style={styles.close}>Close ✕</Text>
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
            {hospitals.map((hosp) => {
              const selected = hosp.id === assignedHospital.id;
              return (
                <Pressable
                  key={hosp.id}
                  onPress={() => {
                    onSelectHospital(hosp);
                    setShowHospitalSelector(false);
                  }}
                  style={[styles.hospRow, selected && styles.hospRowSelected]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hospRowName} numberOfLines={1}>
                      {hosp.name}
                    </Text>
                    <Text style={styles.hospRowMeta}>
                      {hosp.distanceKm} km · {hosp.etaMins} mins · {hosp.generalBedsFree} beds free
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.slate400} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <Text style={styles.commsLabel}>EMERGENCY DISPATCH COMMS</Text>
      <View style={styles.comms}>
        <CommButton
          label="Patient"
          color={colors.emerald600}
          onPress={() => handleCall(patient.name, patient.emergencyContact.phone)}
        />
        <CommButton
          label="Hospital"
          color={colors.blue600}
          onPress={() => handleCall(assignedHospital.name, assignedHospital.contact)}
        />
        <CommButton
          label="Control"
          color={colors.red600}
          danger
          onPress={() => handleCall('Control Dispatch HQ', '+91 108')}
        />
      </View>
    </View>
  );
};

function Row({ label, value, valueColor = colors.slate900 }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function CommButton({
  label,
  color,
  onPress,
  danger = false,
}: {
  label: string;
  color: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.commBtn, danger && styles.commBtnDanger]}>
      <Phone size={13} color={color} />
      <Text style={[styles.commText, danger && { color: colors.red700 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
    ...shadow.raised,
  },
  toast: {
    backgroundColor: colors.blue600,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toastText: { flex: 1, color: colors.white, fontFamily: fonts.semibold, fontSize: 12 },
  toastTag: {
    color: colors.white,
    backgroundColor: colors.blue800,
    fontFamily: fonts.bold,
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  stageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  kicker: { fontFamily: fonts.bold, fontSize: 11, color: colors.slate500, letterSpacing: 0.4, flex: 1 },
  primary: {
    backgroundColor: colors.red600,
    borderRadius: 14,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  primaryText: {
    color: colors.white,
    fontFamily: fonts.extrabold,
    fontSize: 14,
    textTransform: 'uppercase',
    textAlign: 'center',
    flexShrink: 1,
  },
  complete: {
    backgroundColor: colors.emerald50,
    borderWidth: 1,
    borderColor: colors.emerald200,
    borderRadius: 14,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  completeText: { color: colors.emerald800, fontFamily: fonts.bold, fontSize: 13, flexShrink: 1 },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 6,
  },
  infoHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  infoTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  infoTitleText: { fontFamily: fonts.bold, fontSize: 13, color: colors.red600, flexShrink: 1 },
  sourceChip: {
    backgroundColor: '#E2E8F0',
    color: colors.slate700,
    fontFamily: fonts.medium,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rowLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate500 },
  rowValue: { fontFamily: fonts.bold, fontSize: 12, flexShrink: 1, textAlign: 'right' },
  symptomLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.slate500, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  symptomChip: {
    backgroundColor: colors.red100,
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
  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changeText: { color: colors.blue600, fontFamily: fonts.semibold, fontSize: 12, textDecorationLine: 'underline' },
  hospitalName: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.slate900 },
  address: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate500 },
  etaChip: {
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
  levelChip: {
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
    flexShrink: 1,
  },
  stats: { flexDirection: 'row', gap: 6, marginTop: 6 },
  stat: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 6,
    alignItems: 'center',
  },
  statLabel: { fontFamily: fonts.regular, fontSize: 9, color: colors.slate500 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 11, marginTop: 2 },
  selector: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.blue600,
    padding: 12,
    gap: 8,
  },
  selectorHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectorTitle: { fontFamily: fonts.bold, fontSize: 12, color: colors.slate900 },
  close: { fontFamily: fonts.bold, fontSize: 12, color: colors.slate500 },
  hospRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  hospRowSelected: { backgroundColor: colors.blue50, borderColor: colors.blue600 },
  hospRowName: { fontFamily: fonts.bold, fontSize: 12, color: colors.slate900 },
  hospRowMeta: { fontFamily: fonts.regular, fontSize: 11, color: colors.slate500, marginTop: 2 },
  commsLabel: { fontFamily: fonts.bold, fontSize: 11, color: colors.slate500, letterSpacing: 0.3 },
  comms: { flexDirection: 'row', gap: 8 },
  commBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  commBtnDanger: { backgroundColor: colors.red50, borderColor: colors.red200 },
  commText: { fontFamily: fonts.bold, fontSize: 11, color: colors.slate800 },
});
