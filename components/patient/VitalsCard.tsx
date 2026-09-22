import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Activity, AlertTriangle, Droplet, Heart, PhoneCall, Pill, Thermometer } from 'lucide-react-native';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Patient } from '@/lib/mockData';
import { callPhone } from '@/lib/phone';
import { colors, fonts } from '@/lib/theme';

interface VitalsCardProps {
  patient: Patient;
}

type VitalTone = 'normal' | 'warning' | 'critical';

function toneStyle(status: VitalTone) {
  if (status === 'critical') return { bg: colors.red50, border: colors.red200, label: colors.red700 };
  if (status === 'warning') return { bg: colors.amber50, border: colors.amber200, label: colors.amber800 };
  return { bg: colors.emerald50, border: colors.emerald200, label: colors.emerald800 };
}

export const VitalsCard: React.FC<VitalsCardProps> = ({ patient }) => {
  const { vitals } = patient;
  const { width } = useWindowDimensions();
  const vitalWidth = width >= 700 ? '31%' : '48%';

  return (
    <SectionCard
      title={
        <View style={styles.titleWrap}>
          <View style={styles.titleRow}>
            <Activity size={18} color={colors.red600} />
            <Text style={styles.title}>Patient Clinical Report & Live Telemetry</Text>
          </View>
          <Text style={styles.reg}>{patient.registrationNumber}</Text>
        </View>
      }
      subtitle="Transmitted directly to the en-route ambulance and receiving emergency room"
    >
      <View style={styles.demoGrid}>
        <Demo label="Full Name" value={patient.name} />
        <Demo label="Age / Gender" value={`${patient.age} yrs · ${patient.gender}`} />
        <Demo label="Call Placed By" value={patient.callerSource} valueColor={colors.blue700} />
        <View style={styles.demo}>
          <Text style={styles.demoLabel}>Dispatch Priority</Text>
          <StatusBadge status="critical" label="CRITICAL CODE RED" size="sm" />
        </View>
      </View>

      <View style={styles.sectionHead}>
        <Heart size={14} color={colors.red600} />
        <Text style={styles.sectionKicker}>LIVE VITAL SIGNS</Text>
      </View>
      <View style={styles.vitalGrid}>
        <Vital
          width={vitalWidth}
          label="Blood Pressure"
          value={`${vitals.bpSystolic}/${vitals.bpDiastolic}`}
          unit="mmHg (Syst/Diast)"
          note={vitals.bpStatus === 'critical' ? 'Elevated Critical' : vitals.bpStatus === 'warning' ? 'Elevated' : 'Normal'}
          status={vitals.bpStatus}
          icon={<Heart size={14} color={colors.red600} />}
        />
        <Vital
          width={vitalWidth}
          label="Blood Sugar"
          value={`${vitals.bloodSugar}`}
          unit="mg/dL (Random)"
          note={vitals.bloodSugarStatus === 'warning' ? 'Slightly High' : vitals.bloodSugarStatus === 'critical' ? 'Critical' : 'Normal'}
          status={vitals.bloodSugarStatus}
          icon={<Droplet size={14} color={colors.amber600} />}
        />
        <Vital
          width={vitalWidth}
          label="Heart Rate"
          value={`${vitals.heartRate}`}
          unit="BPM"
          note={vitals.heartRateStatus === 'warning' ? 'Elevated' : vitals.heartRateStatus === 'critical' ? 'Critical' : 'Normal'}
          status={vitals.heartRateStatus}
          icon={<Activity size={14} color={colors.blue600} />}
        />
        <Vital
          width={vitalWidth}
          label="SpO₂ Saturation"
          value={`${vitals.spo2}%`}
          unit="O2 Oxygen Level"
          note={vitals.spo2Status === 'warning' ? 'Mild Hypoxia' : vitals.spo2Status === 'critical' ? 'Severe Hypoxia' : 'Normal'}
          status={vitals.spo2Status}
          icon={<Activity size={14} color={colors.cyan600} />}
        />
        <Vital
          width={vitalWidth}
          label="Temperature"
          value={`${vitals.temperature}°F`}
          unit="Body Temp"
          note={vitals.tempStatus === 'normal' ? 'Afebrile Normal' : 'Fever'}
          status={vitals.tempStatus}
          icon={<Thermometer size={14} color={colors.emerald600} />}
        />
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHead}>
          <AlertTriangle size={14} color={colors.amber600} />
          <Text style={styles.sectionKicker}>REPORTED SYMPTOMS</Text>
        </View>
        <View style={styles.chips}>
          {patient.reportedSymptoms.map((symptom) => (
            <Text key={symptom} style={styles.symptom}>
              {symptom}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHead}>
          <Pill size={14} color={colors.purple600} />
          <Text style={styles.sectionKicker}>ALLERGIES & MEDICATIONS</Text>
        </View>
        <Text style={styles.metaLine}>
          <Text style={styles.metaLabel}>Allergies: </Text>
          <Text style={styles.allergy}>{patient.allergies.join(', ')}</Text>
        </Text>
        <Text style={styles.metaLine}>
          <Text style={styles.metaLabel}>Medications: </Text>
          {patient.medications.join(', ')}
        </Text>
        {patient.knownConditions.length > 0 ? (
          <Text style={styles.metaLine}>
            <Text style={styles.metaLabel}>Known conditions: </Text>
            {patient.knownConditions.join(', ')}
          </Text>
        ) : null}
      </View>

      <View style={styles.contact}>
        <View style={styles.contactIcon}>
          <PhoneCall size={18} color={colors.blue700} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.metaLabel}>Emergency Contact</Text>
          <Text style={styles.contactName}>
            {patient.emergencyContact.name} ({patient.emergencyContact.relation})
          </Text>
        </View>
        <Pressable style={styles.callBtn} onPress={() => callPhone(patient.emergencyContact.phone)}>
          <PhoneCall size={14} color={colors.white} />
          <Text style={styles.callBtnText}>Call</Text>
        </Pressable>
      </View>
    </SectionCard>
  );
};

