import type { CreateStopInput, Trip } from "@features/trips/domain";
import { localInputToUtcIso } from "@shared/utils/dateUtils";

import type { TripStopOperationalValues } from "./tripStopOperationalFields";

function normalizeText(value: string): string {
  return value.trim();
}

function normalizeRfc(value: string): string {
  return normalizeText(value).toUpperCase();
}

function parseDistance(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * El schema API exige `city` con longitud mínima 2. Algunos viajes viejos traen ciudad vacía
 * aunque tengan nombre de ubicación o dirección; derivamos un valor válido sin inventar CP.
 */
export function resolveStopCityForApi(stop: NonNullable<Trip["stops"]>[number]): string {
  const candidates = [
    stop.city,
    stop.locationName,
    stop.colonia,
    stop.street,
    stop.address,
  ];
  for (const raw of candidates) {
    const t = (raw ?? "").trim();
    if (t.length >= 2) return t;
  }
  const cp = (stop.postalCode ?? "").trim();
  if (cp.length >= 2) return `CP ${cp}`;
  return "Sin ciudad";
}

export function mapStopToCreateStopInput(
  source: NonNullable<Trip["stops"]>[number],
  edited: TripStopOperationalValues | undefined,
): CreateStopInput {
  const distanceFromPreviousKm = edited
    ? parseDistance(edited.distanceFromPreviousKm)
    : (source.distanceFromPreviousKm ?? undefined);

  return {
    sequenceOrder: source.sequenceOrder,
    stopType: source.stopType,
    addressId: source.addressId ?? undefined,
    address: source.address || "",
    city: resolveStopCityForApi(source),
    state: source.state ?? undefined,
    postalCode: source.postalCode ?? undefined,
    latitude: source.latitude ?? undefined,
    longitude: source.longitude ?? undefined,
    locationName: normalizeText(source.locationName ?? "") || undefined,
    contactName: source.contactName ?? undefined,
    contactPhone: source.contactPhone ?? undefined,
    estimatedArrival:
      edited != null
        ? edited.estimatedArrival.trim()
          ? localInputToUtcIso(edited.estimatedArrival)
          : undefined
        : source.estimatedArrival
          ? source.estimatedArrival.toISOString()
          : undefined,
    estimatedDeparture:
      edited != null
        ? edited.estimatedDeparture.trim()
          ? localInputToUtcIso(edited.estimatedDeparture)
          : undefined
        : source.estimatedDeparture
          ? source.estimatedDeparture.toISOString()
          : undefined,
    notes: source.notes ?? undefined,
    idUbicacion: source.idUbicacion ?? undefined,
    street: source.street ?? undefined,
    exteriorNumber: source.exteriorNumber ?? undefined,
    interiorNumber: source.interiorNumber ?? undefined,
    colonia: source.colonia ?? undefined,
    reference: source.reference ?? undefined,
    satCountryCode: source.satCountryCode ?? undefined,
    satStateCode: source.satEstadoCode ?? undefined,
    satMunicipalityCode: source.satMunicipioCode ?? undefined,
    satLocalityCode: source.satLocalidadCode ?? undefined,
    satNeighborhoodCode: source.satColoniaCode ?? undefined,
    rfcRemitenteDestinatario:
      normalizeRfc(edited?.rfcRemitenteDestinatario ?? source.rfcRemitenteDestinatario ?? "") ||
      undefined,
    nombreRemitenteDestinatario:
      normalizeText(
        edited?.nombreRemitenteDestinatario ?? source.nombreRemitenteDestinatario ?? "",
      ) || undefined,
    deliveryRfcRemitenteDestinatario:
      normalizeRfc(
        edited?.deliveryRfcRemitenteDestinatario ??
          source.deliveryRfcRemitenteDestinatario ??
          "",
      ) || undefined,
    deliveryNombreRemitenteDestinatario:
      normalizeText(
        edited?.deliveryNombreRemitenteDestinatario ??
          source.deliveryNombreRemitenteDestinatario ??
          "",
      ) || undefined,
    remitentePartnerId: source.remitentePartnerId ?? undefined,
    destinatarioPartnerId: source.destinatarioPartnerId ?? undefined,
    distanceFromPreviousKm:
      source.sequenceOrder === 0
        ? undefined
        : distanceFromPreviousKm != null && distanceFromPreviousKm > 0
          ? distanceFromPreviousKm
          : undefined,
    distanceSource: source.distanceSource ?? undefined,
    distanceProvider: source.distanceProvider ?? undefined,
    distanceConfidence: source.distanceConfidence ?? undefined,
    distanceComputedAt: source.distanceComputedAt?.toISOString() ?? undefined,
    clientId: source.clientId ?? undefined,
    clientAddressId: source.clientAddressId ?? undefined,
  };
}
