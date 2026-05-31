import type { TripStop } from "@features/trips/domain";

export type TrackingGpsCapture = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  source: "browser" | "stop";
};

export function coordsFromStop(stop: Pick<TripStop, "latitude" | "longitude">): TrackingGpsCapture | null {
  if (stop.latitude == null || stop.longitude == null) return null;
  return {
    latitude: stop.latitude,
    longitude: stop.longitude,
    source: "stop",
  };
}

export function formatTrackingCoords(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export function readBrowserGeolocation(): Promise<TrackingGpsCapture> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Este navegador no soporta geolocalización."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracyMeters:
            position.coords.accuracy != null
              ? Math.round(position.coords.accuracy)
              : undefined,
          source: "browser",
        });
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Permiso de ubicación denegado."
            : error.code === error.TIMEOUT
              ? "Tiempo de espera agotado al obtener la ubicación."
              : "No se pudo obtener la ubicación del dispositivo.";
        reject(new Error(message));
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  });
}

export function trackingGpsToEventFields(
  gps: TrackingGpsCapture | null | undefined,
): {
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  capturedVia?: "web";
} {
  if (!gps) return {};
  return {
    latitude: gps.latitude,
    longitude: gps.longitude,
    accuracyMeters: gps.accuracyMeters,
    capturedVia: "web",
  };
}

export function formatDataUpdatedAgo(
  updatedAtMs: number,
  nowMs: number = Date.now(),
): string {
  const deltaSec = Math.max(0, Math.floor((nowMs - updatedAtMs) / 1000));
  if (deltaSec < 10) return "hace unos segundos";
  if (deltaSec < 60) return `hace ${deltaSec} s`;
  const minutes = Math.floor(deltaSec / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `hace ${hours} h`;
}
