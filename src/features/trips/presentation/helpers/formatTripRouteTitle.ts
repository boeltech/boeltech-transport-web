/**
 * Título del detalle (D1): corredor con escalas, no el código.
 * Usa nombres de parada / localidad cuando hay stops; si no, resumen legacy.
 */

import { StopType, type TripStop } from "@features/trips/domain";

import {
  formatStopDisplayLocalityLine,
  formatTripEndpointLabel,
} from "../uiHelpers";

export type TripRouteTitleLegacy = {
  originCity?: string | null;
  originState?: string | null;
  destinationCity?: string | null;
  destinationState?: string | null;
};

function isBareSatMunicipalityCode(value: string): boolean {
  return /^\d{1,3}$/.test(value.trim());
}

/** Calle / domicilio crudo — no sirve como corredor H1 (D1 / P2-4). */
function looksLikeStreetAddress(value: string): boolean {
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

/**
 * Etiqueta de corredor: ciudad / localidad antes que domicilio o locationName.
 */
function stopLabel(stop: TripStop): string | null {
  const city = stop.city?.trim();
  if (city && !isBareSatMunicipalityCode(city)) return city;

  const localityRaw = formatStopDisplayLocalityLine(stop).trim();
  if (
    localityRaw &&
    localityRaw !== "—" &&
    !localityRaw.startsWith("Ubicación resuelta") &&
    !/^C\.P\./i.test(localityRaw)
  ) {
    const withoutCp = localityRaw
      .replace(/,?\s*C\.P\.\s*\S+.*$/i, "")
      .trim();
    if (withoutCp) {
      const cityOnly = withoutCp.split(",")[0]?.trim();
      if (cityOnly) return cityOnly;
    }
  }

  const name = stop.locationName?.trim();
  if (name && !looksLikeStreetAddress(name)) return name;

  return null;
}

/**
 * Construye «Origen → Escala → Destino» (o «Origen → Destino» / «—»).
 */
export function formatTripRouteTitle(
  stops: readonly TripStop[] | undefined,
  legacy: TripRouteTitleLegacy,
): string {
  const ordered = stops?.length
    ? [...stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    : [];

  if (ordered.length >= 2) {
    const labels = ordered
      .map((stop) => stopLabel(stop))
      .filter((label): label is string => Boolean(label));
    if (labels.length >= 2) {
      return labels.join(" → ");
    }
  }

  const originStop = ordered.find((stop) => {
    const types = Array.isArray(stop.stopType) ? stop.stopType : [stop.stopType];
    return types.includes(StopType.ORIGIN);
  });
  const destinationStop = ordered.find((stop) => {
    const types = Array.isArray(stop.stopType) ? stop.stopType : [stop.stopType];
    return types.includes(StopType.DESTINATION);
  });

  // D1: corredor por ciudad/localidad; no reutilizar locationName tipo calle.
  const origin =
    (originStop ? stopLabel(originStop) : null) ??
    formatTripEndpointLabel(undefined, {
      city: legacy.originCity,
      state: legacy.originState,
    });
  const destination =
    (destinationStop ? stopLabel(destinationStop) : null) ??
    formatTripEndpointLabel(undefined, {
      city: legacy.destinationCity,
      state: legacy.destinationState,
    });

  if (!origin && !destination) return "—";
  return `${origin || "Origen"} → ${destination || "Destino"}`;
}
