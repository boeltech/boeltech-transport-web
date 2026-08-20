import type { AddressType } from "../../domain";

/** Domicilio fiscal del receptor CFDI. No es Ubicación de parada. */
export const CLIENT_FISCAL_ADDRESS_TYPES = ["billing"] as const;

/** Lugares reutilizables en el picker de paradas (PD1 / PD10). */
export const CLIENT_TRIP_ADDRESS_TYPES = [
  "shipping",
  "pickup",
  "warehouse",
] as const;

/** Capturables en el tab; fuera del picker de viajes. */
export const CLIENT_DIRECTORY_ONLY_ADDRESS_TYPES = ["office", "other"] as const;

export type ClientFiscalAddressType =
  (typeof CLIENT_FISCAL_ADDRESS_TYPES)[number];
export type ClientTripAddressType = (typeof CLIENT_TRIP_ADDRESS_TYPES)[number];
export type ClientDirectoryOnlyAddressType =
  (typeof CLIENT_DIRECTORY_ONLY_ADDRESS_TYPES)[number];

export function isClientFiscalAddressType(
  type: string | null | undefined,
): type is ClientFiscalAddressType {
  return type === "billing";
}

export function isClientTripAddressType(
  type: string | null | undefined,
): type is ClientTripAddressType {
  return (CLIENT_TRIP_ADDRESS_TYPES as readonly string[]).includes(
    type ?? "",
  );
}

export function isClientDirectoryOnlyAddressType(
  type: string | null | undefined,
): type is ClientDirectoryOnlyAddressType {
  return (CLIENT_DIRECTORY_ONLY_ADDRESS_TYPES as readonly string[]).includes(
    type ?? "",
  );
}

/**
 * RFC remitente/destinatario y geo de Ubicación CP: solo tipos operativos.
 * Billing = receptor CFDI; office/other = directorio, no parada.
 */
export function showsClientUbicacionFields(
  type: string | null | undefined,
): boolean {
  return isClientTripAddressType(type);
}

export function groupClientAddressesByPurpose<T extends { addressType: AddressType }>(
  addresses: readonly T[],
): {
  fiscal: T[];
  forTrips: T[];
  other: T[];
} {
  const fiscal: T[] = [];
  const forTrips: T[] = [];
  const other: T[] = [];
  for (const address of addresses) {
    if (isClientFiscalAddressType(address.addressType)) {
      fiscal.push(address);
    } else if (isClientTripAddressType(address.addressType)) {
      forTrips.push(address);
    } else {
      other.push(address);
    }
  }
  return { fiscal, forTrips, other };
}

export function clientAddressAlertFlags(
  addresses: readonly { addressType: AddressType; postalCode?: string | null }[],
): {
  missingBillingCp: boolean;
  noTripPlaces: boolean;
} {
  const hasBillingCp = addresses.some(
    (address) =>
      isClientFiscalAddressType(address.addressType) &&
      Boolean(address.postalCode?.trim()),
  );
  const hasTripPlace = addresses.some((address) =>
    isClientTripAddressType(address.addressType),
  );
  return {
    missingBillingCp: !hasBillingCp,
    noTripPlaces: !hasTripPlace,
  };
}
