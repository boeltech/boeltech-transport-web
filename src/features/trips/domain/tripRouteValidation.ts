import type { CreateStopInput, CreateTripInput } from "./inputs";
import type { Trip, TripStop } from "./entities";
import { StopType, type StopTypeValue } from "./enums";
import { isUnifiedAddressId } from "./stopAddress";

export interface TripRouteValidationError {
  code: string;
  message: string;
}

type StopTypeCarrier = {
  stopType: StopTypeValue[] | StopTypeValue | string | string[];
};

function stopIncludesType(
  stopType: StopTypeCarrier["stopType"],
  type: StopTypeValue,
): boolean {
  const types = Array.isArray(stopType) ? stopType : [stopType];
  return types.includes(type);
}

/** Resumen operativo de extremos (columnas `origin_city` / `destination_city`). */
export function validateTripEndpointSummary(
  originCity: string | null | undefined,
  destinationCity: string | null | undefined,
): TripRouteValidationError | null {
  if (!originCity?.trim()) {
    return { code: "ORIGIN_REQUIRED", message: "El origen es requerido" };
  }
  if (!destinationCity?.trim()) {
    return {
      code: "DESTINATION_REQUIRED",
      message: "El destino es requerido",
    };
  }
  return null;
}

/** Exige paradas canónicas `origin` y `destination` cuando hay ruta detallada. */
export function validateStopsIncludeOriginAndDestination(
  stops: readonly StopTypeCarrier[] | undefined,
): TripRouteValidationError | null {
  if (!stops?.length) return null;

  const hasOrigin = stops.some((stop) =>
    stopIncludesType(stop.stopType, StopType.ORIGIN),
  );
  if (!hasOrigin) {
    return {
      code: "MISSING_ORIGIN_STOP",
      message: "La ruta debe incluir una parada de origen",
    };
  }

  const hasDestination = stops.some((stop) =>
    stopIncludesType(stop.stopType, StopType.DESTINATION),
  );
  if (!hasDestination) {
    return {
      code: "MISSING_DESTINATION_STOP",
      message: "La ruta debe incluir una parada de destino",
    };
  }

  return null;
}

/** Domicilio capturable en parada: texto legacy, `address_id` o ciudad operativa. */
export function validateCreateStopHasResolvableLocation(
  stop: Pick<CreateStopInput, "address" | "city"> & {
    addressId?: string | null;
  },
): TripRouteValidationError | null {
  if (isUnifiedAddressId(stop.addressId)) return null;
  if (stop.address?.trim()) return null;
  if (stop.city?.trim()) return null;

  return {
    code: "STOP_ADDRESS_REQUIRED",
    message: "La parada debe incluir domicilio o ciudad",
  };
}

export function validateCreateTripRoute(
  input: Pick<CreateTripInput, "originCity" | "destinationCity" | "stops">,
): TripRouteValidationError | null {
  const summaryError = validateTripEndpointSummary(
    input.originCity,
    input.destinationCity,
  );
  if (summaryError) return summaryError;

  const stopsError = validateStopsIncludeOriginAndDestination(input.stops);
  if (stopsError) return stopsError;

  return null;
}

export function validateTripRouteForScheduling(
  trip: Pick<Trip, "originCity" | "destinationCity" | "stops">,
): TripRouteValidationError | null {
  const summaryError = validateTripEndpointSummary(
    trip.originCity,
    trip.destinationCity,
  );
  if (summaryError) {
    return {
      code: "MISSING_ROUTE",
      message: "El viaje debe tener origen y destino definidos",
    };
  }

  return validateStopsIncludeOriginAndDestination(trip.stops);
}

export function validateTripStopHasResolvableLocation(
  stop: Pick<TripStop, "address" | "addressId" | "city">,
): TripRouteValidationError | null {
  return validateCreateStopHasResolvableLocation(stop);
}
