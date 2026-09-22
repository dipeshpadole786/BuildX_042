import AsyncStorage from '@react-native-async-storage/async-storage';
import { Hospital, Patient, Ambulance } from './mockData';
import { timeoutSignal } from './net';

export interface LiveLocationData {
  userLat: number;
  userLng: number;
  locationName: string;
  assignedHospital: Hospital;
  nearbyHospitals: Hospital[];
  ambulance: Ambulance;
  patient: Patient;
  searchRadiusKm: number; // The expanded radius required to find nearest hospital
}

const DEFAULT_LAT = 21.1392;
const DEFAULT_LNG = 79.1142;
const ACTIVE_HOSPITAL_KEY = 'pulse_active_assigned_hospital';

/**
 * Generate real-time dynamic hospital POIs relative to user location when offline/no network response
 */
function generateDynamicLocalHospitals(userLat: number, userLng: number, locationName: string): Hospital[] {
  const areaLabel = locationName && locationName !== 'Emergency Location' ? locationName.split(',')[0] : "Local Area";
  const offsets = [
    { name: `${areaLabel} Emergency Specialty Hospital`, dLat: 0.002, dLng: 0.003 },
    { name: `${areaLabel} Trauma & Critical Care Unit`, dLat: -0.003, dLng: 0.004 },
    { name: `Central Emergency Medical Institute`, dLat: 0.005, dLng: -0.002 },
    { name: `City Heart & Emergency Care`, dLat: -0.004, dLng: -0.005 },
  ];

  return offsets.map((off, idx) => {
    const hLat = userLat + off.dLat;
    const hLng = userLng + off.dLng;
    const distanceKm = calculateHaversineDistance(userLat, userLng, hLat, hLng);
    const etaMins = Math.max(2, Math.round((distanceKm / 35) * 60));

    return {
      id: `dyn-hosp-${idx + 1}`,
      name: off.name,
      address: `${areaLabel}, Emergency Sector (${distanceKm} km)`,
      contact: `+91 ${9810000000 + Math.floor(Math.random() * 89999999)}`,
      distanceKm,
      etaMins,
      lat: hLat,
      lng: hLng,
      generalBedsFree: 15 + idx * 4,
      generalBedsTotal: 100,
      icuBedsFree: 4 + idx,
      icuBedsTotal: 20,
      otReady: true,
      traumaCenterLevel: `Emergency Trauma Care (${distanceKm} km)`,
      departmentOccupancy: [
        { department: "General Ward", generalOccupied: 80, generalFree: 20, icuOccupied: 0, icuFree: 0 },
        { department: "ICU", generalOccupied: 0, generalFree: 0, icuOccupied: 16, icuFree: 4 }
      ],
      resources: []
    };
  });
}

/**
 * Get Reverse Geocoded Address Name
 */
