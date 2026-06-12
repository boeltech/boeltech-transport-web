/**
 * Geo Utilities
 * Shared Layer
 *
 * Funciones para cálculo de distancias geográficas.
 *
 * Ubicación: src/shared/utils/geoUtils.ts
 */

/**
 * Calcula la distancia en línea recta entre dos puntos usando la fórmula de Haversine.
 * @returns Distancia en kilómetros
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Radio de la Tierra en km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Factor de corrección carretera: distancia lineal × factor = distancia estimada por carretera.
 * Para México el promedio empírico es ~1.30 (rango 1.25–1.35).
 */
const ROAD_FACTOR = 1.3;

// Carta Porte 3.1 — resolución de FechaHoraSalidaLlegada e interpolación de escalas:
// fuente única en `@boeltech/cfdi-domain/reglas/carta-porte-fechas` (`resolveUbicacionFechas`,
// `interpolateStopTimes`, `toSatFechaH`). El API la consume al timbrar; el wizard no calcula
// fechas en tiempo real.

/**
 * Estima la distancia por carretera entre dos puntos a partir de sus coordenadas.
 * Aplica el factor de corrección carretera sobre la distancia Haversine.
 * Redondea al decimal más cercano.
 * @returns Distancia estimada en km, o null si alguna coordenada es inválida
 */
export function estimateRoadDistanceKm(
  lat1: number | null | undefined,
  lng1: number | null | undefined,
  lat2: number | null | undefined,
  lng2: number | null | undefined,
): number | null {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const linear = haversineKm(lat1, lng1, lat2, lng2);
  return Math.round(linear * ROAD_FACTOR * 10) / 10;
}
