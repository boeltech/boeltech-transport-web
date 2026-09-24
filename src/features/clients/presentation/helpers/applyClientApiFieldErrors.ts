import { snakeToCamel } from "@shared/api/utils/case-transformer";
import type { ClientFormData } from "../validation/clientSchema";
import type { ClientAddressFormData } from "../validation/clientAddressSchema";

/** Alta: incluye campos de contacto del wizard (van a primaryContact, no al DTO cliente). */
const CLIENT_CREATE_FORM_FIELD_NAMES = new Set<string>([
  "type",
  "legalName",
  "tradeName",
  "cfdiReceptorProfile",
  "taxId",
  "taxRegime",
  "contactName",
  "contactPosition",
  "phone",
  "secondaryPhone",
  "email",
  "billingEmail",
  "billingSchemeId",
  "invoiceAutoDispatchEnabled",
  "paymentTerms",
  "creditDays",
  "creditLimit",
  "notes",
]);

/** Edición: sin contactos legacy (WS-B; contactos en client_contacts). */
const CLIENT_EDIT_FORM_FIELD_NAMES = new Set<string>([
  "type",
  "legalName",
  "tradeName",
  "cfdiReceptorProfile",
  "taxId",
  "taxRegime",
  "billingEmail",
  "billingSchemeId",
  "invoiceAutoDispatchEnabled",
  "paymentTerms",
  "creditDays",
  "creditLimit",
  "notes",
]);

const CLIENT_ADDRESS_FORM_FIELD_NAMES = new Set<string>([
  "addressType",
  "isPrimary",
  "locationName",
  "street",
  "exteriorNumber",
  "interiorNumber",
  "reference",
  "postalCode",
  "satCountryCode",
  "satStateCode",
  "satMunicipalityCode",
  "satLocalityCode",
  "localityName",
  "satNeighborhoodCode",
  "neighborhoodName",
  "latitude",
  "longitude",
  "rfcRemitenteDestinatario",
  "nombreRemitenteDestinatario",
  "contactName",
  "contactPhone",
  "contactEmail",
  "businessHours",
  "notes",
  "specialInstructions",
]);

const ADDRESS_PATH_PREFIXES = [
  "billing_address",
  "billingAddress",
  "address",
  "addresses",
] as const;

export type ClientApiFieldTarget =
  | { form: "client"; field: keyof ClientFormData }
  | { form: "address"; field: keyof ClientAddressFormData };

function normalizeApiFieldSegment(apiField: string): string {
  const trimmed = apiField.trim();
  if (!trimmed || trimmed === "general") return "";

  const parts = trimmed.split(".").filter(Boolean);
  if (parts.length === 0) return "";

  const first = parts[0] ?? "";
  const isAddressPrefixed = ADDRESS_PATH_PREFIXES.some(
    (prefix) => first === prefix || first.startsWith(`${prefix}[`),
  );

  const segment = isAddressPrefixed
    ? (parts[parts.length - 1] ?? first)
    : (parts[parts.length - 1] ?? first);

  return segment.includes("_") ? snakeToCamel(segment) : segment;
}

function resolveClientApiField(
  apiField: string,
  clientFieldNames: Set<string>,
  options?: { includeAddress?: boolean },
): ClientApiFieldTarget | null {
  const camel = normalizeApiFieldSegment(apiField);
  if (!camel) return null;

  const includeAddress = options?.includeAddress ?? true;
  const trimmed = apiField.trim();
  const first = trimmed.split(".")[0] ?? "";
  const prefersAddress = ADDRESS_PATH_PREFIXES.some(
    (prefix) => first === prefix || first.startsWith(`${prefix}[`),
  );

  if (
    includeAddress &&
    prefersAddress &&
    CLIENT_ADDRESS_FORM_FIELD_NAMES.has(camel)
  ) {
    return { form: "address", field: camel as keyof ClientAddressFormData };
  }

  if (clientFieldNames.has(camel)) {
    return { form: "client", field: camel as keyof ClientFormData };
  }

  if (includeAddress && CLIENT_ADDRESS_FORM_FIELD_NAMES.has(camel)) {
    return { form: "address", field: camel as keyof ClientAddressFormData };
  }

  return null;
}

/**
 * Resuelve un path de error API (snake/camel, anidado) al formulario de alta
 * de cliente (datos fiscales vs domicilio fiscal).
 */
export function resolveClientCreateApiField(
  apiField: string,
): ClientApiFieldTarget | null {
  return resolveClientApiField(apiField, CLIENT_CREATE_FORM_FIELD_NAMES);
}

/**
 * Edición de cliente: sin mapear contactos legacy a campos del form.
 */
export function resolveClientEditApiField(
  apiField: string,
): ClientApiFieldTarget | null {
  return resolveClientApiField(apiField, CLIENT_EDIT_FORM_FIELD_NAMES, {
    includeAddress: false,
  });
}
