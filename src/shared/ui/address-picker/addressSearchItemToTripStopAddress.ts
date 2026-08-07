import type { CreateTripStopAddressInput } from "@boeltech/cfdi-domain/validadores/address";

import { toAddressSnapshot } from "./addressSnapshot";
import type { AddressSearchListItem } from "./types";

/**
 * Snapshot de búsqueda agregada → payload `stop_address` (snake_case, ADR-0053).
 * Validación al persistir: `createTripStopAddressSchema` del paquete.
 */
export function addressSearchItemToTripStopAddress(
  source: AddressSearchListItem,
): CreateTripStopAddressInput {
  const snapshot = toAddressSnapshot(source);

  return {
    address_type: "trip_stop",
    sat_country_code: snapshot.satCountryCode,
    sat_state_code: snapshot.satStateCode,
    sat_municipality_code: snapshot.satMunicipalityCode,
    sat_locality_code: snapshot.satLocalityCode,
    locality_name: snapshot.localityName,
    sat_neighborhood_code: snapshot.satNeighborhoodCode,
    neighborhood_name: snapshot.neighborhoodName,
    postal_code: snapshot.postalCode,
    street: snapshot.street,
    exterior_number: snapshot.exteriorNumber,
    interior_number: snapshot.interiorNumber,
    reference: snapshot.reference,
    location_name: snapshot.locationName || null,
    notes: null,
    latitude: snapshot.latitude,
    longitude: snapshot.longitude,
    geolocation_pending: snapshot.geolocationPending,
    is_primary: false,
    rfc_remitente_destinatario: source.remitenteRfc || null,
    nombre_remitente_destinatario: source.remitenteName || null,
    destinatario_rfc: source.destinatarioRfc || null,
    destinatario_name: source.destinatarioName || null,
    contact_name: null,
    contact_phone: null,
    contact_email: null,
    business_hours: null,
    special_instructions: null,
  };
}
