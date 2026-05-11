import { estimateRoadDistanceKm } from "@shared/utils/geoUtils";
import {
  applySegmentDistanceResultsToStops as applySegmentDistanceResultsToStopsShared,
  buildRouteSegmentsForBatch as buildRouteSegmentsForBatchShared,
  hasManualSegmentDistances as hasManualSegmentDistancesShared,
  hasMissingStopDistances as hasMissingStopDistancesShared,
} from "@boeltech/cfdi-domain";
import type {
  MatrixSegmentInput,
  SegmentDistanceResult,
} from "@shared/geolocation/contracts/geoPorts";

import type { TripStopFormValues } from "./validation";

/**
 * Indica si algún tramo (no origen) aún no tiene distancia desde la parada anterior.
 * Se usa antes de avanzar del paso Ruta y en el submit final.
 */
export function hasMissingStopDistances(
  stops: TripStopFormValues[] | undefined,
): boolean {
  return hasMissingStopDistancesShared(stops);
}

/**
 * Rellena solo distancias vacías usando Haversine×1,30 cuando hay coordenadas
 * en dos paradas consecutivas. Misma lógica que "Recalcular distancias faltantes".
 * No sobrescribe valores ya capturados.
 */
export function fillMissingDistancesFromCoordinates(
  stops: TripStopFormValues[],
): TripStopFormValues[] {
  if (!stops || stops.length < 2) return stops;

  let changed = false;
  const updated = stops.map((stop, i) => {
    if (i === 0) return stop;

    const prev = stops[i - 1];
    const estimated = estimateRoadDistanceKm(
      prev.latitude,
      prev.longitude,
      stop.latitude,
      stop.longitude,
    );

    if (estimated !== null && !stop.distanceFromPreviousKm) {
      changed = true;
      return {
        ...stop,
        distanceFromPreviousKm: estimated,
        distanceSource: "haversine_fallback" as const,
        distanceProvider: "mapbox" as const,
        distanceConfidence: "low" as const,
        distanceComputedAt: new Date().toISOString(),
      };
    }
    return stop;
  });

  return changed ? updated : stops;
}

/** Paradas con índice ≥ 1 que tienen distancia marcada como manual. */
export function hasManualSegmentDistances(stops: TripStopFormValues[]): boolean {
  return hasManualSegmentDistancesShared(stops);
}

/**
 * Tramos consecutivos con coordenadas completas para `/geo/distance-segments`.
 * `stopIndices[k]` es el índice de parada que recibe `distanceFromPreviousKm` para el tramo k.
 */
export function buildRouteSegmentsForBatch(stops: TripStopFormValues[]): {
  segments: MatrixSegmentInput[];
  stopIndices: number[];
} {
  return buildRouteSegmentsForBatchShared(stops);
}

/** Aplica resultados del batch API al orden actual de paradas (solo índices calculados). */
export function applySegmentDistanceResultsToStops(
  stops: TripStopFormValues[],
  stopIndices: number[],
  results: SegmentDistanceResult[],
): TripStopFormValues[] {
  return applySegmentDistanceResultsToStopsShared(stops, stopIndices, results);
}
