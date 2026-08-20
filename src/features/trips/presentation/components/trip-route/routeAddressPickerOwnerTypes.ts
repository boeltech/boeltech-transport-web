import { CLIENT_TRIP_ADDRESS_TYPES } from "@features/clients/presentation/config/clientAddressPurpose";
import type {
  AddressSearchListItem,
  SearchableOwnerType,
} from "@shared/ui/address-picker/types";

import type { RouteStopCategory } from "./tripRouteDetailHelpers";

/** Origen: cliente, sucursal (cross-dock) y directorio del tenant. */
export const ROUTE_ORIGIN_OWNER_TYPES = [
  "client",
  "branch",
  "tenant",
] as const satisfies readonly SearchableOwnerType[];

/** Destino, escalas y sustitución fiscal: cliente y directorio (sin sucursal). */
export const ROUTE_STOP_OWNER_TYPES = [
  "client",
  "tenant",
] as const satisfies readonly SearchableOwnerType[];

/**
 * De owner_type=client el picker de parada / corrección fiscal solo ofrece
 * shipping, pickup y warehouse (PD1 / PD10). Billing, office y other quedan
 * fuera; sucursal y directorio no se filtran por tipo.
 */
export const ROUTE_CLIENT_ADDRESS_TYPES = CLIENT_TRIP_ADDRESS_TYPES;

export function ownerTypesForRouteSlot(
  category: RouteStopCategory,
): SearchableOwnerType[] {
  if (category === "origin") {
    return [...ROUTE_ORIGIN_OWNER_TYPES];
  }
  return [...ROUTE_STOP_OWNER_TYPES];
}

export function isAllowedRoutePickerItem(item: AddressSearchListItem): boolean {
  if (item.ownerType !== "client") return true;
  return (ROUTE_CLIENT_ADDRESS_TYPES as readonly string[]).includes(
    item.addressType,
  );
}
