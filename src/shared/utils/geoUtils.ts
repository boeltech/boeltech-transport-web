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

// ============================================================================
// ALGORITMO DE INTERPOLACIÓN DE TIEMPOS (Carta Porte 3.1)
// ============================================================================
//
// El SAT requiere FechaHoraSalidaLlegada por cada nodo Ubicacion:
//   - Origen  → FechaHoraSalida  (= scheduledDeparture del viaje, capturado en Paso 1)
//   - Escalas → FechaHoraLlegada + FechaHoraSalida
//   - Destino → FechaHoraLlegada (= estimatedArrival, capturado en el dialog de destino)
//
// Cuando las escalas no tienen estimatedArrival capturado, el módulo de
// Facturación debe calcularlos con el siguiente algoritmo:
//
//   Sea:
//     T_total  = estimatedArrival(destino) − scheduledDeparture(origen)  [ms]
//     D_total  = Σ distanceFromPreviousKm de todas las paradas (excepto origen)
//
//   Para cada escala i (índice 1..N-2, siendo N el total de paradas):
//     D_acumulada(i) = Σ distanceFromPreviousKm[1..i]
//     FechaHoraLlegada(i) = scheduledDeparture + (D_acumulada(i) / D_total) × T_total
//     FechaHoraSalida(i)  = FechaHoraLlegada(i) + DWELL_TIME_MS
//
//   Constante recomendada:
//     DWELL_TIME_MS = 30 * 60 * 1000  (30 minutos por defecto, configurable por parada)
//
//   Casos de borde:
//   - Si D_total === 0 (ninguna parada tiene distancia), distribuir el tiempo
//     de forma equitativa: cada escala recibe T_total / N segmentos.
//   - Si la escala ya tiene estimatedArrival capturado manualmente, usarlo
//     directamente sin interpolación.
//   - Respetar siempre el formato ISO 8601 al construir las fechas.
//
// Este algoritmo está intencionalmente fuera del wizard (no se calcula en
// tiempo real) para no complicar la captura operativa. Se ejecuta únicamente
// al generar el XML del CFDI con complemento Carta Porte 3.1.
// ============================================================================

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
