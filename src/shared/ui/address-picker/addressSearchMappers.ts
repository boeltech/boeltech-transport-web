import type { DeepCamelCase } from "@shared/api";
import type { AddressSearchListItem, AddressSearchPage } from "./types";

/** Raw item shape after deepToCamel from API `/addresses/search`. */
export type AddressSearchListItemRaw = DeepCamelCase<{
  id: string;
  owner_type: SearchableOwnerTypeRaw;
  owner_id: string;
  owner_label?: string | null;
  address_type: string;
  location_name: string | null;
  street: string;
  exterior_number: string;
  postal_code: string;
  sat_state_code: string;
  sat_municipality_code: string | null;
  neighborhood_name: string | null;
  sat_neighborhood_code: string | null;
  latitude: number | null;
  longitude: number | null;
  geolocation_pending: boolean;
  is_primary: boolean;
  is_active: boolean;
  is_carta_porte_ready: boolean;
  remitente_rfc?: string | null;
  remitente_name?: string | null;
  destinatario_rfc?: string | null;
  destinatario_name?: string | null;
}>;

type SearchableOwnerTypeRaw = "client" | "branch" | "tenant";

export function mapAddressSearchListItem(
  raw: AddressSearchListItemRaw,
): AddressSearchListItem {
  return {
    id: raw.id,
    ownerType: raw.ownerType,
    ownerId: raw.ownerId,
    ownerLabel: raw.ownerLabel ?? null,
    addressType: raw.addressType as AddressSearchListItem["addressType"],
    locationName: raw.locationName ?? null,
    street: raw.street,
    exteriorNumber: raw.exteriorNumber,
    postalCode: raw.postalCode,
    satStateCode: raw.satStateCode,
    satMunicipalityCode: raw.satMunicipalityCode ?? null,
    neighborhoodName: raw.neighborhoodName ?? null,
    satNeighborhoodCode: raw.satNeighborhoodCode ?? null,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    geolocationPending: raw.geolocationPending ?? false,
    isPrimary: raw.isPrimary,
    isActive: raw.isActive,
    isCartaPorteReady: raw.isCartaPorteReady,
    remitenteRfc: raw.remitenteRfc?.trim() || null,
    remitenteName: raw.remitenteName?.trim() || null,
    destinatarioRfc: raw.destinatarioRfc?.trim() || null,
    destinatarioName: raw.destinatarioName?.trim() || null,
  };
}

export function mapAddressSearchPage(
  data: AddressSearchListItemRaw[],
  pagination: AddressSearchPage["pagination"],
): AddressSearchPage {
  return {
    data: data.map(mapAddressSearchListItem),
    pagination,
  };
}
