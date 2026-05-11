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

function hasCountry(value: string | null | undefined): boolean {
  return (value ?? "MEX").trim().length > 0;
}

function hasState(value: string | null | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

function hasMunicipality(value: string | null | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

function hasValidPostalCode(value: string | null | undefined): boolean {
  return /^\d{5}$/.test((value ?? "").trim());
}

export function getAddressModeRequirements(mode: AddressCaptureMode): AddressModeRequirements {
  return ADDRESS_MODE_REQUIREMENTS[mode];
}

export function isAddressReadyForMode(input: AddressReadinessInput): boolean {
  const requirements = getAddressModeRequirements(input.mode);
  const hasSatBase =
    hasCountry(input.satCountryCode) &&
    hasState(input.satStateCode) &&
    hasValidPostalCode(input.postalCode);

  if (!hasSatBase) return false;
  if (requirements.requireMunicipality && !hasMunicipality(input.satMunicipalityCode)) {
    return false;
  }

  if (input.mode === "carta-porte") {
    const status = input.postalLookupStatus ?? "idle";
    return status === "success" || status === "not_found";
  }

  return true;
}

export function isCartaPorteSatMinimumMet(input: AddressReadinessInput): boolean {
  if (input.mode !== "carta-porte") return false;
  const status = input.postalLookupStatus ?? "idle";
  if (status !== "success") return false;
  return (
    hasCountry(input.satCountryCode) &&
    hasState(input.satStateCode) &&
    hasValidPostalCode(input.postalCode)
  );
}
