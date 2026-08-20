/**
 * Comparación y persistencia opcional de dirección de cliente desde el sheet de paradas.
 */

import type { ClientAddress } from "@features/clients/domain/entities";
import type { UpdateClientAddressDTO } from "@features/clients/domain";
import { isClientTripAddressType } from "@features/clients/presentation/config/clientAddressPurpose";
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

/** Alinea códigos SAT al comparar (picker y catálogo pueden usar formato corto o con prefijo). */
function normSatCode(value: string | null | undefined): string {
  const normalized = normText(value);
  if (!normalized) return "";
  const parts = normalized.split("-").filter(Boolean);
  return (parts[parts.length - 1] ?? normalized).trim();
}

/**
 * Tras precarga ADR-0053 el formulario puede traer null en campos que el search
 * no expone; eso no cuenta como edición del usuario.
 */
function nullableCatalogOnlyFieldDiffers(
  formValue: string | null | undefined,
  catalogValue: string | null | undefined,
): boolean {
  const formNorm = normNullableText(formValue);
  const catalogNorm = normNullableText(catalogValue);
  if (formNorm == null && catalogNorm != null) return false;
  return formNorm !== catalogNorm;
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
 * True si el usuario editó el domicilio respecto al catálogo del cliente
 * (campos de domicilio / geo / contacto en sitio).
 *
 * Ignora huecos del snapshot del AddressPicker (localidad, interior, etc.)
 * cuando el formulario los dejó vacíos sin intervención del usuario.
 */
export function stopDialogDiffersFromClientCatalog(
  form: StopDialogFormValues,
  catalog: ClientAddress,
): boolean {
  const checks: boolean[] = [
    normText(form.locationName) !== normText(catalog.locationName),
    normText(form.street) !== normText(catalog.street),
    normText(form.exteriorNumber) !== normText(catalog.exteriorNumber),
    nullableCatalogOnlyFieldDiffers(form.interiorNumber, catalog.interiorNumber),
    nullableCatalogOnlyFieldDiffers(form.reference, catalog.reference),
    normText(form.postalCode) !== normText(catalog.postalCode),
    normText(form.satCountryCode || "MEX") !== normText(catalog.satCountryCode || "MEX"),
    normText(form.satStateCode) !== normText(catalog.satStateCode),
    normSatCode(form.satMunicipalityCode) !== normSatCode(catalog.satMunicipalityCode),
    nullableCatalogOnlyFieldDiffers(form.satLocalityCode, catalog.satLocalityCode),
    nullableCatalogOnlyFieldDiffers(form.localityName, catalog.localityName),
    normSatCode(form.satNeighborhoodCode) !==
      normSatCode(catalog.satNeighborhoodCode ?? null),
    nullableCatalogOnlyFieldDiffers(form.neighborhoodName, catalog.neighborhoodName),
    nullableCatalogOnlyFieldDiffers(form.contactName, catalog.contactName),
    nullableCatalogOnlyFieldDiffers(form.contactPhone, catalog.contactPhone),
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

/**
 * Write-back al maestro solo desde Completar domicilio, fuente operativa
 * (shipping / pickup / warehouse) y rol con clients.update (PD7).
 */
export function canOfferClientAddressWriteBack(
  catalog: ClientAddress | undefined,
  canUpdateClient: boolean,
): boolean {
  if (!canUpdateClient || catalog == null) return false;
  return isClientTripAddressType(catalog.addressType);
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
