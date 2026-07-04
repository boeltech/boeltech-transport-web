import type { TripStop } from "@features/trips/domain";
import {
  getEffectiveStopNombre,
  getEffectiveStopRfc,
} from "@features/trips/presentation/components/trip-fiscal/tripFiscalHelpers";
import {
  addressSearchItemToTripStopAddress,
  type AddressSearchListItem,
} from "@shared/ui/address-picker";

function normText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function coordsEqual(
  a: number | null | undefined,
  b: number | null | undefined,
): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) < 1e-6;
}

/** True si el domicilio/geo del picker difiere del snapshot actual de la parada. */
export function tripStopAddressDiffersFromSearchItem(
  stop: TripStop,
  item: AddressSearchListItem,
): boolean {
  const payload = addressSearchItemToTripStopAddress(item);

  const checks: boolean[] = [
    normText(stop.locationName) !== normText(payload.location_name),
    normText(stop.street) !== normText(payload.street),
    normText(stop.exteriorNumber) !== normText(payload.exterior_number),
    normText(stop.postalCode) !== normText(payload.postal_code),
    normText(stop.satCountryCode || "MEX") !== normText(payload.sat_country_code),
    normText(stop.satEstadoCode) !== normText(payload.sat_state_code),
    normText(stop.satMunicipioCode) !==
      normText(payload.sat_municipality_code ?? null),
    normText(stop.satColoniaCode) !== normText(payload.sat_neighborhood_code ?? null),
    normText(stop.colonia) !== normText(payload.neighborhood_name ?? null),
    !coordsEqual(stop.latitude, payload.latitude),
    !coordsEqual(stop.longitude, payload.longitude),
  ];

  return checks.some(Boolean);
}

export type InlineStopAddressFormValues = {
  addressType: "trip_stop";
  satCountryCode: string;
  postalCode: string;
  satStateCode: string;
  satMunicipalityCode: string;
  satLocalityCode: string | null;
  localityName: string | null;
  satNeighborhoodCode: string | null;
  neighborhoodName: string | null;
  street: string;
  exteriorNumber: string;
  interiorNumber: string | null;
  reference: string | null;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  isPrimary: false;
};

/** Valores iniciales camelCase alineados a `AddressInput` (no snake_case). */
export function buildInlineStopAddressDefaultValues(
  stop: TripStop,
): InlineStopAddressFormValues {
  return {
    addressType: "trip_stop",
    satCountryCode: stop.satCountryCode ?? "MEX",
    postalCode: stop.postalCode ?? "",
    satStateCode: stop.satEstadoCode ?? "",
    satMunicipalityCode: stop.satMunicipioCode ?? "",
    satLocalityCode: stop.satLocalidadCode ?? null,
    localityName: null,
    satNeighborhoodCode: stop.satColoniaCode ?? null,
    neighborhoodName: stop.colonia ?? null,
    street: stop.street ?? "",
    exteriorNumber: stop.exteriorNumber ?? "",
    interiorNumber: stop.interiorNumber ?? null,
    reference: stop.reference ?? null,
    locationName: stop.locationName ?? "",
    latitude: stop.latitude ?? null,
    longitude: stop.longitude ?? null,
    isPrimary: false,
  };
}

/** True si el payload snake_case difiere del domicilio actual de la parada. */
export function tripStopAddressDiffersFromInlinePayload(
  stop: TripStop,
  payload: Record<string, unknown>,
): boolean {
  const fieldPairs: Array<[string | null | undefined, string]> = [
    [stop.locationName, "location_name"],
    [stop.street, "street"],
    [stop.exteriorNumber, "exterior_number"],
    [stop.postalCode, "postal_code"],
    [stop.satCountryCode || "MEX", "sat_country_code"],
    [stop.satEstadoCode, "sat_state_code"],
    [stop.satMunicipioCode, "sat_municipality_code"],
    [stop.satColoniaCode, "sat_neighborhood_code"],
    [stop.colonia, "neighborhood_name"],
  ];

  for (const [stopValue, payloadKey] of fieldPairs) {
    if (!(payloadKey in payload)) continue;
    if (normText(stopValue) !== normText(payload[payloadKey] as string | null)) {
      return true;
    }
  }

  if ("latitude" in payload) {
    if (!coordsEqual(stop.latitude, payload.latitude as number | null | undefined)) {
      return true;
    }
  }
  if ("longitude" in payload) {
    if (!coordsEqual(stop.longitude, payload.longitude as number | null | undefined)) {
      return true;
    }
  }

  return false;
}

/**
 * Payload para parse SAT: domicilio del form + fiscal de la parada existente
 * (la sustitución no re-captura RFC/nombre; viven en trip_stops).
 */
export function buildInlineAddressParsePayload(
  stop: TripStop,
  addressValues: InlineStopAddressFormValues,
): Record<string, unknown> {
  const primaryRfc =
    stop.rfcRemitenteDestinatario?.trim() || getEffectiveStopRfc(stop) || undefined;
  const primaryNombre =
    stop.nombreRemitenteDestinatario?.trim() || getEffectiveStopNombre(stop) || undefined;

  return {
    addressType: "trip_stop",
    ...addressValues,
    stopType: stop.stopType,
    rfcRemitenteDestinatario: primaryRfc,
    nombreRemitenteDestinatario: primaryNombre,
    deliveryRfcRemitenteDestinatario:
      stop.deliveryRfcRemitenteDestinatario?.trim() || undefined,
    deliveryNombreRemitenteDestinatario:
      stop.deliveryNombreRemitenteDestinatario?.trim() || undefined,
  };
}
