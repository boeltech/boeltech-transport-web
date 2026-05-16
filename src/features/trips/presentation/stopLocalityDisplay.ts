import type { TripStop } from "@features/trips/domain";
import { isUnifiedAddressId } from "@features/trips/domain";

export interface CatalogCodeOption {
  code: string;
  name: string;
}

export interface ResolvedStopLocality {
  municipalityName?: string | null;
  stateName?: string | null;
}

function isBareSatMunicipalityCode(value: string): boolean {
  return /^\d{1,3}$/.test(value.trim());
}

function formatLegacyTripCityLabel(
  city: string | null | undefined,
  state: string | null | undefined,
): string | null {
  const cityValue = city?.trim();
  if (!cityValue) return null;
  const stateValue = state?.trim();
  if (isBareSatMunicipalityCode(cityValue)) {
    return stateValue
      ? `Municipio ${cityValue}, ${stateValue}`
      : `Municipio ${cityValue}`;
  }
  if (stateValue) return `${cityValue}, ${stateValue}`;
  return cityValue;
}

export function toShortSatCode(value: string | null | undefined): string {
  if (!value) return "";
  const normalized = value.trim();
  if (!normalized) return "";
  const parts = normalized.split("-").filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}

export function resolveCatalogNameByCode(
  code: string | null | undefined,
  options: readonly CatalogCodeOption[],
): string | null {
  if (!code) return null;
  const trimmed = code.trim();
  if (!trimmed) return null;
  const shortCode = toShortSatCode(trimmed);
  const exact = options.find(
    (option) => option.code.toUpperCase() === trimmed.toUpperCase(),
  );
  if (exact) return exact.name;
  const byShort = options.find(
    (option) => toShortSatCode(option.code) === shortCode,
  );
  return byShort?.name ?? null;
}

export function composeStopLocalityLine(
  stop: Pick<TripStop, "city" | "state" | "postalCode" | "addressId">,
  resolved?: ResolvedStopLocality,
): string {
  const parts: string[] = [];
  const city = stop.city?.trim();
  const storedState = stop.state?.trim() || null;
  const resolvedMunicipality = resolved?.municipalityName?.trim() || null;
  const resolvedState = resolved?.stateName?.trim() || null;

  if (city && !isBareSatMunicipalityCode(city)) {
    parts.push(city);
    const state = storedState || resolvedState;
    if (state) parts.push(state);
  } else if (resolvedMunicipality) {
    parts.push(resolvedMunicipality);
    const state = storedState || resolvedState;
    if (state) parts.push(state);
  } else if (city) {
    const legacy = formatLegacyTripCityLabel(city, storedState || resolvedState);
    if (legacy) parts.push(legacy);
  } else if (resolvedState) {
    parts.push(resolvedState);
  }

  const line = parts.filter(Boolean).join(", ");
  if (stop.postalCode?.trim()) {
    return line
      ? `${line}, C.P. ${stop.postalCode.trim()}`
      : `C.P. ${stop.postalCode.trim()}`;
  }
  if (line) return line;
  if (isUnifiedAddressId(stop.addressId)) {
    return "Ubicación resuelta desde domicilio guardado";
  }
  return "";
}

export interface TripListRouteSummary {
  readonly originCity: string;
  readonly originState?: string | null;
  readonly destinationCity: string;
  readonly destinationState?: string | null;
}

export function resolveTripSummaryEndpointLabel(
  city: string | null | undefined,
  state: string | null | undefined,
  municipalityOptions: readonly CatalogCodeOption[],
  stateOptions: readonly CatalogCodeOption[],
): string | null {
  const storedCity = city?.trim();
  if (!storedCity) return null;

  const stateName =
    resolveCatalogNameByCode(state, stateOptions) ?? state?.trim() ?? null;

  if (!isBareSatMunicipalityCode(storedCity)) {
    return stateName ? `${storedCity}, ${stateName}` : storedCity;
  }

  const municipalityName = resolveCatalogNameByCode(
    storedCity,
    municipalityOptions,
  );
  if (municipalityName) {
    return stateName ? `${municipalityName}, ${stateName}` : municipalityName;
  }

  return formatLegacyTripCityLabel(storedCity, stateName);
}

export function formatTripListRouteLabel(
  trip: TripListRouteSummary,
  catalogs: {
    originMunicipalityOptions: readonly CatalogCodeOption[];
    destinationMunicipalityOptions: readonly CatalogCodeOption[];
    stateOptions: readonly CatalogCodeOption[];
  },
): string {
  const origin = resolveTripSummaryEndpointLabel(
    trip.originCity,
    trip.originState,
    catalogs.originMunicipalityOptions,
    catalogs.stateOptions,
  );
  const destination = resolveTripSummaryEndpointLabel(
    trip.destinationCity,
    trip.destinationState,
    catalogs.destinationMunicipalityOptions,
    catalogs.stateOptions,
  );

  if (!origin && !destination) return "—";
  return `${origin || "Origen"} → ${destination || "Destino"}`;
}
