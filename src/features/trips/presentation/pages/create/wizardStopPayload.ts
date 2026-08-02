/**
 * Construcción de payloads de parada desde el wizard.
 * Tras la migración API 045, `trips` ya no persiste `origin_address` / `destination_address`;
 * el domicilio vive en `trip_stops` y, si aplica, en `addresses` vía snapshot inline (ADR-0055).
 */

import type { CreateStopInput } from "@features/trips/domain";
import { isUnifiedAddressId } from "@features/trips/domain";
import { localInputToUtcIso } from "@shared/utils/dateUtils";

import type { TripStopFormValues } from "./components/validation";

/** Fila de parada del wizard. */
export type WizardStopRow = TripStopFormValues;

function stopHasCatalogSnapshot(stop: WizardStopRow): boolean {
  return (
    isUnifiedAddressId(stop.clientAddressId) ||
    isUnifiedAddressId(stop.sourceAddressId)
  );
}

/**
 * Deriva resumen operativo de extremo y texto de parada para el contrato actual:
 * `originCity` / `destinationCity` en el viaje y `address` / `city` / `state` en cada stop.
 *
 * Solo `sourceAddressId` / `clientAddressId` cuentan como vínculo a catálogo.
 * Un `addressId` de snapshot propio de parada no debe forzar la rama de catálogo.
 */
export function buildTripEndpointSummary(stop: WizardStopRow): {
  address: string;
  city: string;
  state: string;
} {
  if (stopHasCatalogSnapshot(stop)) {
    const label = stop.locationName?.trim() || "Domicilio en catálogo";
    return {
      address: label,
      city:
        stop.cityName?.trim() ||
        stop.locationName?.trim() ||
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
    city:
      stop.cityName?.trim() ||
      stop.locationName?.trim() ||
      stop.satMunicipalityCode ||
      "",
    state: stop.satStateCode || "",
  };
}

/** Paradas del wizard → payload de API (camelCase; `apiClient` → snake_case). */
export function mapWizardStopsToCreateInput(
  stops: WizardStopRow[] | undefined,
): CreateStopInput[] | undefined {
  if (!stops?.length) return undefined;
  return stops.map((stop) => {
    const endpointSummary = buildTripEndpointSummary(stop);
    const catalogSourceId =
      stop.sourceAddressId?.trim() ||
      stop.clientAddressId?.trim() ||
      undefined;

    return {
      sequenceOrder: stop.sequenceOrder,
      stopType: stop.stopType,
      address: endpointSummary.address,
      city: endpointSummary.city,
      state: endpointSummary.state || undefined,
      locationName: stop.locationName,
      postalCode: stop.postalCode,
      satCountryCode: stop.satCountryCode || undefined,
      satStateCode: stop.satStateCode,
      satMunicipalityCode: stop.satMunicipalityCode,
      satLocalityCode: stop.satLocalityCode || undefined,
      locality_name: stop.localityName || undefined,
      satNeighborhoodCode: stop.satNeighborhoodCode || undefined,
      colonia: stop.neighborhoodName || undefined,
      street: stop.street || undefined,
      exteriorNumber: stop.exteriorNumber || undefined,
      interiorNumber: stop.interiorNumber || undefined,
      reference: stop.reference || undefined,
      rfcRemitenteDestinatario: stop.rfcRemitenteDestinatario || undefined,
      nombreRemitenteDestinatario: stop.nombreRemitenteDestinatario || undefined,
      destinatarioRfc:
        stop.destinatarioRfc?.trim() ||
        stop.deliveryRfcRemitenteDestinatario?.trim() ||
        undefined,
      destinatarioNombre:
        stop.destinatarioNombre?.trim() ||
        stop.deliveryNombreRemitenteDestinatario?.trim() ||
        undefined,
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
      sourceAddressId: catalogSourceId,
    };
  });
}
