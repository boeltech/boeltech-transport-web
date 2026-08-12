export type GeolocationUxStatus =
  | "empty"
  | "searching"
  | "pick"
  | "confirmed";

export type GeolocationDensity = "compact" | "comfortable";

export interface ResolveGeolocationUxStatusInput {
  readonly isGeocoding: boolean;
  readonly candidateCount: number;
  readonly selectedCandidateValue: string;
  readonly hasCoordinates: boolean;
}

export function resolveGeolocationUxStatus(
  input: ResolveGeolocationUxStatusInput,
): GeolocationUxStatus {
  if (input.isGeocoding) return "searching";
  if (input.candidateCount > 1 && !input.selectedCandidateValue) return "pick";
  if (input.hasCoordinates) return "confirmed";
  return "empty";
}

export const GEOLOCATION_UX_STATUS_LABEL: Record<GeolocationUxStatus, string> = {
  empty: "Sin ubicación en el mapa",
  searching: "Buscando coincidencias…",
  pick: "Elige una coincidencia",
  confirmed: "Ubicación confirmada",
};
