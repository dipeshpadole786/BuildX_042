import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Clock, Globe, Locate, Maximize, Minimize, ZoomIn, ZoomOut } from 'lucide-react-native';
import { RouteSegment } from '@/lib/osrm';
import { colors, fonts, shadow } from '@/lib/theme';
import { buildLeafletDocument } from '@/components/map/leafletDocument';

interface PulseMapProps<T extends MapHospital> {
  startPos?: [number, number];
  ambulancePos: [number, number];
  targetPos: [number, number];
  startName?: string;
  targetName?: string;
  routeData?: RouteSegment | null;
  height?: number;
  interactive?: boolean;
  fullscreen?: boolean;
  hospitals?: T[];
  placesOnly?: boolean;
  bannerTitle?: string;
  bannerSubtitle?: string;
  onSelectHospital?: (hospital: T) => void;
  onToggleFullscreen?: () => void;
  controlsBottom?: number;
  style?: ViewStyle;
}

interface MapPoint {
  lat: number;
  lng: number;
  name: string;
}

export interface MapHospital {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  etaMins: number;
  generalBedsFree: number;
  icuBedsFree: number;
  lat: number;
  lng: number;
  markerNote?: string;
  markerUpdated?: string;
  markerTone?: 'available' | 'limited' | 'unavailable';
}

interface MapPayload {
  origin: MapPoint;
  vehicle: MapPoint;
  destination: MapPoint;
  route: [number, number][];
  hospitals: (MapHospital & { isTarget: boolean })[];
  interactive: boolean;
  placesOnly: boolean;
}

const LEAFLET_HTML = buildLeafletDocument();
const DEFAULT_CENTER = { lat: 21.1384, lng: 79.1235 };

