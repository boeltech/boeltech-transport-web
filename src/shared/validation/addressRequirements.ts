import type { PostalCodeLookupResult } from "@shared/ui/address-input/use-postal-code-lookup";

export type AddressCaptureMode = "cfdi" | "carta-porte" | "personal" | "basic";

export type PostalLookupStatus =
  | "idle"
  | "loading"
  | "success"
  | "not_found"
  | "error";

export interface AddressModeRequirements {
  requireMunicipality: boolean;
  requireLocality: boolean;
  requireNeighborhood: boolean;
}

export interface AddressReadinessInput {
  mode: AddressCaptureMode;
  satCountryCode?: string | null;
  satStateCode?: string | null;
  satMunicipalityCode?: string | null;
  satLocalityCode?: string | null;
  satNeighborhoodCode?: string | null;
  postalCode?: string | null;
  postalLookupStatus?: PostalLookupStatus;
}

const ADDRESS_MODE_REQUIREMENTS: Record<AddressCaptureMode, AddressModeRequirements> = {
  "carta-porte": {
    requireMunicipality: false,
    requireLocality: false,
    requireNeighborhood: false,
  },
  cfdi: {
    requireMunicipality: true,
    requireLocality: false,
    requireNeighborhood: false,
  },
  personal: {
    requireMunicipality: true,
    requireLocality: false,
    requireNeighborhood: false,
  },
  basic: {
    requireMunicipality: true,
    requireLocality: false,
    requireNeighborhood: false,
  },
};

/**
 * Reglas condicionales por CP (alineadas a `@boeltech/cfdi-domain` / SDD CP31).
 */
export function getAddressRequirementsFromPostalLookup(
  lookup: PostalCodeLookupResult | null | undefined,
  mode: AddressCaptureMode,
): AddressModeRequirements {
  if (!lookup?.found) {
    return {
      requireMunicipality: false,
      requireLocality: false,
      requireNeighborhood: false,
    };
  }

  const isCartaPorte = mode === "carta-porte";
  return {
    requireMunicipality: Boolean(lookup.municipalityCode?.trim()),
    requireLocality: isCartaPorte && lookup.localities.length > 0,
    requireNeighborhood: isCartaPorte && lookup.neighborhoods.length > 0,
  };
}

export function resolveAddressModeRequirements(
  mode: AddressCaptureMode,
  lookup?: PostalCodeLookupResult | null,
): AddressModeRequirements {
  if (mode === "carta-porte" && lookup) {
    return getAddressRequirementsFromPostalLookup(lookup, mode);
  }
  return getAddressModeRequirements(mode);
}

function hasCountry(value: string | null | undefined): boolean {
  return (value ?? "MEX").trim().length > 0;
}

function hasState(value: string | null | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

function hasMunicipality(value: string | null | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

function hasLocality(value: string | null | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

function hasNeighborhood(value: string | null | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

function hasValidPostalCode(value: string | null | undefined): boolean {
  return /^\d{5}$/.test((value ?? "").trim());
}

export function getAddressModeRequirements(mode: AddressCaptureMode): AddressModeRequirements {
  return ADDRESS_MODE_REQUIREMENTS[mode];
}

export function isAddressReadyForMode(
  input: AddressReadinessInput,
  lookup?: PostalCodeLookupResult | null,
): boolean {
  const requirements = resolveAddressModeRequirements(input.mode, lookup);
  const hasSatBase =
    hasCountry(input.satCountryCode) &&
    hasState(input.satStateCode) &&
    hasValidPostalCode(input.postalCode);

  if (!hasSatBase) return false;
  if (requirements.requireMunicipality && !hasMunicipality(input.satMunicipalityCode)) {
    return false;
  }
  if (requirements.requireLocality && !hasLocality(input.satLocalityCode)) {
    return false;
  }
  if (requirements.requireNeighborhood && !hasNeighborhood(input.satNeighborhoodCode)) {
    return false;
  }

  if (input.mode === "carta-porte") {
    const status = input.postalLookupStatus ?? "idle";
    return status === "success" || status === "not_found";
  }

  return true;
}

export function isCartaPorteSatMinimumMet(
  input: AddressReadinessInput,
  lookup?: PostalCodeLookupResult | null,
): boolean {
  if (input.mode !== "carta-porte") return false;
  const status = input.postalLookupStatus ?? "idle";
  if (status !== "success") return false;
  return isAddressReadyForMode(input, lookup);
}
