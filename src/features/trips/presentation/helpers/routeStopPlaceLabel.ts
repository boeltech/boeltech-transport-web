/**
 * Identidad «Lugar» de ruta (F9h / D-F9h-22).
 * Misma regla en H1 (extremos), Distancias, markers y timeline primary.
 */

import type { TripStop } from "@features/trips/domain";

export function isBareSatMunicipalityCode(value: string): boolean {
  return /^\d{1,3}$/.test(value.trim());
}

/** Calle / domicilio crudo — no sirve como Lugar de corredor. */
export function looksLikeStreetAddress(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (/#\s*\d/.test(v)) return true;
  if (
    /\b(av\.?|ave\.?|avenida|calle|blvd\.?|boulevard|carretera|c\.?\s*p\.?|colonia|col\.)\b/i.test(
      v,
    ) &&
    /\d/.test(v)
  ) {
    return true;
  }
  if (v.includes(",") && v.length > 36) return true;
  return false;
}

export type RouteStopPlaceFields = Pick<
  TripStop,
  "locationName" | "city" | "address" | "sequenceOrder"
>;

/**
 * `locationName` (si no es calle) → `city` (no código SAT) → `address` → null.
 */
export function resolveRouteStopPlaceLabel(
  stop: RouteStopPlaceFields,
): string | null {
  const name = stop.locationName?.trim();
  if (name && !looksLikeStreetAddress(name)) return name;

  const city = stop.city?.trim();
  if (city && !isBareSatMunicipalityCode(city)) return city;

  const address = stop.address?.trim();
  if (address) return address;

  if (name) return name;

  return null;
}

/** Etiqueta corta con fallback «Parada N». */
export function formatRouteStopPlaceLabel(
  stop: RouteStopPlaceFields,
  fallback?: string,
): string {
  return (
    resolveRouteStopPlaceLabel(stop) ??
    fallback ??
    `Parada ${stop.sequenceOrder}`
  );
}
