/**
 * Demo blood-bank inventory for Nagpur.
 * Distances and stock are sample data, not a live hospital feed.
 * Swap `bloodBanks` for an API response later without changing the screen.
 */

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export type StockLevel = 'available' | 'limited' | 'unavailable';

export interface BloodStock {
  group: BloodGroup;
  units: number;
}

export interface BloodBank {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  updatedMinutesAgo: number;
  stock: BloodStock[];
}

export interface BloodSearchResult {
  bank: BloodBank;
  group: BloodGroup;
  units: number;
  level: StockLevel;
}

/** Reference point used only to describe the demo search area. */
export const NAGPUR_REFERENCE: [number, number] = [21.1458, 79.0882];

export const bloodBanks: BloodBank[] = [
  {
    id: 'gmch-nagpur',
    name: 'Government Medical College & Hospital',
    address: 'Medical Square, Ajni, Nagpur',
    lat: 21.1546,
    lng: 79.0934,
    distanceKm: 2.4,
    updatedMinutesAgo: 5,
    stock: [
      { group: 'O+', units: 12 },
      { group: 'O-', units: 2 },
      { group: 'A+', units: 8 },
      { group: 'A-', units: 4 },
      { group: 'B+', units: 6 },
      { group: 'B-', units: 1 },
      { group: 'AB+', units: 3 },
      { group: 'AB-', units: 0 },
    ],
  },
  {
    id: 'wockhardt-nagpur',
    name: 'Wockhardt Hospital',
    address: 'Shankar Nagar, Nagpur',
    lat: 21.1312,
    lng: 79.0628,
    distanceKm: 4.1,
    updatedMinutesAgo: 8,
    stock: [
      { group: 'O+', units: 5 },
      { group: 'O-', units: 0 },
      { group: 'A+', units: 0 },
      { group: 'A-', units: 2 },
      { group: 'B+', units: 7 },
      { group: 'B-', units: 3 },
      { group: 'AB+', units: 1 },
      { group: 'AB-', units: 0 },
    ],
  },
  {
    id: 'alexis-nagpur',
    name: 'Alexis Hospital',
    address: 'Mankapur, Koradi Road, Nagpur',
    lat: 21.1768,
    lng: 79.0896,
    distanceKm: 5.8,
    updatedMinutesAgo: 3,
    stock: [
      { group: 'O+', units: 2 },
      { group: 'O-', units: 4 },
      { group: 'A+', units: 9 },
      { group: 'A-', units: 0 },
      { group: 'B+', units: 1 },
      { group: 'B-', units: 5 },
      { group: 'AB+', units: 0 },
      { group: 'AB-', units: 2 },
    ],
  },
  {
    id: 'lata-nagpur',
    name: 'Lata Mangeshkar Hospital',
    address: 'Digdoh Hills, Hingna Road, Nagpur',
    lat: 21.1084,
    lng: 78.9992,
    distanceKm: 7.2,
    updatedMinutesAgo: 12,
    stock: [
      { group: 'O+', units: 0 },
      { group: 'O-', units: 3 },
      { group: 'A+', units: 1 },
      { group: 'A-', units: 6 },
      { group: 'B+', units: 0 },
      { group: 'B-', units: 0 },
      { group: 'AB+', units: 4 },
      { group: 'AB-', units: 1 },
    ],
  },
];

export function stockLevel(units: number): StockLevel {
  if (units <= 0) return 'unavailable';
  if (units <= 3) return 'limited';
  return 'available';
}

export function unitsFor(bank: BloodBank, group: BloodGroup): number {
  return bank.stock.find((row) => row.group === group)?.units ?? 0;
}

function compareResults(a: BloodSearchResult, b: BloodSearchResult): number {
  if (b.units !== a.units) return b.units - a.units;
  if (a.bank.distanceKm !== b.bank.distanceKm) return a.bank.distanceKm - b.bank.distanceKm;
  return a.bank.updatedMinutesAgo - b.bank.updatedMinutesAgo;
}

export function searchBloodAvailability(group: BloodGroup): {
  available: BloodSearchResult[];
  unavailable: BloodSearchResult[];
} {
  const rows = bloodBanks.map((bank) => {
    const units = unitsFor(bank, group);
    return { bank, group, units, level: stockLevel(units) };
  });
  return {
    available: rows.filter((row) => row.units > 0).sort(compareResults),
    unavailable: rows.filter((row) => row.units <= 0).sort(compareResults),
  };
}

export function parseBloodGroup(value: string): BloodGroup | null {
  const cleaned = value.trim().toUpperCase().replace(/\s+/g, '');
  return BLOOD_GROUPS.find((group) => group === cleaned) ?? null;
}
