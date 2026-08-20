/**
 * Tipos de dominio del canvas de alta (ADR-0078 F2).
 * Contratos GET /trips/corridors y GET /trips/route-estimate (F0).
 */
import type { CurrencyType, StopTypeValue } from "./enums";
import type { CreateStopInput } from "./inputs";

/** Parada clonable ⊆ CreateStopInput (CONTRACT-FREEZE-F0 §1.1). */
export interface CorridorStopSnapshot {
  sequenceOrder: number;
  stopType: StopTypeValue[];
  sourceAddressId?: string;
  address?: string;
  city: string;
  state?: string;
  postalCode?: string;
  locationName?: string;
  street?: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  colonia?: string;
  reference?: string;
  satCountryCode?: string;
  satStateCode?: string;
  satMunicipalityCode?: string;
  satLocalityCode?: string;
  satNeighborhoodCode?: string;
  latitude?: number;
  longitude?: number;
  rfcRemitenteDestinatario?: string;
  nombreRemitenteDestinatario?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface ClientCorridor {
  corridorKey: string;
  originCity: string;
  originState: string | null;
  destinationCity: string;
  destinationState: string | null;
  stopCount: number;
  tripCount: number;
  lastUsedAt: string;
  sampleTripId: string;
  stopsSnapshot: CorridorStopSnapshot[];
}

export interface RouteEstimate {
  fuelEstimate: number;
  tollEstimate: number;
  totalEstimate: number;
  currency: CurrencyType;
  basedOnTrips: number;
  estimatedDistanceKm: number | null;
  vehicleEfficiencyKmL: number | null;
  adjusted: boolean;
  disclaimer: string;
}

export interface RouteEstimateParams {
  clientId: string;
  corridorKey?: string;
  originCity?: string;
  destinationCity?: string;
  vehicleId?: string;
}

export type ClonedStopInput = CreateStopInput;

/**
 * Clona stops_snapshot → CreateStopInput (clon estructural F0).
 * Reasigna sequenceOrder 1..N. No clona estimatedArrival/notes/distancias.
 * El relleno de tramos (Haversine×1,30) lo hace `finalizeReplaceStopsPayload`.
 */
export function mapSnapshotToCreateStops(
  snapshot: CorridorStopSnapshot[],
): CreateStopInput[] {
  return snapshot.map((stop, index) => {
    const fromSnapshot =
      stop.address?.trim() || stop.locationName?.trim() || "";
    const address =
      fromSnapshot.length >= 5
        ? fromSnapshot
        : stop.city.trim().length >= 5
          ? stop.city.trim()
          : `Ubicación ${stop.city}`.trim();

    const input: CreateStopInput = {
      sequenceOrder: index + 1,
      stopType: stop.stopType,
      address,
      city: stop.city,
    };

    if (stop.sourceAddressId) input.sourceAddressId = stop.sourceAddressId;
    if (stop.state) input.state = stop.state;
    if (stop.postalCode) input.postalCode = stop.postalCode;
    if (stop.locationName) input.locationName = stop.locationName;
    if (stop.street) input.street = stop.street;
    if (stop.exteriorNumber) input.exteriorNumber = stop.exteriorNumber;
    if (stop.interiorNumber) input.interiorNumber = stop.interiorNumber;
    if (stop.colonia) input.colonia = stop.colonia;
    if (stop.reference) input.reference = stop.reference;
    if (stop.satCountryCode) input.satCountryCode = stop.satCountryCode;
    if (stop.satStateCode) input.satStateCode = stop.satStateCode;
    if (stop.satMunicipalityCode)
      input.satMunicipalityCode = stop.satMunicipalityCode;
    if (stop.satLocalityCode) input.satLocalityCode = stop.satLocalityCode;
    if (stop.satNeighborhoodCode)
      input.satNeighborhoodCode = stop.satNeighborhoodCode;
    if (stop.latitude !== undefined) input.latitude = stop.latitude;
    if (stop.longitude !== undefined) input.longitude = stop.longitude;
    if (stop.rfcRemitenteDestinatario)
      input.rfcRemitenteDestinatario = stop.rfcRemitenteDestinatario;
    if (stop.nombreRemitenteDestinatario)
      input.nombreRemitenteDestinatario = stop.nombreRemitenteDestinatario;
    if (stop.contactName) input.contactName = stop.contactName;
    if (stop.contactPhone) input.contactPhone = stop.contactPhone;

    return input;
  });
}

