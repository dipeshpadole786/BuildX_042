import {
  EmergencyContact,
  SurgeAmbulance,
  SurgeHospital,
  SurgePatient,
  Triage,
} from './types';

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const baselineHospitals = (): SurgeHospital[] => [
  {
    id: 'gmch',
    name: 'Government Medical College & Hospital',
    address: 'Medical Square, Ajni, Nagpur',
    lat: 21.1546,
    lng: 79.0934,
    distanceKm: 2.4,
    icuBeds: 4,
    generalBeds: 20,
    emergencyBeds: 8,
    ventilators: 3,
    specialists: ['trauma', 'neurosurgery', 'cardiology', 'general-surgery'],
    blood: { 'O+': 12, 'O-': 2, 'A+': 8, 'B+': 6, 'AB+': 3 },
    emergencyLoad: 2,
  },
  {
    id: 'wockhardt',
    name: 'Wockhardt Hospital',
    address: 'Shankar Nagar, Nagpur',
    lat: 21.1312,
    lng: 79.0628,
    distanceKm: 4.1,
    icuBeds: 2,
    generalBeds: 12,
    emergencyBeds: 6,
    ventilators: 2,
    specialists: ['cardiology', 'orthopedics'],
    blood: { 'O+': 5, 'O-': 0, 'B+': 7, 'A+': 0 },
    emergencyLoad: 1,
  },
  {
    id: 'alexis',
    name: 'Alexis Hospital',
    address: 'Mankapur, Koradi Road, Nagpur',
    lat: 21.1768,
    lng: 79.0896,
    distanceKm: 5.8,
    icuBeds: 6,
    generalBeds: 18,
    emergencyBeds: 10,
    ventilators: 5,
    specialists: ['trauma', 'neurosurgery', 'cardiology'],
    blood: { 'O+': 2, 'O-': 4, 'A+': 9, 'B+': 1, 'AB-': 2 },
    emergencyLoad: 0,
  },
  {
    id: 'lata',
    name: 'Lata Mangeshkar Hospital',
    address: 'Digdoh Hills, Hingna Road, Nagpur',
    lat: 21.1084,
    lng: 78.9992,
    distanceKm: 7.2,
    icuBeds: 1,
    generalBeds: 15,
    emergencyBeds: 5,
    ventilators: 1,
    specialists: ['general-surgery', 'orthopedics'],
    blood: { 'O+': 0, 'O-': 3, 'A+': 1, 'AB+': 4 },
    emergencyLoad: 3,
  },
  {
    id: 'orange',
    name: 'Orange City Hospital',
    address: 'Khamla Road, Nagpur',
    lat: 21.1215,
    lng: 79.0704,
    distanceKm: 6.5,
    icuBeds: 3,
    generalBeds: 10,
    emergencyBeds: 4,
    ventilators: 2,
    specialists: ['trauma', 'cardiology'],
    blood: { 'O+': 8, 'A+': 6, 'B+': 2, 'O-': 1 },
    emergencyLoad: 1,
  },
];

export const baselineAmbulances = (): SurgeAmbulance[] =>
  [
    ['AMB-01', 'ALS', 21.14, 79.08],
    ['AMB-02', 'ALS', 21.15, 79.09],
    ['AMB-03', 'BLS', 21.12, 79.07],
    ['AMB-04', 'ALS', 21.11, 79.06],
    ['AMB-05', 'BLS', 21.13, 79.05],
    ['AMB-06', 'ALS', 21.16, 79.08],
    ['AMB-07', 'BLS', 21.1, 79.04],
    ['AMB-08', 'ALS', 21.125, 79.075],
    ['AMB-09', 'BLS', 21.135, 79.065],
    ['AMB-10', 'ALS', 21.118, 79.082],
  ].map(([callSign, kind, lat, lng]) => ({
    id: String(callSign),
    callSign: String(callSign),
    kind: kind as 'ALS' | 'BLS',
    lat: Number(lat),
    lng: Number(lng),
    available: true,
  }));