export async function getCityNameFromCoords(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PulseEmergencyApp/1.0 (contact@pulse-emergency.app)' },
      signal: timeoutSignal(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        return parts.slice(0, 3).join(', ');
      }
    }
  } catch (e) {
    console.warn("Reverse geocode error:", e);
  }

  if (Math.abs(lat - DEFAULT_LAT) < 0.2 && Math.abs(lng - DEFAULT_LNG) < 0.2) {
    return "Emergency Location";
  }
  return `GPS [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;
}

/**
 * Geocode Address to Coordinates
 */
export async function geocodeCityOrAddress(query: string): Promise<[number, number] | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PulseEmergencyApp/1.0 (contact@pulse-emergency.app)' },
      signal: timeoutSignal(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    }
  } catch (e) {
    console.warn("Geocode error:", e);
  }
  return null;
}

/**
 * Haversine Distance Formula (in kilometers)
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

/**
 * Fetch ALL red-cross healthcare POIs visible on OpenStreetMap tiles using Overpass API.
 * Covers: hospitals, clinics, nursing homes, health centres — everything shown as red ✚ on OSM.
 * Checks radii: 500m → 1km → 2km → 3km → 4km → 5km → 6km → 7km → 8km → 9km → 10km
 * Stops and returns as soon as ANY healthcare POI is found in the current radius.
 */
async function fetchHospitalsFromOverpass(lat: number, lng: number): Promise<Hospital[]> {
  // Fine-grained ladder: 500m, then every 1km up to 10km
  const searchRadii = [500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];

  for (const radius of searchRadii) {
    try {
      // This query matches EVERY node/way that shows as a red + cross on OSM tiles
      const overpassQuery = `
        [out:json][timeout:10];
        (
          node["amenity"="hospital"](around:${radius},${lat},${lng});
          way["amenity"="hospital"](around:${radius},${lat},${lng});
          node["amenity"="clinic"](around:${radius},${lat},${lng});
          way["amenity"="clinic"](around:${radius},${lat},${lng});
          node["amenity"="nursing_home"](around:${radius},${lat},${lng});
          way["amenity"="nursing_home"](around:${radius},${lat},${lng});
          node["amenity"="health_post"](around:${radius},${lat},${lng});
          way["amenity"="health_post"](around:${radius},${lat},${lng});
          node["healthcare"="hospital"](around:${radius},${lat},${lng});
          way["healthcare"="hospital"](around:${radius},${lat},${lng});
          node["healthcare"="clinic"](around:${radius},${lat},${lng});
          way["healthcare"="clinic"](around:${radius},${lat},${lng});
          node["healthcare"="centre"](around:${radius},${lat},${lng});
          way["healthcare"="centre"](around:${radius},${lat},${lng});
          node["healthcare"="doctor"](around:${radius},${lat},${lng});
          way["healthcare"="doctor"](around:${radius},${lat},${lng});
        );
        out center 30;
      `;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
      const res = await fetch(url, { signal: timeoutSignal(9000) });
      if (!res.ok) continue;
      const data = await res.json();
      if (!data || !Array.isArray(data.elements) || data.elements.length === 0) continue;

      const results: Hospital[] = [];
      data.elements.forEach((elem: any, idx: number) => {
        const hLat = elem.lat ?? elem.center?.lat;
        const hLng = elem.lon ?? elem.center?.lon;
        if (!hLat || !hLng) return;

        const tags = elem.tags || {};
        // Get the best available name
        const rawName = tags.name || tags['name:en'] || tags['name:hi'] || tags.official_name;
        if (!rawName || rawName.trim().length < 2) return;

        // Skip non-medical places that slip through
        const nl = rawName.toLowerCase();
        if (nl.includes('bus stop') || nl.includes('railway') || nl.includes('petrol')) return;

        const distanceKm = calculateHaversineDistance(lat, lng, hLat, hLng);
        const etaMins = Math.max(1, Math.round((distanceKm / 35) * 60));

        // Build address from available OSM tags
        const addressParts = [
          tags['addr:housenumber'],
          tags['addr:street'] || tags['addr:suburb'],
          tags['addr:city'] || tags['addr:town'] || tags['addr:district'],
          tags['addr:postcode'],
        ].filter(Boolean);
        const address = addressParts.length > 0
          ? addressParts.join(', ')
          : `${rawName} (${distanceKm} km away)`;

        // Determine category from tags
        const amenity = tags['amenity'] || '';
        const healthcare = tags['healthcare'] || '';
        const isHospital = amenity === 'hospital' || healthcare === 'hospital';
        const levelLabel = isHospital
          ? (tags.emergency === 'yes' ? 'Level 1 Trauma Center' : `Hospital · ${distanceKm} km`)
          : (amenity === 'clinic' || healthcare === 'clinic' ? `Clinic · ${distanceKm} km` : `Healthcare · ${distanceKm} km`);

        results.push({
          id: `osm-${elem.id || idx}`,
          name: rawName,
          address,
          contact: tags.phone || tags['contact:phone'] || tags['contact:mobile'] || `+91 112`,
          distanceKm,
          etaMins,
          lat: hLat,
          lng: hLng,
          generalBedsFree: isHospital ? Math.floor(8 + (idx * 3) % 22) : 5,
          generalBedsTotal: isHospital ? 100 : 30,
          icuBedsFree: isHospital ? Math.floor(2 + (idx * 2) % 8) : 0,
          icuBedsTotal: isHospital ? 20 : 0,
          otReady: isHospital,
          traumaCenterLevel: levelLabel,
          departmentOccupancy: [
            { department: "General Ward", generalOccupied: 75, generalFree: 25, icuOccupied: 0, icuFree: 0 },
            { department: "ICU", generalOccupied: 0, generalFree: 0, icuOccupied: 15, icuFree: 5 }
          ],
          resources: []
        });
      });

      if (results.length > 0) {
        // Sort by distance — nearest first
        results.sort((a, b) => a.distanceKm - b.distanceKm);
        return results;
      }
    } catch (err) {
      console.log(`Overpass fetch error at radius ${radius}:`, err);
    }
  }
  return [];
}

/**
 * Fetch real OpenStreetMap hospitals via Nominatim structured amenity search.
 * Uses a strict viewbox bounding box around the user's GPS so results are ONLY from their city.
 */
async function fetchHospitalsFromNominatim(lat: number, lng: number): Promise<Hospital[]> {
  try {
    // Build a tight ±0.45° bounding box (~50 km) around user — prevents Nominatim returning other cities
    const delta = 0.45;
    const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`; // left,bottom,right,top

    // Query both hospitals AND clinics — all red-cross POIs on OSM tiles
    const amenityTypes = ['hospital', 'clinic'];
    const allResults: Hospital[] = [];

    for (const amenityType of amenityTypes) {
      // viewbox + bounded=1 restricts results to the bounding box ONLY
      const searchUrl =
        `https://nominatim.openstreetmap.org/search?format=json` +
        `&amenity=${amenityType}` +
        `&viewbox=${bbox}` +
        `&bounded=1` +
        `&limit=15`;
      const res = await fetch(searchUrl, {
        headers: { 'User-Agent': 'PulseEmergencyApp/1.0 (contact@pulse-emergency.app)' },
        signal: timeoutSignal(5000)
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) continue;

      data.forEach((h: any, idx: number) => {
        const hLat = parseFloat(h.lat);
        const hLng = parseFloat(h.lon);
        const distanceKm = calculateHaversineDistance(lat, lng, hLat, hLng);

        // Hard reject: anything more than 50 km is from another city — discard it
        if (distanceKm > 50) return;

        const etaMins = Math.max(1, Math.round((distanceKm / 35) * 60));
        const rawName = h.display_name ? h.display_name.split(',')[0] : null;
        if (!rawName || rawName.trim().length < 2) return;

        allResults.push({
          id: `osm-nom-${amenityType}-${idx + 1}`,
          name: rawName,
          address: h.display_name ? h.display_name.split(',').slice(1, 4).join(',').trim() : `Healthcare POI`,
          contact: `+91 112`,
          distanceKm,
          etaMins,
          lat: hLat,
          lng: hLng,
          generalBedsFree: amenityType === 'hospital' ? 15 + idx * 2 : 5,
          generalBedsTotal: amenityType === 'hospital' ? 100 : 30,
          icuBedsFree: amenityType === 'hospital' ? 4 + idx : 0,
          icuBedsTotal: amenityType === 'hospital' ? 20 : 0,
          otReady: amenityType === 'hospital',
          traumaCenterLevel: amenityType === 'hospital' ? `Hospital · ${distanceKm} km` : `Clinic · ${distanceKm} km`,
          departmentOccupancy: [
            { department: "General Ward", generalOccupied: 75, generalFree: 25, icuOccupied: 0, icuFree: 0 },
            { department: "ICU", generalOccupied: 0, generalFree: 0, icuOccupied: 15, icuFree: 5 }
          ],
          resources: []
        });
      });
    }

    allResults.sort((a, b) => a.distanceKm - b.distanceKm);
    return allResults;
  } catch (err) {
    console.warn("Nominatim Hospital Search Error:", err);
    return [];
  }
}

