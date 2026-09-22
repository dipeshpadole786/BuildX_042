import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MapHospital, PulseMap } from '@/components/map/PulseMap';
import { useEmergency } from '@/lib/emergency/store';
import { openEmergencySms, EMERGENCY_SMS_NUMBER } from '@/lib/emergency/sms';
import { SurgePatient, Triage } from '@/lib/emergency/types';
import { colors, fonts, radius } from '@/lib/theme';

const TRIAGE_TONE = { RED: 'alert', YELLOW: 'wait', GREEN: 'ok' } as const;

export default function SurgeScreen() {
  const emergency = useEmergency();
  const { state, offline, pendingCount } = emergency;
  const [smsNote, setSmsNote] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const critical = state.patients.filter((patient) => patient.triage === 'RED').length;
  const serious = state.patients.filter((patient) => patient.triage === 'YELLOW').length;
  const stable = state.patients.filter((patient) => patient.triage === 'GREEN').length;
  const awaiting = state.patients.filter((patient) => patient.status === 'awaiting').length;
  const ambulancesFree = state.ambulances.filter((unit) => unit.available).length;
  const icuFree = state.hospitals.reduce((sum, hospital) => sum + hospital.icuBeds, 0);
  const hospitalsOpen = state.hospitals.filter(
    (hospital) => hospital.icuBeds + hospital.emergencyBeds + hospital.generalBeds > 0
  ).length;

  const sendSms = async (body?: string) => {
    const opened = await openEmergencySms(body);
    setSmsNote(
      opened
        ? 'Messages opened. Review the text, then press Send.'
        : 'This phone could not open the SMS app.'
    );
  };

  const markers: MapHospital[] = state.hospitals.map((hospital) => ({
    id: hospital.id,
    name: hospital.name,
    address: hospital.address,
    distanceKm: hospital.distanceKm,
    etaMins: 0,
    generalBedsFree: hospital.generalBeds,
    icuBedsFree: hospital.icuBeds,
    lat: hospital.lat,
    lng: hospital.lng,
    markerNote: `ICU ${hospital.icuBeds} · Emergency beds ${hospital.emergencyBeds} · Ventilators ${hospital.ventilators}`,
    markerUpdated: `Current emergency load ${hospital.emergencyLoad}`,
    markerTone: hospital.icuBeds > 0 ? 'available' : hospital.emergencyBeds > 0 ? 'limited' : 'unavailable',
  }));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={[styles.mode, offline ? styles.modeOff : styles.modeOn]}>
        <Text style={styles.modeText}>{offline ? 'OFFLINE EMERGENCY MODE' : 'ONLINE MODE'}</Text>
      </View>

      {state.syncStatus === 'syncing' ? <Text style={styles.sync}>Syncing emergency data...</Text> : null}
      {state.syncStatus === 'done' && !offline ? (
        <Text style={styles.synced}>All emergency data synchronized ✓</Text>
      ) : null}
      {offline && pendingCount > 0 ? (
        <Text style={styles.queue}>{pendingCount} offline changes waiting in the sync queue</Text>
      ) : null}

      <Card>
        <Text style={styles.cardTitle}>Network</Text>
        <Text style={styles.body}>
          {state.simulatedOffline
            ? 'Simulated blackout is on. The phone may still have internet, but Pulse is working from saved data.'
            : state.deviceOnline
              ? 'The phone reports a connection. Turn the simulator off to show a blackout.'
              : 'The phone has no connection. Cached hospitals, beds, blood, and contacts stay available.'}
        </Text>
        <Button
          label={state.simulatedOffline ? 'Internet ON' : 'Internet OFF'}
          tone={state.simulatedOffline ? 'accent' : 'ink'}
          onPress={() => emergency.setSimulatedOffline(!state.simulatedOffline)}
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>SMS Emergency Alert</Text>
        <Text style={styles.body}>Send emergency message to {EMERGENCY_SMS_NUMBER}. You still press Send in Messages.</Text>
        <Button label="Send Emergency SMS" onPress={() => sendSms()} />
        {smsNote ? <Text style={styles.note}>{smsNote}</Text> : null}
      </Card>

      <Card tone={state.surgeActive ? 'accent' : 'surface'}>
        <Text style={styles.cardTitle}>{state.surgeActive ? 'Emergency Surge Active' : 'Emergency command'}</Text>
        <Text style={styles.body}>
          Highway accident demo: 20 patients, 6 critical, 8 serious, 6 stable. Critical cases are matched to resources, not just the nearest hospital.
        </Text>
        <Button label="Demo Emergency Surge" onPress={emergency.startSurge} />
        <View style={styles.row}>
          <Pressable style={styles.secondary} onPress={emergency.addPatient}>
            <Text style={styles.secondaryText}>Add patient</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={emergency.resetSurge}>
            <Text style={styles.secondaryText}>Reset</Text>
          </Pressable>
        </View>
      </Card>

      {state.surgeActive ? (
        <View style={styles.stats}>
          <Stat label="Patients" value={String(state.patients.length)} />
          <Stat label="Critical" value={String(critical)} />
          <Stat label="Serious" value={String(serious)} />
          <Stat label="Stable" value={String(stable)} />
          <Stat label="Ambulances free" value={String(ambulancesFree)} />
          <Stat label="Hospitals open" value={String(hospitalsOpen)} />
          <Stat label="ICU beds" value={String(icuFree)} />
          <Stat label="Awaiting" value={String(awaiting)} />
        </View>
      ) : null}

      <Text style={styles.section}>Cached hospitals</Text>
      <PulseMap
        placesOnly
        height={220}
        ambulancePos={[21.1458, 79.0882]}
        targetPos={[21.1458, 79.0882]}
        bannerTitle="Cached emergency map"
        bannerSubtitle="Hospital locations saved on this phone"
        hospitals={markers}
      />

      {state.hospitals.map((hospital) => (
        <Card key={hospital.id}>
          <Text style={styles.hospital}>{hospital.name}</Text>
          <Text style={styles.meta}>{hospital.distanceKm} km from central Nagpur</Text>
          <Text style={styles.meta}>
            ICU {hospital.icuBeds} · Emergency {hospital.emergencyBeds} · General {hospital.generalBeds} · Ventilators {hospital.ventilators}
          </Text>
          <Text style={styles.meta}>Specialists: {hospital.specialists.join(', ')}</Text>
          <Text style={styles.meta}>
            Blood {Object.entries(hospital.blood).map(([group, units]) => `${group} ${units}`).join(' · ') || 'none listed'}
          </Text>
          <Text style={styles.meta}>Emergency load {hospital.emergencyLoad}</Text>
        </Card>
      ))}

      {state.patients.length > 0 ? <Text style={styles.section}>Patients</Text> : null}
      {state.patients.map((patient) => (
        <PatientCard
          key={patient.id}
          patient={patient}
          hospitalName={state.hospitals.find((hospital) => hospital.id === patient.hospitalId)?.name}
          ambulanceName={state.ambulances.find((unit) => unit.id === patient.ambulanceId)?.callSign}
          open={openId === patient.id}
          onToggle={() => setOpenId((current) => (current === patient.id ? null : patient.id))}
          onTriage={(triage) => emergency.triage(patient.id, triage)}
          onAssign={() => emergency.assign(patient.id)}
          onSms={() =>
            sendSms(
              ` CRITICAL PATIENT\n\nPatient: ${patient.id}\nPriority: ${patient.triage}\nInjury: ${patient.injury}\nICU Required: ${patient.requires.icu ? 'YES' : 'NO'}\nHospital: ${
                state.hospitals.find((hospital) => hospital.id === patient.hospitalId)?.name ?? 'Unassigned'
              }\nAmbulance ETA: ${patient.etaMins ?? '—'} min`
            )
          }
        />
      ))}

      <Text style={styles.section}>Emergency contacts</Text>
      {state.contacts.map((contact) => (
        <Card key={contact.id}>
          <Text style={styles.hospital}>{contact.name}</Text>
          <Text style={styles.meta}>{contact.role}</Text>
          <Text style={styles.meta}>{contact.phone}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PatientCard({
  patient,
  hospitalName,
  ambulanceName,
  open,
  onToggle,
  onTriage,
  onAssign,
  onSms,
}: {
  patient: SurgePatient;
  hospitalName?: string;
  ambulanceName?: string;
  open: boolean;
  onToggle: () => void;
  onTriage: (triage: Triage) => void;
  onAssign: () => void;
  onSms: () => void;
}) {
  return (
    <Card tone={patient.triage === 'RED' ? 'danger' : patient.triage === 'YELLOW' ? 'warning' : 'success'}>
      <View style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hospital}>{patient.id}</Text>
          <Text style={styles.meta}>{patient.injury}</Text>
        </View>
        <Badge label={patient.triage} tone={TRIAGE_TONE[patient.triage]} />
      </View>
      <Text style={styles.meta}>{patient.locationLabel}</Text>
      <Text style={styles.meta}>
        {patient.status === 'assigned'
          ? `${ambulanceName ?? 'Ambulance'} → ${hospitalName ?? 'Hospital'}${patient.etaMins ? ` · ETA ${patient.etaMins} min` : ''}`
          : 'Awaiting assignment'}
      </Text>
      {patient.matchReason ? <Text style={styles.reason}>{patient.matchReason}</Text> : null}
      <Pressable onPress={onToggle}>
        <Text style={styles.link}>{open ? 'Hide actions' : 'Triage and assign'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.actions}>
          {(['RED', 'YELLOW', 'GREEN'] as Triage[]).map((level) => (
            <Pressable key={level} style={styles.secondary} onPress={() => onTriage(level)}>
              <Text style={styles.secondaryText}>{level}</Text>
            </Pressable>
          ))}
          {patient.status === 'awaiting' ? (
            <Pressable style={styles.assign} onPress={onAssign}>
              <Text style={styles.assignText}>Assign</Text>
            </Pressable>
          ) : null}
          {patient.triage === 'RED' ? (
            <Pressable style={styles.assign} onPress={onSms}>
              <Text style={styles.assignText}>SMS update</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28, gap: 12 },
  mode: { borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  modeOn: { backgroundColor: colors.success },
  modeOff: { backgroundColor: colors.warning },
  modeText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.ink },
  sync: { fontFamily: fonts.bold, fontSize: 14, color: colors.accent },
  synced: { fontFamily: fonts.bold, fontSize: 14, color: colors.emerald800 },
  queue: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text, marginBottom: 6 },
  body: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  note: { fontFamily: fonts.medium, fontSize: 13, color: colors.text, marginTop: 8 },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  secondary: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  secondaryText: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  statValue: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  statLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  section: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginTop: 4 },
  hospital: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  reason: { fontFamily: fonts.medium, fontSize: 13, color: colors.text, marginTop: 8, lineHeight: 18 },
  cardHead: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  link: { fontFamily: fonts.bold, fontSize: 13, color: colors.accent, marginTop: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  assign: {
    minHeight: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  assignText: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },
});
