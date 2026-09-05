export type GeolocationUxStatus =
  | "empty"
  | "ready_to_locate"
  | "searching"
  | "pick"
  | "pending_confirmation"
  | "confirmed";

export type GeolocationDensity = "compact" | "comfortable";

export interface ResolveGeolocationUxStatusInput {
  readonly isGeocoding: boolean;
  readonly candidateCount: number;
  readonly selectedCandidateValue: string;
  readonly hasCoordinates: boolean;
  /** Address has CP (5 digits) + non-empty street — enough for geocoding. */
  readonly hasMinimalAddressData?: boolean;
  /** Pin is >100 km from CP center (async CP warning active). */
  readonly hasCpWarning?: boolean;
}

export function resolveGeolocationUxStatus(
  input: ResolveGeolocationUxStatusInput,
): GeolocationUxStatus {
  if (input.isGeocoding) return "searching";
  // Solo «elige coincidencia» si aún no hay pin; si el usuario arrastró/clicó, ya confirmó.
  if (
    input.candidateCount > 1 &&
    !input.selectedCandidateValue &&
    !input.hasCoordinates
  ) {
    return "pick";
  }
  if (input.hasCoordinates) {
    return input.hasCpWarning ? "pending_confirmation" : "confirmed";
  }
  if (input.hasMinimalAddressData) return "ready_to_locate";
  return "empty";
}

export const GEOLOCATION_UX_STATUS_LABEL: Record<GeolocationUxStatus, string> = {
  empty: "Sin ubicación en el mapa",
  ready_to_locate: "Listo para ubicar",
  searching: "Buscando coincidencias…",
  pick: "Elige una coincidencia",
  pending_confirmation: "Ubicación por confirmar",
  confirmed: "Ubicación confirmada",
};
