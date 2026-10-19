import { useQuery } from "@tanstack/react-query";
import { monitoringQueryKeys } from "../../domain";
import { monitoringApi } from "../../infrastructure";

/** Round 4 decimals — alineado a cache API (TEC §4.4). */
export function roundGeocodeKey(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

export function useReverseGeocode(
  lat: number | null | undefined,
  lon: number | null | undefined,
  options?: { enabled?: boolean; debounceKey?: string },
) {
  const hasCoords =
    lat != null &&
    lon != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lon);
  const latKey = hasCoords ? roundGeocodeKey(lat!) : 0;
  const lonKey = hasCoords ? roundGeocodeKey(lon!) : 0;

  return useQuery({
    queryKey: [
      ...monitoringQueryKeys.reverseGeocode(latKey, lonKey),
      options?.debounceKey ?? "",
    ],
    queryFn: () => monitoringApi.reverseGeocode(latKey, lonKey),
    enabled: (options?.enabled ?? true) && hasCoords,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
