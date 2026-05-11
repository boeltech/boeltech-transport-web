/**
 * Mapeo entre valores del diálogo de parada (campos SAT en inglés, addressSchema)
 * y el modelo del wizard (`TripStopFormValues` canónico en inglés).
 * Fase C — integración de `AddressInput` compartido.
 */

import type { ClientAddress } from "@features/clients/domain/entities";
import type { TripStopFormValues } from "./validation";

export type StopCategory = "origin" | "waypoint" | "destination";

export interface StopFormData extends Partial<TripStopFormValues> {
  stopCategory?: StopCategory;
  distanceSource?: TripStopFormValues["distanceSource"];
  distanceProvider?: TripStopFormValues["distanceProvider"];
  distanceConfidence?: TripStopFormValues["distanceConfidence"];
  distanceComputedAt?: TripStopFormValues["distanceComputedAt"];
  previousStopLatitude?: number;
  previousStopLongitude?: number;
  previousStopLabel?: string;
}

export type StopDialogFormValues = {
  stopCategory?: StopCategory;
  stopType: TripStopFormValues["stopType"];
  clientId: string;
  clientAddressId: string;
  addressId: string;
  locationName: string;
  /** Campos alineados a `addressSchema` (inglés) para `AddressInput`. */
  id?: string;
  addressType: "trip_stop";
  isPrimary: false;
  street: string;
  exteriorNumber: string;
  interiorNumber: string | null;
  reference: string | null;
  postalCode: string;
  satCountryCode: string;
  satStateCode: string;
  satMunicipalityCode: string;
  satLocalityCode: string | null;
  satNeighborhoodCode: string | null;
  neighborhoodName: string | null;
  latitude: number | null;
  longitude: number | null;
  cityName: string;
  rfcRemitenteDestinatario: string;
  nombreRemitenteDestinatario: string;
  deliveryRfcRemitenteDestinatario: string;
  deliveryNombreRemitenteDestinatario: string;
  remitentePartnerId: string;
  destinatarioPartnerId: string;
  contactName: string;
  contactPhone: string;
  notes: string;
  estimatedArrival?: string;
  distanceFromPreviousKm?: number;
  distanceSource?: TripStopFormValues["distanceSource"];
  distanceProvider?: TripStopFormValues["distanceProvider"];
  distanceConfidence?: TripStopFormValues["distanceConfidence"];
  distanceComputedAt?: TripStopFormValues["distanceComputedAt"];
  previousStopLatitude: number | null;
  previousStopLongitude: number | null;
  previousStopLabel: string;
};

function shortSatCode(code: string | undefined): string {
  if (!code) return "";
  return code.includes("-") ? (code.split("-").pop() ?? code) : code;
}

/** RFC / razón social Carta Porte: primero la dirección; si vienen vacíos en API, cliente titular. */
export type ClientFiscalFallback = { taxId: string; legalName: string };

export function resolveRemitenteFiscalFromClientAddress(
  address: ClientAddress | undefined,
  client?: ClientFiscalFallback | null,
): { rfcRemitenteDestinatario: string; nombreRemitenteDestinatario: string } {
  const fromAddrRfc = (address?.rfcRemitenteDestinatario ?? "").trim();
  const fromAddrName = (address?.nombreRemitenteDestinatario ?? "").trim();
  const fromClientRfc = (client?.taxId ?? "").trim();
  const fromClientName = (client?.legalName ?? "").trim();

  return {
    rfcRemitenteDestinatario: fromAddrRfc || fromClientRfc,
    nombreRemitenteDestinatario: fromAddrName || fromClientName,
  };
}

export function getEmptyStopDialogValues(): StopDialogFormValues {
  return {
    stopCategory: undefined,
    stopType: [],
    clientId: "",
    clientAddressId: "",
    addressId: "",
    locationName: "",
    addressType: "trip_stop",
    isPrimary: false,
    street: "",
    exteriorNumber: "",
    interiorNumber: null,
    reference: null,
    postalCode: "",
    satCountryCode: "MEX",
    satStateCode: "",
    satMunicipalityCode: "",
    satLocalityCode: null,
    satNeighborhoodCode: null,
    neighborhoodName: null,
    latitude: null,
    longitude: null,
    cityName: "",
    rfcRemitenteDestinatario: "",
    nombreRemitenteDestinatario: "",
    deliveryRfcRemitenteDestinatario: "",
    deliveryNombreRemitenteDestinatario: "",
    remitentePartnerId: "",
    destinatarioPartnerId: "",
    contactName: "",
    contactPhone: "",
    notes: "",
    estimatedArrival: undefined,
    distanceFromPreviousKm: undefined,
    distanceSource: undefined,
    distanceProvider: undefined,
    distanceConfidence: undefined,
    distanceComputedAt: undefined,
    previousStopLatitude: null,
    previousStopLongitude: null,
    previousStopLabel: "",
  };
}

