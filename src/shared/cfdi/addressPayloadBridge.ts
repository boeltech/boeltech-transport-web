/**
 * Puente camelCase (formularios RHF) ↔ validación @boeltech/cfdi-domain.
 */
import type { SharedAddressContext, ValidationError } from "@boeltech/cfdi-domain";
import {
  parseAddressFormValues,
  parseCreateAddressBody,
  parseUpdateAddressBody,
  validateInlineStopAddressSat,
  validationErrorsToRecord,
} from "@boeltech/cfdi-domain/validadores/address-payload-result";
import { createCatalogProviderRest } from "./catalogProviderRest";

export { validationErrorsToRecord };

const FORM_FIELD_BY_SAT_PATH: Record<string, string> = {
  address_type: "addressType",
  sat_country_code: "satCountryCode",
  sat_state_code: "satStateCode",
  sat_municipality_code: "satMunicipalityCode",
  sat_locality_code: "satLocalityCode",
  sat_neighborhood_code: "satNeighborhoodCode",
  postal_code: "postalCode",
  street: "street",
  exterior_number: "exteriorNumber",
  interior_number: "interiorNumber",
  reference: "reference",
  latitude: "latitude",
  longitude: "longitude",
  geolocation_pending: "geolocationPending",
};

export interface ParseClientAddressFormOptions {
  context?: SharedAddressContext;
  mode?: "cfdi" | "carta_porte_31";
  requireCoordinates?: boolean;
}

export function clientAddressFormToSnakePayload(
  form: Record<string, unknown>,
): Record<string, unknown> {
  return parseAddressFormValues(form);
}

export function mapValidationErrorsToRHF(
  errors: ValidationError[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const error of errors) {
    const path = error.path ?? "";
    const formKey = FORM_FIELD_BY_SAT_PATH[path] ?? path;
    if (!formKey || out[formKey]) continue;
    out[formKey] = error.message;
  }
  return out;
}

function toCfdiContext(addressType: string): SharedAddressContext {
  if (addressType === "trip_origin" || addressType === "trip_destination") {
    return "trip_stop";
  }
  const allowed: SharedAddressContext[] = [
    "billing",
    "shipping",
    "pickup",
    "warehouse",
    "office",
    "trip_stop",
    "branch",
    "company",
    "personal",
    "other",
  ];
  return allowed.includes(addressType as SharedAddressContext)
    ? (addressType as SharedAddressContext)
    : "other";
}

export async function parseClientAddressFormCreate(
  form: Record<string, unknown>,
  options: ParseClientAddressFormOptions = {},
): Promise<
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; errors: ValidationError[]; fieldErrors: Record<string, string> }
> {
  const snake = clientAddressFormToSnakePayload(form);
  const addressType = String(snake.address_type ?? form.addressType ?? "billing");
  const context = options.context ?? toCfdiContext(addressType);
  const provider = createCatalogProviderRest();

  const result = await parseCreateAddressBody(snake, {
    mode: options.mode ?? "carta_porte_31",
    provider,
    context,
    requireCoordinates: options.requireCoordinates ?? false,
  });

  if (!result.ok) {
    return {
      ok: false,
      errors: result.error,
      fieldErrors: mapValidationErrorsToRHF(result.error),
    };
  }

  return { ok: true, value: result.value as Record<string, unknown> };
}

export async function parseClientAddressFormUpdate(
  patch: Record<string, unknown>,
  options: ParseClientAddressFormOptions = {},
): Promise<
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; errors: ValidationError[]; fieldErrors: Record<string, string> }
> {
  const snake = clientAddressFormToSnakePayload(patch);
  const addressType = String(patch.addressType ?? snake.address_type ?? "billing");
  const context = options.context ?? toCfdiContext(addressType);
  const provider = createCatalogProviderRest();

  const result = await parseUpdateAddressBody(snake, {
    mode: options.mode ?? "carta_porte_31",
    provider,
    context,
    requireCoordinates: options.requireCoordinates ?? false,
  });

  if (!result.ok) {
    return {
      ok: false,
      errors: result.error,
      fieldErrors: mapValidationErrorsToRHF(result.error),
    };
  }

  return { ok: true, value: result.value as Record<string, unknown> };
}

/** Parada inline del wizard (sin `addressId`). */
export async function validateTripStopInlineAddress(
  stop: Record<string, unknown>,
  options: { requireCoordinates?: boolean } = {},
): Promise<
  | { ok: true }
  | { ok: false; errors: ValidationError[]; fieldErrors: Record<string, string> }
> {
  const provider = createCatalogProviderRest();
  const payload = clientAddressFormToSnakePayload({
    ...stop,
    sat_country_code: stop.satCountryCode ?? stop.sat_country_code ?? "MEX",
  });

  const result = await validateInlineStopAddressSat(payload, {
    mode: "carta_porte_31",
    provider,
    requireCoordinates: options.requireCoordinates ?? true,
  });

  if (!result.ok) {
    return {
      ok: false,
      errors: result.error,
      fieldErrors: mapValidationErrorsToRHF(result.error),
    };
  }

  return { ok: true };
}