function Demo({ label, value, valueColor = colors.slate900 }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.demo}>
      <Text style={styles.demoLabel}>{label}</Text>
      <Text style={[styles.demoValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function Vital({
  width,
  label,
  value,
  unit,
  note,
  status,
  icon,
}: {
  width: '48%' | '31%';
  label: string;
  value: string;
  unit: string;
  note: string;
  status: VitalTone;
  icon: React.ReactNode;
}) {
  const tone = toneStyle(status);
  return (
    <View style={[styles.vital, { width, backgroundColor: tone.bg, borderColor: tone.border }]}>
      <View style={styles.vitalHead}>
        <Text style={styles.vitalLabel}>{label}</Text>
        {icon}
      </View>
      <Text style={styles.vitalValue}>{value}</Text>
      <Text style={styles.vitalUnit}>{unit}</Text>
      <Text style={[styles.vitalNote, { color: tone.label }]}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleWrap: { gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 16, color: colors.slate900 },
  reg: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blue50,
    color: colors.blue800,
    borderWidth: 1,
    borderColor: colors.blue200,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  demoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 10 },
  demo: { width: '47%', gap: 2 },
  demoLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.slate500 },
  demoValue: { fontFamily: fonts.bold, fontSize: 13, color: colors.slate900 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, marginBottom: 8 },
  sectionKicker: { fontFamily: fonts.bold, fontSize: 11, color: colors.slate500, letterSpacing: 0.4 },
  vitalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vital: { borderWidth: 1, borderRadius: 14, padding: 10, minHeight: 118, justifyContent: 'space-between' },
  vitalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  vitalLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 12, color: colors.slate700 },
  vitalValue: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.slate900, marginTop: 8 },
  vitalUnit: { fontFamily: fonts.regular, fontSize: 10, color: colors.slate600 },
  vitalNote: { fontFamily: fonts.bold, fontSize: 10, marginTop: 6, textTransform: 'uppercase' },
  panel: { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12, marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  symptom: {
    backgroundColor: colors.red100,
    color: colors.red800,
    borderWidth: 1,
    borderColor: colors.red200,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  metaLine: { fontFamily: fonts.regular, fontSize: 13, color: colors.slate800, marginTop: 4 },
  metaLabel: { color: colors.slate500, fontFamily: fonts.regular, fontSize: 12 },
  allergy: { color: colors.red600, fontFamily: fonts.bold },
  contact: {
    marginTop: 12,
    backgroundColor: colors.blue50,
    borderWidth: 1,
    borderColor: colors.blue200,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactName: { fontFamily: fonts.bold, fontSize: 13, color: colors.slate900, marginTop: 2 },
  callBtn: {
    backgroundColor: colors.blue600,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callBtnText: { color: colors.white, fontFamily: fonts.bold, fontSize: 12 },
});