export const emergencyContacts = (): EmergencyContact[] => [
  { id: 'c1', name: 'District Control', role: 'Command desk', phone: '108' },
  { id: 'c2', name: 'GMCH Emergency', role: 'Receiving desk', phone: '0712-2701000' },
  { id: 'c3', name: 'Police Highway Unit', role: 'Scene safety', phone: '100' },
  { id: 'c4', name: 'Blood Bank Duty', role: 'GMCH blood bank', phone: '0712-2750900' },
];

interface CaseSeed {
  injury: string;
  triage: Triage;
  icu: boolean;
  ventilator: boolean;
  specialist?: SurgePatient['requires']['specialist'];
  bloodGroup?: SurgePatient['requires']['bloodGroup'];
}

const HIGHWAY: CaseSeed[] = [
  { injury: 'Head trauma', triage: 'RED', icu: true, ventilator: true, specialist: 'neurosurgery', bloodGroup: 'O+' },
  { injury: 'Chest trauma', triage: 'RED', icu: true, ventilator: true, specialist: 'trauma', bloodGroup: 'O-' },
  { injury: 'Polytrauma', triage: 'RED', icu: true, ventilator: false, specialist: 'trauma', bloodGroup: 'A+' },
  { injury: 'Severe burns', triage: 'RED', icu: true, ventilator: true, specialist: 'trauma', bloodGroup: 'B+' },
  { injury: 'Abdominal hemorrhage', triage: 'RED', icu: true, ventilator: false, specialist: 'general-surgery', bloodGroup: 'O+' },
  { injury: 'Spinal injury', triage: 'RED', icu: true, ventilator: false, specialist: 'neurosurgery', bloodGroup: 'AB+' },
  { injury: 'Open fracture', triage: 'YELLOW', icu: false, ventilator: false, specialist: 'orthopedics', bloodGroup: 'B+' },
  { injury: 'Abdominal pain, unstable', triage: 'YELLOW', icu: false, ventilator: false, specialist: 'general-surgery', bloodGroup: 'A+' },
  { injury: 'Chest wall injury', triage: 'YELLOW', icu: false, ventilator: false, specialist: 'trauma', bloodGroup: 'O+' },
  { injury: 'Facial trauma', triage: 'YELLOW', icu: false, ventilator: false, specialist: 'trauma' },
  { injury: 'Pelvic fracture', triage: 'YELLOW', icu: false, ventilator: false, specialist: 'orthopedics', bloodGroup: 'O+' },
  { injury: 'Smoke inhalation', triage: 'YELLOW', icu: false, ventilator: false, specialist: 'trauma' },
  { injury: 'Limb laceration', triage: 'YELLOW', icu: false, ventilator: false },
  { injury: 'Possible internal bleed', triage: 'YELLOW', icu: false, ventilator: false, specialist: 'general-surgery', bloodGroup: 'A+' },
  { injury: 'Minor lacerations', triage: 'GREEN', icu: false, ventilator: false },
  { injury: 'Ankle sprain', triage: 'GREEN', icu: false, ventilator: false },
  { injury: 'Contusions', triage: 'GREEN', icu: false, ventilator: false },
  { injury: 'Stable wrist fracture', triage: 'GREEN', icu: false, ventilator: false, specialist: 'orthopedics' },
  { injury: 'Anxiety, no injury found', triage: 'GREEN', icu: false, ventilator: false },
  { injury: 'Small glass wounds', triage: 'GREEN', icu: false, ventilator: false },
];

/** Twenty patients from one highway scene. Six critical, eight serious, six stable. */
export function createHighwayPatients(): SurgePatient[] {
  return HIGHWAY.map((item, index) => ({
    id: `P${101 + index}`,
    injury: item.injury,
    triage: item.triage,
    requires: {
      icu: item.icu,
      ventilator: item.ventilator,
      specialist: item.specialist,
      bloodGroup: item.bloodGroup,
    },
    lat: 21.098 + (index % 5) * 0.004,
    lng: 79.052 + Math.floor(index / 5) * 0.003,
    locationLabel: 'Wardha Road highway',
    ambulanceId: null,
    hospitalId: null,
    status: 'awaiting',
    etaMins: null,
    matchReason: null,
  }));
}