/** Slice en inglés listo para `setValue` desde una dirección de catálogo. */
export function clientAddressToDialogSlice(
  addr: ClientAddress,
): Partial<StopDialogFormValues> {
  return {
    addressId: addr.id,
    locationName: addr.locationName || "",
    satCountryCode: addr.satCountryCode || "MEX",
    satStateCode: addr.satStateCode || "",
    satMunicipalityCode: shortSatCode(addr.satMunicipalityCode),
    postalCode: addr.postalCode || "",
    satLocalityCode: addr.satLocalityCode
      ? shortSatCode(addr.satLocalityCode)
      : null,
    satNeighborhoodCode: addr.satNeighborhoodCode
      ? shortSatCode(addr.satNeighborhoodCode)
      : null,
    neighborhoodName: addr.neighborhoodName ?? null,
    street: addr.street || "",
    exteriorNumber: addr.exteriorNumber || "",
    interiorNumber: addr.interiorNumber ?? null,
    reference: addr.reference ?? null,
    latitude: addr.latitude ?? null,
    longitude: addr.longitude ?? null,
    contactName: (addr.contactName ?? "").trim(),
    contactPhone: (addr.contactPhone ?? "").trim(),
  };
}

export function tripStopToDialogValues(stop: Partial<StopFormData>): StopDialogFormValues {
  const empty = getEmptyStopDialogValues();
  return {
    ...empty,
    stopCategory: stop.stopCategory,
    stopType: stop.stopType ?? [],
    clientId: stop.clientId ?? "",
    clientAddressId: stop.clientAddressId ?? "",
    addressId: stop.addressId ?? "",
    locationName: stop.locationName ?? "",
    street: stop.street ?? "",
    exteriorNumber: stop.exteriorNumber ?? "",
    interiorNumber: stop.interiorNumber ?? null,
    reference: stop.reference ?? null,
    postalCode: stop.postalCode ?? "",
    satCountryCode: stop.satCountryCode || "MEX",
    satStateCode: stop.satStateCode ?? "",
    satMunicipalityCode: stop.satMunicipalityCode ?? "",
    satLocalityCode: stop.satLocalityCode || null,
    satNeighborhoodCode: stop.satNeighborhoodCode || null,
    neighborhoodName: stop.neighborhoodName ?? null,
    latitude: stop.latitude ?? null,
    longitude: stop.longitude ?? null,
    cityName: stop.cityName ?? "",
    rfcRemitenteDestinatario: stop.rfcRemitenteDestinatario ?? "",
    nombreRemitenteDestinatario: stop.nombreRemitenteDestinatario ?? "",
    deliveryRfcRemitenteDestinatario:
      stop.deliveryRfcRemitenteDestinatario ?? "",
    deliveryNombreRemitenteDestinatario:
      stop.deliveryNombreRemitenteDestinatario ?? "",
    remitentePartnerId: stop.remitentePartnerId ?? "",
    destinatarioPartnerId: stop.destinatarioPartnerId ?? "",
    contactName: stop.contactName ?? "",
    contactPhone: stop.contactPhone ?? "",
    notes: stop.notes ?? "",
    estimatedArrival: stop.estimatedArrival,
    distanceFromPreviousKm: stop.distanceFromPreviousKm,
    distanceSource: stop.distanceSource,
    distanceProvider: stop.distanceProvider,
    distanceConfidence: stop.distanceConfidence,
    distanceComputedAt: stop.distanceComputedAt,
    previousStopLatitude: stop.previousStopLatitude ?? null,
    previousStopLongitude: stop.previousStopLongitude ?? null,
    previousStopLabel: stop.previousStopLabel ?? "",
  };
}

