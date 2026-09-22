import { SurgeAmbulance, SurgeHospital, SurgePatient, Triage } from './types';

const TRIAGE_RANK: Record<Triage, number> = { RED: 0, YELLOW: 1, GREEN: 2 };

export function travelKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 10) / 10;
}

function missing(hospital: SurgeHospital, patient: SurgePatient): string[] {
  const gaps: string[] = [];
  const needs = patient.requires;
  if (needs.icu && hospital.icuBeds <= 0) gaps.push('no ICU bed');
  if (needs.ventilator && hospital.ventilators <= 0) gaps.push('no ventilator');
  if (needs.specialist && !hospital.specialists.includes(needs.specialist)) gaps.push(`no ${needs.specialist}`);
  if (needs.bloodGroup && (hospital.blood[needs.bloodGroup] ?? 0) <= 0) gaps.push(`no ${needs.bloodGroup} blood`);
  if (!needs.icu && hospital.emergencyBeds <= 0 && hospital.generalBeds <= 0) gaps.push('no bed');
  return gaps;
}

function score(hospital: SurgeHospital, patient: SurgePatient, km: number): number | null {
  const gaps = missing(hospital, patient);
  if (gaps.length > 0) return null;
  const distanceWeight = patient.triage === 'RED' ? 2 : patient.triage === 'YELLOW' ? 4 : 6;
  let value = 100 - km * distanceWeight - hospital.emergencyLoad * 3;
  if (patient.requires.icu) value += hospital.icuBeds * 8;
  if (patient.requires.ventilator) value += hospital.ventilators * 5;
  if (patient.requires.specialist) value += 20;
  if (patient.requires.bloodGroup) value += Math.min(hospital.blood[patient.requires.bloodGroup] ?? 0, 8);
  value += hospital.emergencyBeds + hospital.generalBeds;
  return value;
}

export function recommendHospital(
  patient: SurgePatient,
  hospitals: SurgeHospital[]
): { hospital: SurgeHospital; reason: string; travelKm: number } | null {
  const ranked = hospitals
    .map((hospital) => {
      const km = travelKm(patient.lat, patient.lng, hospital.lat, hospital.lng);
      return { hospital, km, score: score(hospital, patient, km) };
    })
    .filter((row): row is { hospital: SurgeHospital; km: number; score: number } => row.score !== null)
    .sort((a, b) => b.score - a.score || a.km - b.km);

  const chosen = ranked[0];
  if (!chosen) return null;

  const nearest = [...hospitals].sort(
    (a, b) =>
      travelKm(patient.lat, patient.lng, a.lat, a.lng) - travelKm(patient.lat, patient.lng, b.lat, b.lng)
  )[0];

  let reason = `${chosen.hospital.name} (${chosen.km} km) can take this ${patient.triage} patient.`;
  if (nearest && nearest.id !== chosen.hospital.id) {
    const gaps = missing(nearest, patient);
    const nearKm = travelKm(patient.lat, patient.lng, nearest.lat, nearest.lng);
    reason =
      gaps.length > 0
        ? `${chosen.hospital.name} is ${chosen.km} km away and has the required resources. Closer ${nearest.name} (${nearKm} km) was skipped: ${gaps.join(', ')}.`
        : `${chosen.hospital.name} (${chosen.km} km) has more usable capacity than closer ${nearest.name}.`;
  }
  return { hospital: chosen.hospital, reason, travelKm: chosen.km };
}

export function consumeResources(hospital: SurgeHospital, patient: SurgePatient): SurgeHospital {
  const next = {
    ...hospital,
    blood: { ...hospital.blood },
    specialists: [...hospital.specialists],
    emergencyLoad: hospital.emergencyLoad + 1,
  };
  if (patient.requires.icu) next.icuBeds = Math.max(0, next.icuBeds - 1);
  else if (next.emergencyBeds > 0) next.emergencyBeds -= 1;
  else next.generalBeds = Math.max(0, next.generalBeds - 1);
  if (patient.requires.ventilator) next.ventilators = Math.max(0, next.ventilators - 1);
  if (patient.requires.bloodGroup) {
    const key = patient.requires.bloodGroup;
    next.blood[key] = Math.max(0, (next.blood[key] ?? 0) - 1);
  }
  return next;
}

function closestAmbulance(patient: SurgePatient, ambulances: SurgeAmbulance[]): SurgeAmbulance | null {
  const free = ambulances.filter((unit) => unit.available);
  free.sort(
    (a, b) =>
      travelKm(patient.lat, patient.lng, a.lat, a.lng) - travelKm(patient.lat, patient.lng, b.lat, b.lng)
  );
  const preferred = patient.triage === 'RED' ? free.find((unit) => unit.kind === 'ALS') : free[0];
  return preferred ?? free[0] ?? null;
}

/** Assigns every awaiting patient, critical first, and reduces hospital capacity. */
export function allocatePatients(
  hospitals: SurgeHospital[],
  ambulances: SurgeAmbulance[],
  patients: SurgePatient[]
): { hospitals: SurgeHospital[]; ambulances: SurgeAmbulance[]; patients: SurgePatient[] } {
  const nextHospitals = hospitals.map((hospital) => ({ ...hospital, blood: { ...hospital.blood } }));
  const nextAmbulances = ambulances.map((unit) => ({ ...unit }));
  const order = [...patients].sort(
    (a, b) => TRIAGE_RANK[a.triage] - TRIAGE_RANK[b.triage] || a.id.localeCompare(b.id)
  );
  const assigned = new Map<string, SurgePatient>();

  for (const patient of order) {
    if (patient.status === 'assigned') {
      assigned.set(patient.id, patient);
      continue;
    }
    const match = recommendHospital(patient, nextHospitals);
    const unit = closestAmbulance(patient, nextAmbulances);
    if (!match || !unit) {
      assigned.set(patient.id, {
        ...patient,
        matchReason: match ? 'No ambulance is free.' : 'No hospital currently has the required resources.',
      });
      continue;
    }
    const hospitalIndex = nextHospitals.findIndex((hospital) => hospital.id === match.hospital.id);
    nextHospitals[hospitalIndex] = consumeResources(nextHospitals[hospitalIndex], patient);
    const ambulanceIndex = nextAmbulances.findIndex((item) => item.id === unit.id);
    nextAmbulances[ambulanceIndex] = { ...unit, available: false };
    const eta = Math.max(6, Math.round(match.travelKm * 2 + 4));
    assigned.set(patient.id, {
      ...patient,
      status: 'assigned',
      hospitalId: match.hospital.id,
      ambulanceId: unit.id,
      etaMins: eta,
      matchReason: match.reason,
    });
  }

  return {
    hospitals: nextHospitals,
    ambulances: nextAmbulances,
    patients: patients.map((patient) => assigned.get(patient.id) ?? patient),
  };
}
