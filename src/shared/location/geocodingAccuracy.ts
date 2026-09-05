/**
 * Geocoding accuracy helpers (ADR-0092 / WS-LOCATION).
 */

export type GeocodingAccuracy =
  | "exact"
  | "approximate"
  | "manual"
  | "address_only"
  | "coordinates_only";

export const GEOCODING_ACCURACY_VALUES: readonly GeocodingAccuracy[] = [
  "exact",
  "approximate",
  "manual",
  "address_only",
  "coordinates_only",
] as const;

/** Operator-facing labels (ADR-0092 confirm sheet / cards — no geocoding jargon). */
export const GEOCODING_ACCURACY_LABELS: Record<GeocodingAccuracy, string> = {
  exact: "En el mapa",
  approximate: "Punto aproximado",
  manual: "Ajustada a mano",
  address_only: "Sin punto en el mapa",
  coordinates_only: "Solo punto en el mapa",
};

/** Badge semantic variants aligned with `@shared/ui/badge`. */
export type GeocodingAccuracyBadgeVariant =
  | "success"
  | "warning"
  | "info"
  | "neutral"
  | "secondary";

export const GEOCODING_ACCURACY_BADGE_VARIANT: Record<
  GeocodingAccuracy,
  GeocodingAccuracyBadgeVariant
> = {
  exact: "success",
  approximate: "info",
  manual: "warning",
  address_only: "neutral",
  coordinates_only: "secondary",
};

export function isGeocodingAccuracy(
  value: string | null | undefined,
): value is GeocodingAccuracy {
  return (
    value != null &&
    (GEOCODING_ACCURACY_VALUES as readonly string[]).includes(value)
  );
}

export function getGeocodingAccuracyLabel(
  accuracy: GeocodingAccuracy | null | undefined,
): string | null {
  if (!accuracy) return null;
  return GEOCODING_ACCURACY_LABELS[accuracy];
}

export function getGeocodingAccuracyBadgeVariant(
  accuracy: GeocodingAccuracy | null | undefined,
): GeocodingAccuracyBadgeVariant {
  if (!accuracy) return "neutral";
  return GEOCODING_ACCURACY_BADGE_VARIANT[accuracy];
}
