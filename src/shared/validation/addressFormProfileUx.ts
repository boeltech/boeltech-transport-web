import type { SharedAddressContext } from "@boeltech/cfdi-domain";
import {
  ADDRESS_FORM_PARSE_PROFILES,
  type AddressFormParseProfile,
} from "@boeltech/cfdi-domain/validadores/address-form-profiles";
import type { AddressFormUiContext } from "@shared/ui/address-input/addressFormCopy";
import type { AddressUxVariant } from "./cp31DomicilioUx";

/** Mantener alineado a `CP31_MIN_STREET_OPTIONAL_CONTEXTS` en `cfdi-domain` `validadores/address.ts`. */
const CP31_MIN_STREET_OPTIONAL_CONTEXTS: ReadonlySet<SharedAddressContext> = new Set([
  "billing",
  "shipping",
  "pickup",
  "warehouse",
  "office",
  "trip_stop",
  "company",
  "personal",
  "other",
]);

const LOCATION_NAME_OPTIONAL_CONTEXTS: ReadonlySet<SharedAddressContext> = new Set([
  "personal",
]);

const SHARED_CONTEXTS = new Set<string>(Object.keys(ADDRESS_FORM_PARSE_PROFILES));

const UI_CONTEXT_TO_SHARED: Record<AddressFormUiContext, SharedAddressContext> = {
  billingOnCreate: "billing",
  additional: "shipping",
  companyFiscal: "company",
  employeePersonal: "personal",
  tripStop: "trip_stop",
  branchOperational: "branch",
};

/**
 * Misma resolución que `toCfdiContext` / `resolveAddressFormParseProfile` (web/API).
 */
export function resolveSharedAddressContext(input: {
  formContext?: AddressFormUiContext;
  addressType?: string | null;
}): SharedAddressContext {
  const fromType = String(input.addressType ?? "").trim();
  if (fromType) {
    if (fromType === "trip_origin" || fromType === "trip_destination") {
      return "trip_stop";
    }
    if (SHARED_CONTEXTS.has(fromType)) {
      return fromType as SharedAddressContext;
    }
  }
  if (input.formContext) {
    return UI_CONTEXT_TO_SHARED[input.formContext];
  }
  return "other";
}

export interface AddressFormUxFieldRequirements {
  sharedContext: SharedAddressContext;
  parseProfile: AddressFormParseProfile;
  requireStreetFields: boolean;
  requireLocationName: boolean;
  requireCountry: boolean;
  requireState: boolean;
  requirePostalCode: boolean;
  requireCoordinates: boolean;
}

/**
 * Obligatoriedad visual (asteriscos / avisos) derivada del perfil de parseo del paquete.
 */
export function resolveAddressFormFieldRequirements(input: {
  formContext?: AddressFormUiContext;
  addressType?: string | null;
  variant?: AddressUxVariant;
}): AddressFormUxFieldRequirements {
  const variant = input.variant ?? "carta-porte";
  const sharedContext = resolveSharedAddressContext(input);
  const parseProfile = ADDRESS_FORM_PARSE_PROFILES[sharedContext];
  const cp31StreetOptional = CP31_MIN_STREET_OPTIONAL_CONTEXTS.has(sharedContext);

  const requireStreetFields =
    variant === "personal" ? false : !cp31StreetOptional;

  return {
    sharedContext,
    parseProfile,
    requireStreetFields,
    requireLocationName: !LOCATION_NAME_OPTIONAL_CONTEXTS.has(sharedContext),
    requireCountry: true,
    requireState: true,
    requirePostalCode: true,
    requireCoordinates: parseProfile.requireCoordinates,
  };
}