export function dialogToStopFormData(v: StopDialogFormValues): StopFormData {
  return {
    stopCategory: v.stopCategory,
    stopType: v.stopType,
    clientId: v.clientId || undefined,
    clientAddressId: v.clientAddressId || undefined,
    addressId: v.addressId || undefined,
    locationName: v.locationName || undefined,
    satCountryCode: v.satCountryCode,
    satStateCode: v.satStateCode,
    satMunicipalityCode: v.satMunicipalityCode,
    postalCode: v.postalCode,
    satLocalityCode: v.satLocalityCode ?? undefined,
    satNeighborhoodCode: v.satNeighborhoodCode ?? undefined,
    neighborhoodName: v.neighborhoodName ?? undefined,
    cityName: v.cityName || undefined,
    street: v.street || undefined,
    exteriorNumber: v.exteriorNumber || undefined,
    interiorNumber: v.interiorNumber ?? undefined,
    reference: v.reference ?? undefined,
    rfcRemitenteDestinatario: v.rfcRemitenteDestinatario || undefined,
    nombreRemitenteDestinatario: v.nombreRemitenteDestinatario || undefined,
    deliveryRfcRemitenteDestinatario:
      v.deliveryRfcRemitenteDestinatario || undefined,
    deliveryNombreRemitenteDestinatario:
      v.deliveryNombreRemitenteDestinatario || undefined,
    remitentePartnerId: v.remitentePartnerId || undefined,
    destinatarioPartnerId: v.destinatarioPartnerId || undefined,
    contactName: v.contactName || undefined,
    contactPhone: v.contactPhone || undefined,
    notes: v.notes || undefined,
    estimatedArrival: v.estimatedArrival,
    distanceFromPreviousKm: v.distanceFromPreviousKm,
    distanceSource: v.distanceSource,
    distanceProvider: v.distanceProvider,
    distanceConfidence: v.distanceConfidence,
    distanceComputedAt: v.distanceComputedAt,
    latitude: v.latitude ?? undefined,
    longitude: v.longitude ?? undefined,
    previousStopLatitude: v.previousStopLatitude ?? undefined,
    previousStopLongitude: v.previousStopLongitude ?? undefined,
    previousStopLabel: v.previousStopLabel || undefined,
  };
}

/** Igual que al renderizar: aplica catálogo de cliente + modo fiscal para validación y badges. */
export function mergeDialogWithClientCatalog(
  w: StopDialogFormValues,
  selected: ClientAddress | undefined,
  useAddressFiscalData: boolean,
  clientFiscalFallback?: ClientFiscalFallback | null,
): StopFormData {
  if (!w.clientAddressId || !selected) {
    return dialogToStopFormData(w);
  }

  const slice = clientAddressToDialogSlice(selected);
  const fiscal = resolveRemitenteFiscalFromClientAddress(selected, clientFiscalFallback);
  const merged: StopDialogFormValues = {
    ...w,
    ...slice,
    rfcRemitenteDestinatario: useAddressFiscalData
      ? fiscal.rfcRemitenteDestinatario
      : w.rfcRemitenteDestinatario,
    nombreRemitenteDestinatario: useAddressFiscalData
      ? fiscal.nombreRemitenteDestinatario
      : w.nombreRemitenteDestinatario,
    deliveryRfcRemitenteDestinatario: w.deliveryRfcRemitenteDestinatario,
    deliveryNombreRemitenteDestinatario: w.deliveryNombreRemitenteDestinatario,
    remitentePartnerId: w.remitentePartnerId,
    destinatarioPartnerId: w.destinatarioPartnerId,
    estimatedArrival: w.estimatedArrival,
    distanceFromPreviousKm: w.distanceFromPreviousKm,
    distanceSource: w.distanceSource,
    distanceProvider: w.distanceProvider,
    distanceConfidence: w.distanceConfidence,
    distanceComputedAt: w.distanceComputedAt,
    stopType: w.stopType,
    stopCategory: w.stopCategory,
    previousStopLatitude: w.previousStopLatitude,
    previousStopLongitude: w.previousStopLongitude,
    previousStopLabel: w.previousStopLabel,
    /** El catálogo puede traer lat/lng nulos; no deben pisar valores capturados o geocodificados en el formulario */
    latitude: w.latitude ?? slice.latitude ?? null,
    longitude: w.longitude ?? slice.longitude ?? null,
  };

  return dialogToStopFormData(merged);
}
