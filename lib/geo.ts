import * as Location from 'expo-location';

export interface DeviceCoordinates {
  lat: number;
  lng: number;
  accuracy: number;
}

/** Foreground GPS fix. Returns null when permission is denied or the fix fails. */
export async function getDeviceCoordinates(): Promise<DeviceCoordinates | null> {
  try {
    const existing = await Location.getForegroundPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Location.requestForegroundPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: Math.round(position.coords.accuracy ?? 15),
    };
  } catch (error) {
    console.warn('GPS lookup failed:', error);
    return null;
  }
}
