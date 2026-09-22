export type Triage = 'RED' | 'YELLOW' | 'GREEN';

export type Specialist = 'trauma' | 'neurosurgery' | 'cardiology' | 'orthopedics' | 'general-surgery';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface PatientNeeds {
  icu: boolean;
  ventilator: boolean;
  specialist?: Specialist;
  bloodGroup?: BloodGroup;
}

export interface SurgeHospital {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** Distance from central Nagpur, for the hospital list. Assignment uses live travel distance. */
  distanceKm: number;
  icuBeds: number;
  generalBeds: number;
  emergencyBeds: number;
  ventilators: number;
  specialists: Specialist[];
  blood: Partial<Record<BloodGroup, number>>;
  emergencyLoad: number;
}

export interface SurgeAmbulance {
  id: string;
  callSign: string;
  kind: 'ALS' | 'BLS';
  lat: number;
  lng: number;
  available: boolean;
}

export type PatientStatus = 'awaiting' | 'assigned';

export interface SurgePatient {
  id: string;
  injury: string;
  triage: Triage;
  requires: PatientNeeds;
  lat: number;
  lng: number;
  locationLabel: string;
  ambulanceId: string | null;
  hospitalId: string | null;
  status: PatientStatus;
  etaMins: number | null;
  matchReason: string | null;
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
}

export type SyncActionType = 'create_patient' | 'triage' | 'assign_ambulance' | 'assign_hospital' | 'activate_surge';

export interface SyncAction {
  id: string;
  type: SyncActionType;
  summary: string;
  createdAt: number;
  status: 'pending' | 'synced';
}

export interface EmergencySnapshot {
  hospitals: SurgeHospital[];
  ambulances: SurgeAmbulance[];
  patients: SurgePatient[];
  contacts: EmergencyContact[];
  surgeActive: boolean;
  queue: SyncAction[];
  simulatedOffline: boolean;
}
