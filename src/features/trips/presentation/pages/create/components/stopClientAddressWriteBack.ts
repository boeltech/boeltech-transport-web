/**
 * Comparación y persistencia opcional de dirección de cliente desde el sheet de paradas.
 */

import type { ClientAddress } from "@features/clients/domain/entities";
import type { UpdateClientAddressDTO } from "@features/clients/domain";
import {
  CLIENT_ADDRESS_TYPES,
  type ClientAddressFormData,
  type ClientAddressFormContext,
} from "@features/clients/presentation/validation/clientAddressSchema";

import type { StopDialogFormValues } from "./stopDialogAddressMapper";

function normText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function normNullableText(value: string | null | undefined): string | null {
  const t = normText(value);
  return t === "" ? null : t;
}

function coordsEqual(
  a: number | null | undefined,
  b: number | null | undefined,
): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) < 1e-6;
}

function resolveClientAddressFormContext(
  addressType: ClientAddress["addressType"],
): ClientAddressFormContext {
  return addressType === "billing" ? "billingOnCreate" : "additional";
}

function resolveClientAddressTypeForForm(
  addressType: ClientAddress["addressType"],
): ClientAddressFormData["addressType"] {
  if (
    (CLIENT_ADDRESS_TYPES as readonly string[]).includes(addressType)
  ) {
    return addressType as ClientAddressFormData["addressType"];
  }
  return "shipping";
}

/**
 * True si el formulario del sheet difiere del registro de catálogo del cliente
 * (campos de domicilio / geo / contacto en sitio).
 */
export function stopDialogDiffersFromClientCatalog(
  form: StopDialogFormValues,
  catalog: ClientAddress,
): boolean {
  const checks: boolean[] = [
    normText(form.locationName) !== normText(catalog.locationName),
    normText(form.street) !== normText(catalog.street),
    normText(form.exteriorNumber) !== normText(catalog.exteriorNumber),
    normNullableText(form.interiorNumber) !==
      normNullableText(catalog.interiorNumber ?? null),
    normNullableText(form.reference) !== normNullableText(catalog.reference ?? null),
    normText(form.postalCode) !== normText(catalog.postalCode),
    normText(form.satCountryCode || "MEX") !== normText(catalog.satCountryCode || "MEX"),
    normText(form.satStateCode) !== normText(catalog.satStateCode),
    normText(form.satMunicipalityCode) !== normText(catalog.satMunicipalityCode),
    normNullableText(form.satLocalityCode) !==
      normNullableText(catalog.satLocalityCode ?? null),
    normNullableText(form.localityName) !== normNullableText(catalog.localityName ?? null),
    normNullableText(form.satNeighborhoodCode) !==
      normNullableText(catalog.satNeighborhoodCode ?? null),
    normNullableText(form.neighborhoodName) !==
      normNullableText(catalog.neighborhoodName ?? null),
    normText(form.contactName) !== normText(catalog.contactName),
    normText(form.contactPhone) !== normText(catalog.contactPhone),
    !coordsEqual(form.latitude, catalog.latitude),
    !coordsEqual(form.longitude, catalog.longitude),
  ];

  return checks.some(Boolean);
}

export function stopDialogToClientAddressFormData(
  form: StopDialogFormValues,
  catalog: ClientAddress,
): ClientAddressFormData {
  return {
    id: catalog.id,
    addressType: resolveClientAddressTypeForForm(catalog.addressType),
    isPrimary: catalog.isPrimary,
    locationName: form.locationName,
    street: form.street,
    exteriorNumber: form.exteriorNumber,
    interiorNumber: form.interiorNumber,
    reference: form.reference,
    postalCode: form.postalCode,
    satCountryCode: form.satCountryCode || "MEX",
    satStateCode: form.satStateCode,
    satMunicipalityCode: form.satMunicipalityCode,
    satLocalityCode: form.satLocalityCode,
    localityName: form.localityName,
    satNeighborhoodCode: form.satNeighborhoodCode,
    neighborhoodName: form.neighborhoodName,
    latitude: form.latitude,
    longitude: form.longitude,
    rfcRemitenteDestinatario: form.rfcRemitenteDestinatario,
    nombreRemitenteDestinatario: form.nombreRemitenteDestinatario,
    contactName: form.contactName,
    contactPhone: form.contactPhone,
    contactEmail: catalog.contactEmail ?? "",
    businessHours: catalog.businessHours ?? "",
    notes: catalog.notes ?? "",
    specialInstructions: catalog.specialInstructions ?? "",
  };
}

export function stopDialogToClientAddressUpdateDto(
  form: StopDialogFormValues,
  catalog: ClientAddress,
): UpdateClientAddressDTO {
  const data = stopDialogToClientAddressFormData(form, catalog);
  const hasCoordinates = data.latitude != null && data.longitude != null;
  return {
    addressType: data.addressType,
    isPrimary: data.isPrimary,
    locationName: data.locationName,
    street: data.street,
    exteriorNumber: data.exteriorNumber,
    interiorNumber: data.interiorNumber ?? undefined,
    reference: data.reference ?? undefined,
    postalCode: data.postalCode,
    satCountryCode: data.satCountryCode,
    satStateCode: data.satStateCode,
    satMunicipalityCode: data.satMunicipalityCode,
    satLocalityCode: data.satLocalityCode ?? undefined,
    localityName: data.localityName ?? undefined,
    satNeighborhoodCode: data.satNeighborhoodCode ?? undefined,
    neighborhoodName: data.neighborhoodName ?? undefined,
    rfcRemitenteDestinatario: data.rfcRemitenteDestinatario || undefined,
    nombreRemitenteDestinatario: data.nombreRemitenteDestinatario || undefined,
    latitude: hasCoordinates ? data.latitude : null,
    longitude: hasCoordinates ? data.longitude : null,
    geolocationPending: !hasCoordinates,
    geocodingSource: hasCoordinates ? "manual" : null,
    contactName: data.contactName || undefined,
    contactPhone: data.contactPhone || undefined,
    contactEmail: data.contactEmail || undefined,
    businessHours: data.businessHours || undefined,
    notes: data.notes || undefined,
    specialInstructions: data.specialInstructions || undefined,
  };
}

export function resolveClientAddressFormContextForCatalog(
  catalog: ClientAddress,
): ClientAddressFormContext {
  return resolveClientAddressFormContext(catalog.addressType);
}

/** Quita vínculo al catálogo: la parada viaja con domicilio inline en el wizard. */
export function detachStopFromClientCatalog<T extends { addressId?: string; clientAddressId?: string }>(
  stop: T,
): T {
  return {
    ...stop,
    addressId: undefined,
    clientAddressId: undefined,
  };
}
