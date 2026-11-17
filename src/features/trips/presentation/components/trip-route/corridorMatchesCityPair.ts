import type { ClientCorridor } from "@features/trips/domain";

function normCity(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/**
 * D57 — el corredor frecuente solo se ofrece si el par de ciudades coincide.
 */
export function corridorMatchesCityPair(
  corridor: ClientCorridor,
  originCity: string | null | undefined,
  destinationCity: string | null | undefined,
): boolean {
  const origin = normCity(originCity);
  const destination = normCity(destinationCity);
  if (!origin || !destination) return false;
  return (
    normCity(corridor.originCity) === origin &&
    normCity(corridor.destinationCity) === destination
  );
}

export function filterCorridorsMatchingCityPair(
  corridors: readonly ClientCorridor[],
  originCity: string | null | undefined,
  destinationCity: string | null | undefined,
): ClientCorridor[] {
  return corridors.filter((corridor) =>
    corridorMatchesCityPair(corridor, originCity, destinationCity),
  );
}
