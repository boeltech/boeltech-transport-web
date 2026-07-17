import type { BranchAddress } from "@features/branches";
import type { TripStopFormValues } from "../pages/create/components/validation";

/**
 * @deprecated Usar AddressPicker con owner_type=branch (ADR-0053 / ADR-0065).
 * Mapea la dirección operativa de una sucursal al slice de formulario de parada origen.
 */
export function mapBranchAddressToOriginStopSlice(
  address: BranchAddress,
  branchName: string,
): Partial<TripStopFormValues> {
  return {
    stopType: ["origin", "pickup"],
    locationName: address.locationName?.trim() || branchName,
    addressId: "",
    sourceAddressId: address.addressId ?? "",
    satCountryCode: address.satCountryCode?.trim() || "MEX",
    satStateCode: address.satStateCode?.trim() || "",
    satMunicipalityCode: address.satMunicipalityCode?.trim() || "",
    postalCode: address.postalCode?.trim() || "",
    satLocalityCode: address.satLocalityCode?.trim() || "",
    localityName: address.localityName?.trim() || "",
    cityName: address.city?.trim() || "",
    neighborhoodName: address.neighborhood?.trim() || "",
    satNeighborhoodCode: address.satNeighborhoodCode?.trim() || "",
    street: address.street?.trim() || "",
    exteriorNumber: address.exteriorNumber?.trim() || "",
    interiorNumber: address.interiorNumber?.trim() || "",
    latitude: address.latitude ?? undefined,
    longitude: address.longitude ?? undefined,
  };
}
