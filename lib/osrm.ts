import { timeoutSignal } from './net';

export interface RouteSegment {
  coordinates: [number, number][]; // Array of [lat, lng]
  distanceKm: number;
  durationMins: number;
  startName: string;
  endName: string;
}

/**
 * OSRM Routing Helper using public free OSRM API (router.project-osrm.org)
 * with reliable fallback geometry if offline or rate-limited.
 */
export async function fetchOsrmRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<RouteSegment> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const response = await fetch(url, { signal: timeoutSignal(4000) });

    if (response.ok) {
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
        const coordinates: [number, number][] = route.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );
        const distanceKm = parseFloat((route.distance / 1000).toFixed(1));
        const durationMins = Math.max(1, Math.round(route.duration / 60));

        return {
          coordinates,
          distanceKm,
          durationMins,
          startName: "Live Vehicle Location",
          endName: "Assigned Destination"
        };
      }
    }
  } catch (err) {
    console.log("Public OSRM API fallback activated:", err);
  }

  // Reliable offline fallback route calculation
  const pointsCount = 15;
  const coordinates: [number, number][] = [];

  for (let i = 0; i <= pointsCount; i++) {
    const ratio = i / pointsCount;
    const curvatureFactor = Math.sin(ratio * Math.PI) * 0.0025;
    const lat = startLat + (endLat - startLat) * ratio + (i % 2 === 0 ? curvatureFactor : -curvatureFactor);
    const lng = startLng + (endLng - startLng) * ratio + (i % 2 !== 0 ? curvatureFactor : -curvatureFactor);
    coordinates.push([lat, lng]);
  }

  const dLat = (endLat - startLat) * 111;
  const dLng = (endLng - startLng) * 111 * Math.cos((startLat + endLat) / 2 * (Math.PI / 180));
  const distanceKm = Math.hypot(dLat, dLng);
  const durationMins = Math.max(1, Math.round((distanceKm / 45) * 60));

  return {
    coordinates,
    distanceKm: parseFloat(distanceKm.toFixed(1)),
    durationMins,
    startName: "Live Vehicle Location",
    endName: "Assigned Destination"
  };
}
