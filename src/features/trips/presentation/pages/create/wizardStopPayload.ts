/**
 * Construcción de payloads de parada desde el wizard (Fase 4).
 * Extraído de TripFormPage para pruebas y un solo lugar de verdad.
 */

import type { CreateStopInput } from "@features/trips/domain";
import { isUnifiedAddressId } from "@features/trips/domain";
import { localInputToUtcIso } from "@shared/utils/dateUtils";

import type { TripStopFormValues } from "./components/validation";
import { stopHasUnifiedAddressId } from "./components/validation";

/** Fila de parada del wizard. */
export type WizardStopRow = TripStopFormValues;

/**
 * Dirección legible para campos legacy del viaje (`originAddress`, `destinationAddress`)
 * y para `CreateStopInput.address` / `city` cuando el API aún los exige junto a SAT.
 */
export function buildLegacyAddress(stop: WizardStopRow): {
  address: string;
  city: string;
  state: string;
} {
  if (isUnifiedAddressId(stop.addressId)) {
    const label = stop.locationName?.trim() || "Domicilio en catálogo";
    return {
      address: label,
      city:
        stop.cityName?.trim() ||
        stop.satMunicipalityCode?.trim() ||
        stop.satStateCode?.trim() ||
        label,
      state: stop.satStateCode?.trim() || "",
    };
  }

  const addressParts: string[] = [];

  if (stop.street) {
    let streetLine = stop.street;
    if (stop.exteriorNumber) {
      streetLine += ` #${stop.exteriorNumber}`;
    }
    if (stop.interiorNumber) {
      streetLine += `, Int. ${stop.interiorNumber}`;
    }
    addressParts.push(streetLine);
  }

  if (stop.postalCode) {
    addressParts.push(`C.P. ${stop.postalCode}`);
  }

  return {
    address:
      addressParts.join(", ") ||
      `Ubicación ${stop.satStateCode}-${stop.satMunicipalityCode}`,
    city: stop.cityName || stop.satMunicipalityCode || "",
    state: stop.satStateCode || "",
  };
}

/** Paradas del wizard → payload de API (camelCase; `apiClient` → snake_case). */
export function mapWizardStopsToCreateInput(
  stops: WizardStopRow[] | undefined,
): CreateStopInput[] | undefined {
  if (!stops?.length) return undefined;
  return stops.map((stop) => {
    const legacyAddr = buildLegacyAddress(stop);
    return {
      sequenceOrder: stop.sequenceOrder,
      stopType: stop.stopType,
      address: legacyAddr.address,
      city: legacyAddr.city,
      state: legacyAddr.state || undefined,
      locationName: stop.locationName,
      postalCode: stop.postalCode,
      satCountryCode: stop.satCountryCode || undefined,
      satStateCode: stop.satStateCode,
      satMunicipalityCode: stop.satMunicipalityCode,
      satLocalityCode: stop.satLocalityCode || undefined,
      satNeighborhoodCode: stop.satNeighborhoodCode || undefined,
      colonia: stop.neighborhoodName || undefined,
      street: stop.street || undefined,
      exteriorNumber: stop.exteriorNumber || undefined,
      interiorNumber: stop.interiorNumber || undefined,
      reference: stop.reference || undefined,
      rfcRemitenteDestinatario: stop.rfcRemitenteDestinatario || undefined,
      nombreRemitenteDestinatario: stop.nombreRemitenteDestinatario || undefined,
      deliveryRfcRemitenteDestinatario:
        stop.deliveryRfcRemitenteDestinatario || undefined,
      deliveryNombreRemitenteDestinatario:
        stop.deliveryNombreRemitenteDestinatario || undefined,
      remitentePartnerId: stop.remitentePartnerId || undefined,
      destinatarioPartnerId: stop.destinatarioPartnerId || undefined,
      distanceFromPreviousKm: stop.distanceFromPreviousKm,
      distanceSource: stop.distanceSource || undefined,
      distanceProvider: stop.distanceProvider || undefined,
      distanceConfidence: stop.distanceConfidence || undefined,
      distanceComputedAt: stop.distanceComputedAt || undefined,
      contactName: stop.contactName || undefined,
      contactPhone: stop.contactPhone || undefined,
      notes: stop.notes || undefined,
      latitude: stop.latitude,
      longitude: stop.longitude,
      estimatedArrival: stop.estimatedArrival
        ? localInputToUtcIso(stop.estimatedArrival)
        : undefined,
      clientId: stop.clientId || undefined,
      clientAddressId: stop.clientAddressId || undefined,
      addressId: stopHasUnifiedAddressId(stop) ? stop.addressId : undefined,
    };
  });
}