export function PulseMap<T extends MapHospital>({
  startPos,
  ambulancePos,
  targetPos,
  startName = 'Starting Point',
  targetName = 'Destination',
  routeData,
  height = 280,
  interactive = true,
  fullscreen = false,
  hospitals = [],
  placesOnly = false,
  bannerTitle,
  bannerSubtitle,
  onSelectHospital,
  onToggleFullscreen,
  controlsBottom = 12,
  style,
}: PulseMapProps<T>) {
  const webRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tileError, setTileError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const hospitalsRef = useRef(hospitals);
  hospitalsRef.current = hospitals;
  const onSelectHospitalRef = useRef(onSelectHospital);
  onSelectHospitalRef.current = onSelectHospital;

  const payload = useMemo<MapPayload>(() => {
    const origin = startPos || ambulancePos;
    const route = routeData?.coordinates?.length
      ? routeData.coordinates
      : [origin, targetPos];
    return {
      origin: { lat: origin[0], lng: origin[1], name: startName },
      vehicle: { lat: ambulancePos[0], lng: ambulancePos[1], name: 'Live ambulance' },
      destination: { lat: targetPos[0], lng: targetPos[1], name: targetName },
      route,
      hospitals: hospitals.map((hospital) => ({
        id: hospital.id,
        name: hospital.name,
        address: hospital.address,
        distanceKm: hospital.distanceKm,
        etaMins: hospital.etaMins,
        generalBedsFree: hospital.generalBedsFree,
        icuBedsFree: hospital.icuBedsFree,
        lat: hospital.lat,
        lng: hospital.lng,
        markerNote: hospital.markerNote,
        markerUpdated: hospital.markerUpdated,
        markerTone: hospital.markerTone,
        isTarget: Math.abs(hospital.lat - targetPos[0]) < 0.001 && Math.abs(hospital.lng - targetPos[1]) < 0.001,
      })),
      interactive,
      placesOnly,
    };
  }, [startPos, ambulancePos, targetPos, startName, targetName, routeData, hospitals, interactive, placesOnly]);

  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  const pushMap = () => {
    const script = `window.updatePulseMap && window.updatePulseMap(${JSON.stringify(payloadRef.current)}); true;`;
    webRef.current?.injectJavaScript(script);
  };

  useEffect(() => {
    if (ready) pushMap();
  }, [payload, ready, reloadKey]);

  useEffect(() => {
    if (ready || loadError) return;
    const timer = setTimeout(() => {
      setLoadError('The map did not finish loading. Check your connection and retry.');
    }, 12000);
    return () => clearTimeout(timer);
  }, [ready, loadError, reloadKey]);

  const onMessage = (event: WebViewMessageEvent) => {
    let message: { type?: string; id?: string };
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (message.type === 'ready') {
      setReady(true);
      setLoadError(null);
      pushMap();
      return;
    }
    if (message.type === 'leaflet-failed') {
      setLoadError('Leaflet could not be loaded. Check your connection and retry.');
      return;
    }
    if (message.type === 'tile-ok') {
      setTileError(false);
      return;
    }
    if (message.type === 'tile-error') {
      setTileError(true);
      return;
    }
    if (message.type === 'select-hospital' && message.id) {
      const hospital = hospitalsRef.current.find((item) => item.id === message.id);
      if (hospital) onSelectHospitalRef.current?.(hospital);
    }
  };

  const retry = () => {
    setReady(false);
    setLoadError(null);
    setTileError(false);
    setReloadKey((value) => value + 1);
  };

  const zoomBy = (delta: number) => {
    webRef.current?.injectJavaScript(`window.pulseZoom && window.pulseZoom(${delta}); true;`);
  };

  const recenter = () => {
    const point = payloadRef.current.origin || DEFAULT_CENTER;
    webRef.current?.injectJavaScript(
      `window.pulseRecenter && window.pulseRecenter(${point.lat}, ${point.lng}); true;`
    );
  };

  return (
    <View
      style={[styles.frame, fullscreen ? styles.frameFull : { height }, style]}
    >
      <WebView
        key={reloadKey}
        ref={webRef}
        style={styles.web}
        originWhitelist={['*']}
        source={{ html: LEAFLET_HTML, baseUrl: 'https://unpkg.com/' }}
        javaScriptEnabled
        domStorageEnabled
        nestedScrollEnabled
        scrollEnabled
        setSupportMultipleWindows={false}
        androidLayerType="hardware"
        overScrollMode="never"
        setBuiltInZoomControls={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onMessage={onMessage}
        onError={() => setLoadError('The map view failed to open. Retry to load OpenStreetMap.')}
      />

      <View style={styles.banner} pointerEvents="none">
        <View style={styles.liveDot} />
        <View style={{ flex: 1 }}>
          <View style={styles.bannerTitleRow}>
            <Globe size={13} color={colors.blue600} />
            <Text style={styles.bannerKicker}>{bannerTitle ?? 'LIVE OSRM NAVIGATION'}</Text>
          </View>
          <Text style={styles.bannerRoute} numberOfLines={1}>
            {bannerSubtitle ?? `${startName} → ${targetName}`}
          </Text>
        </View>
      </View>

      {routeData ? (
        <View style={styles.eta} pointerEvents="none">
          <Clock size={16} color={colors.accent} />
          <View>
            <Text style={styles.etaLabel}>LIVE ROUTE ETA</Text>
            <Text style={styles.etaValue}>
              {routeData.durationMins} MINS
              <Text style={styles.etaKm}> ({routeData.distanceKm} km)</Text>
            </Text>
          </View>
        </View>
      ) : null}

      {!ready && !loadError ? (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator color={colors.blue600} />
          <Text style={styles.loadingText}>Loading OpenStreetMap…</Text>
        </View>
      ) : null}

      {loadError || tileError ? (
        <View style={styles.fallback} pointerEvents="box-none">
          <View style={styles.fallbackCard}>
            <Text style={styles.fallbackTitle}>
              {loadError ? 'Map unavailable' : 'Map tiles did not load'}
            </Text>
            <Text style={styles.fallbackBody}>
              {loadError ||
                'OpenStreetMap tiles could not be downloaded. The markers are still placed. Check the connection and retry.'}
            </Text>
            <Pressable style={styles.retry} onPress={retry}>
              <Text style={styles.retryText}>Retry map</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {interactive ? (
        <View style={[styles.controls, { bottom: controlsBottom }]}>
          <MapButton onPress={() => zoomBy(1)} label="Zoom in">
            <ZoomIn size={18} color={colors.slate800} />
          </MapButton>
          <MapButton onPress={() => zoomBy(-1)} label="Zoom out">
            <ZoomOut size={18} color={colors.slate800} />
          </MapButton>
          <MapButton onPress={recenter} label="Recenter">
            <Locate size={18} color={colors.blue600} />
          </MapButton>
          {onToggleFullscreen ? (
            <MapButton onPress={onToggleFullscreen} label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} active={fullscreen}>
              {fullscreen ? <Minimize size={18} color={colors.white} /> : <Maximize size={18} color={colors.purple600} />}
            </MapButton>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

function MapButton({
  children,
  onPress,
  label,
  active = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={[styles.controlBtn, active && styles.controlBtnActive]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    ...shadow.card,
  },
  frameFull: {
    flex: 1,
    minHeight: 320,
    borderRadius: 0,
    borderWidth: 0,
  },
  web: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#E5E7EB',
  },
  banner: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.emerald500,
  },
  bannerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bannerKicker: { fontFamily: fonts.bold, fontSize: 10, color: colors.blue700, letterSpacing: 0.4 },
  bannerRoute: { fontFamily: fonts.medium, fontSize: 11, color: colors.slate600, marginTop: 1 },
  eta: {
    position: 'absolute',
    top: 62,
    right: 10,
    maxWidth: '58%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...shadow.raised,
  },
  etaLabel: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 0.4 },
  etaValue: { color: colors.accent, fontFamily: fonts.extrabold, fontSize: 14 },
  etaKm: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 11 },
  loading: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(226,232,240,0.92)',
    gap: 8,
  },
  loadingText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.slate700 },
  fallback: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  fallbackCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 6,
    ...shadow.raised,
  },
  fallbackTitle: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.slate900 },
  fallbackBody: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate600, lineHeight: 17 },
  retry: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blue600,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryText: { color: colors.white, fontFamily: fonts.bold, fontSize: 12 },
  controls: { position: 'absolute', right: 10, gap: 6, alignItems: 'flex-end' },
  controlBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  controlBtnActive: { backgroundColor: colors.purple600, borderColor: '#6D28D9' },
});
