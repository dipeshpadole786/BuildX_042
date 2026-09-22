import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { baselineAmbulances, baselineHospitals, createHighwayPatients, emergencyContacts } from './data';
import { allocatePatients } from './match';
import { EmergencySnapshot, SurgePatient, SyncAction, Triage } from './types';

const STORAGE_KEY = 'pulse_emergency_snapshot_v1';

interface EmergencyState extends EmergencySnapshot {
  hydrated: boolean;
  deviceOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'done';
}

type Action =
  | { type: 'HYDRATE'; snapshot: EmergencySnapshot }
  | { type: 'DEVICE_ONLINE'; online: boolean }
  | { type: 'SIMULATE_OFFLINE'; offline: boolean }
  | { type: 'START_SURGE' }
  | { type: 'RESET' }
  | { type: 'ADD_PATIENT' }
  | { type: 'TRIAGE'; patientId: string; triage: Triage }
  | { type: 'ASSIGN'; patientId: string }
  | { type: 'SYNC_START' }
  | { type: 'SYNC_FINISH'; ids: string[] };

function actionId(): string {
  return `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function queueItem(type: SyncAction['type'], summary: string): SyncAction {
  return { id: actionId(), type, summary, createdAt: Date.now(), status: 'pending' };
}

function emptySnapshot(): EmergencySnapshot {
  return {
    hospitals: baselineHospitals(),
    ambulances: baselineAmbulances(),
    patients: [],
    contacts: emergencyContacts(),
    surgeActive: false,
    queue: [],
    simulatedOffline: false,
  };
}

function reducer(state: EmergencyState, action: Action): EmergencyState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.snapshot, hydrated: true };
    case 'DEVICE_ONLINE':
      return { ...state, deviceOnline: action.online };
    case 'SIMULATE_OFFLINE':
      return { ...state, simulatedOffline: action.offline, syncStatus: action.offline ? state.syncStatus : state.syncStatus };
    case 'START_SURGE': {
      const allocated = allocatePatients(baselineHospitals(), baselineAmbulances(), createHighwayPatients());
      const assignedCount = allocated.patients.filter((patient) => patient.status === 'assigned').length;
      return {
        ...state,
        ...allocated,
        contacts: state.contacts.length ? state.contacts : emergencyContacts(),
        surgeActive: true,
        syncStatus: 'idle',
        queue: [
          ...state.queue,
          queueItem('activate_surge', `Highway accident: ${assignedCount} patients allocated`),
        ],
      };
    }
    case 'RESET':
      return {
        ...state,
        hospitals: baselineHospitals(),
        ambulances: baselineAmbulances(),
        patients: [],
        surgeActive: false,
        syncStatus: 'idle',
        queue: [...state.queue, queueItem('activate_surge', 'Surge demo reset')],
      };
    case 'ADD_PATIENT': {
      const patient: SurgePatient = {
        id: `P${200 + state.patients.length}`,
        injury: 'Undifferentiated trauma',
        triage: 'YELLOW',
        requires: { icu: false, ventilator: false },
        lat: 21.1,
        lng: 79.06,
        locationLabel: 'Scene',
        ambulanceId: null,
        hospitalId: null,
        status: 'awaiting',
        etaMins: null,
        matchReason: null,
      };
      return {
        ...state,
        surgeActive: true,
        patients: [...state.patients, patient],
        syncStatus: 'idle',
        queue: [...state.queue, queueItem('create_patient', `Patient ${patient.id} created`)],
      };
    }
    case 'TRIAGE': {
      return {
        ...state,
        syncStatus: 'idle',
        patients: state.patients.map((patient) =>
          patient.id === action.patientId
            ? {
                ...patient,
                triage: action.triage,
                requires: {
                  ...patient.requires,
                  icu: action.triage === 'RED' ? true : patient.requires.icu,
                },
              }
            : patient
        ),
        queue: [...state.queue, queueItem('triage', `Patient ${action.patientId} triaged ${action.triage}`)],
      };
    }
    case 'ASSIGN': {
      const target = state.patients.find((patient) => patient.id === action.patientId);
      if (!target || target.status === 'assigned') return state;
      const pool = state.patients.filter((patient) => patient.id === target.id || patient.status === 'assigned');
      const allocated = allocatePatients(
        state.hospitals,
        state.ambulances,
        pool.map((patient) => (patient.id === target.id ? { ...patient, status: 'awaiting', hospitalId: null, ambulanceId: null } : patient))
      );
      const updated = allocated.patients.find((patient) => patient.id === target.id);
      const mergedPatients = state.patients.map(
        (patient) => allocated.patients.find((item) => item.id === patient.id) ?? patient
      );
      return {
        ...state,
        hospitals: allocated.hospitals,
        ambulances: allocated.ambulances,
        patients: mergedPatients,
        syncStatus: 'idle',
        queue: [
          ...state.queue,
          queueItem(
            'assign_hospital',
            updated?.hospitalId
              ? `Patient ${target.id} assigned to ${updated.hospitalId} via ${updated.ambulanceId}`
              : `Patient ${target.id} could not be assigned`
          ),
        ],
      };
    }
    case 'SYNC_START':
      return { ...state, syncStatus: 'syncing' };
    case 'SYNC_FINISH': {
      const ids = new Set(action.ids);
      return {
        ...state,
        syncStatus: 'done',
        queue: state.queue.map((item) => (ids.has(item.id) ? { ...item, status: 'synced' } : item)),
      };
    }
    default:
      return state;
  }
}

interface EmergencyContextValue {
  state: EmergencyState;
  offline: boolean;
  pendingCount: number;
  startSurge: () => void;
  resetSurge: () => void;
  addPatient: () => void;
  triage: (patientId: string, triage: Triage) => void;
  assign: (patientId: string) => void;
  setSimulatedOffline: (offline: boolean) => void;
}

const EmergencyContext = createContext<EmergencyContextValue | null>(null);

const initialState: EmergencyState = {
  ...emptySnapshot(),
  hydrated: false,
  deviceOnline: true,
  syncStatus: 'idle',
};

export function EmergencyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const syncing = useRef(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (!raw) {
          dispatch({ type: 'HYDRATE', snapshot: emptySnapshot() });
          return;
        }
        const saved = JSON.parse(raw) as EmergencySnapshot;
        dispatch({
          type: 'HYDRATE',
          snapshot: {
            ...emptySnapshot(),
            ...saved,
            contacts: saved.contacts?.length ? saved.contacts : emergencyContacts(),
          },
        });
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'HYDRATE', snapshot: emptySnapshot() });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const snapshot: EmergencySnapshot = {
      hospitals: state.hospitals,
      ambulances: state.ambulances,
      patients: state.patients,
      contacts: state.contacts,
      surgeActive: state.surgeActive,
      queue: state.queue,
      simulatedOffline: state.simulatedOffline,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)).catch(() => undefined);
  }, [
    state.hydrated,
    state.hospitals,
    state.ambulances,
    state.patients,
    state.contacts,
    state.surgeActive,
    state.queue,
    state.simulatedOffline,
  ]);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    const apply = (online: boolean) => dispatch({ type: 'DEVICE_ONLINE', online });
    Network.getNetworkStateAsync()
      .then((network) => apply(Boolean(network.isConnected && network.isInternetReachable !== false)))
      .catch(() => apply(true));
    subscription = Network.addNetworkStateListener((network) => {
      apply(Boolean(network.isConnected && network.isInternetReachable !== false));
    });
    return () => subscription?.remove();
  }, []);

  const offline = state.simulatedOffline || !state.deviceOnline;
  const pending = state.queue.filter((item) => item.status === 'pending');

  useEffect(() => {
    if (!state.hydrated || offline || pending.length === 0 || syncing.current) return;
    syncing.current = true;
    const ids = pending.map((item) => item.id);
    dispatch({ type: 'SYNC_START' });
    const timer = setTimeout(() => {
      dispatch({ type: 'SYNC_FINISH', ids });
      syncing.current = false;
    }, 900);
    return () => {
      clearTimeout(timer);
      syncing.current = false;
    };
  }, [state.hydrated, offline, pending.length, state.queue]);

  const value = useMemo<EmergencyContextValue>(
    () => ({
      state,
      offline,
      pendingCount: pending.length,
      startSurge: () => dispatch({ type: 'START_SURGE' }),
      resetSurge: () => dispatch({ type: 'RESET' }),
      addPatient: () => dispatch({ type: 'ADD_PATIENT' }),
      triage: (patientId, triageLevel) => dispatch({ type: 'TRIAGE', patientId, triage: triageLevel }),
      assign: (patientId) => dispatch({ type: 'ASSIGN', patientId }),
      setSimulatedOffline: (next) => dispatch({ type: 'SIMULATE_OFFLINE', offline: next }),
    }),
    [state, offline, pending.length]
  );

  return <EmergencyContext.Provider value={value}>{children}</EmergencyContext.Provider>;
}

export function useEmergency(): EmergencyContextValue {
  const value = useContext(EmergencyContext);
  if (!value) throw new Error('useEmergency must be used inside EmergencyProvider');
  return value;
}