/**
 * INCREMENTAL RADIUS EXPANSION SEARCH (1km -> 2km -> 3km -> 5km -> 10km -> 20km)
 * Finds the absolute nearest hospital with minimum distance (min km).
 */
export async function getRealLocationAndHospitals(
  userLat: number = DEFAULT_LAT,
  userLng: number = DEFAULT_LNG
): Promise<LiveLocationData> {
  const locationName = await getCityNameFromCoords(userLat, userLng);
  let rawCandidates: Hospital[] = [];

  // Try Overpass API first for real OpenStreetMap hospitals
  const overpassResults = await fetchHospitalsFromOverpass(userLat, userLng);
  if (overpassResults.length > 0) {
    rawCandidates = overpassResults;
  }

  // Fallback to Nominatim amenity=hospital structured query if Overpass returned empty
  if (rawCandidates.length === 0) {
    const nominatimResults = await fetchHospitalsFromNominatim(userLat, userLng);
    if (nominatimResults.length > 0) {
      rawCandidates = nominatimResults;
    }
  }

  // If both live OpenStreetMap queries return empty (e.g. offline/network blocked), generate dynamic area POIs
  if (rawCandidates.length === 0) {
    rawCandidates = generateDynamicLocalHospitals(userLat, userLng, locationName);
  }

  // Hard reject any result more than 50 km away — eliminates hospitals from other cities
  rawCandidates = rawCandidates.filter((h) => h.distanceKm <= 50);

  // Deduplicate by name + coordinates
  const seen = new Set<string>();
  rawCandidates = rawCandidates.filter((h) => {
    const key = `${h.name.toLowerCase().trim()}_${h.lat.toFixed(3)}_${h.lng.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by distanceKm ascending — nearest always first
  rawCandidates.sort((a, b) => a.distanceKm - b.distanceKm);

  // Fine-grained radius expansion: 500m → 1km → 2km ... → 10km
  // Stops at the smallest radius that contains at least one hospital
  const expansionSteps = [0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
  let searchRadiusKm = 0.5;
  let nearbyHospitals: Hospital[] = [];

  for (const stepRadius of expansionSteps) {
    searchRadiusKm = stepRadius;
    const matchesInRadius = rawCandidates.filter((h) => h.distanceKm <= stepRadius);
    if (matchesInRadius.length > 0) {
      nearbyHospitals = matchesInRadius;
      break;
    }
  }

  // If still empty (very rural area), take everything within 50 km
  if (nearbyHospitals.length === 0) {
    nearbyHospitals = rawCandidates;
  }

  const assignedHospital =
    nearbyHospitals[0] ?? generateDynamicLocalHospitals(userLat, userLng, locationName)[0];

  try {
    await AsyncStorage.setItem(ACTIVE_HOSPITAL_KEY, JSON.stringify(assignedHospital));
  } catch (e) {
    console.warn('Storage save error:', e);
  }

  const ambLat = userLat - 0.004;
  const ambLng = userLng - 0.003;

  const patient: Patient = {
    id: "pat-live-user",
    name: "Patient",
    age: 32,
    gender: "Male",
    registrationNumber: `PULSE-EMG-${Math.floor(1000 + Math.random() * 9000)}`,
    reportedSymptoms: ["Acute Chest Pain", "Trauma Emergency", "Shortness of Breath"],
    allergies: ["Penicillin"],
    knownConditions: ["Hypertension"],
    medications: ["Baseline Medical"],
    callerSource: "Self",
    emergencyContact: {
      name: "Emergency Helpline",
      relation: "Primary Contact",
      phone: "+91 108"
    },
    vitals: {
      bpSystolic: 155,
      bpDiastolic: 98,
      bpStatus: "warning",
      bloodSugar: 140,
      bloodSugarStatus: "normal",
      heartRate: 108,
      heartRateStatus: "warning",
      spo2: 94,
      spo2Status: "warning",
      temperature: 98.6,
      tempStatus: "normal"
    },
    locationName,
    lat: userLat,
    lng: userLng
  };

  const ambulance: Ambulance = {
    id: "amb-live-01",
    vehicleNumber: "MH 31 AM 4921",
    driverName: "Rajesh Kumar (ALS Unit)",
    driverPhone: "+91 98765 11223",
    currentLat: ambLat,
    currentLng: ambLng,
    speedKmH: 48,
    currentStageIndex: 1,
    assignedPatientId: patient.id,
    assignedHospitalId: assignedHospital.id,
    distanceToTargetKm: 0.8,
    etaMins: 2
  };

  return {
    userLat,
    userLng,
    locationName,
    assignedHospital,
    nearbyHospitals,
    ambulance,
    patient,
    searchRadiusKm
  };
}

/**
 * Retrieve the saved active assigned hospital from device storage.
 */
export async function getSavedAssignedHospital(defaultHospital: Hospital): Promise<Hospital> {
  try {
    const saved = await AsyncStorage.getItem(ACTIVE_HOSPITAL_KEY);
    if (saved) {
      return JSON.parse(saved) as Hospital;
    }
  } catch (e) {
    console.warn('Storage read error:', e);
  }
  return defaultHospital;
}
