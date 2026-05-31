import type { PostalCodeLookupResult } from "@shared/ui/address-input/use-postal-code-lookup";
import {
  getCp31DomicilioUxRequirements,
  type AddressUxVariant,
} from "./cp31DomicilioUx";

export type {
  AddressUxVariant,
  Cp31DomicilioUxRequirements,
} from "./cp31DomicilioUx";
export { getCp31DomicilioUxRequirements } from "./cp31DomicilioUx";

export type PostalLookupStatus =
  | "idle"
  | "loading"
  | "success"
  | "not_found"
  | "error";

export interface Cp31DomicilioReadinessInput {
  variant: AddressUxVariant;
  satCountryCode?: string | null;
  satStateCode?: string | null;
  satMunicipalityCode?: string | null;
  satLocalityCode?: string | null;
  satNeighborhoodCode?: string | null;
  postalCode?: string | null;
  postalLookupStatus?: PostalLookupStatus;
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

export function isCp31DomicilioReady(
  input: Cp31DomicilioReadinessInput,
): boolean {
  const requirements = getCp31DomicilioUxRequirements(input.variant);
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

  if (input.variant === "carta-porte") {
    const status = input.postalLookupStatus ?? "idle";
    return status === "success" || status === "not_found";
  }

  return true;
}

export function isCartaPorteSatMinimumMet(
  input: Cp31DomicilioReadinessInput,
  _lookup?: PostalCodeLookupResult | null,
): boolean {
  void _lookup;
  if (input.variant !== "carta-porte") return false;
  const status = input.postalLookupStatus ?? "idle";
  if (status !== "success") return false;
  return isCp31DomicilioReady(input);
}
