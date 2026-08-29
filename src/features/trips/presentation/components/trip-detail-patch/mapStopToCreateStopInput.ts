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

/**
 * El schema API (`createStopSchema`) exige `address` con longitud mínima 5 cuando no hay `address_id`.
 * Al reemplazar paradas preexistentes (ej. esqueletos de canvas o paradas incompletas),
 * derivamos un texto válido (>= 5 caracteres) a partir de los datos disponibles.
 */
export function resolveStopAddressForApi(stop: NonNullable<Trip["stops"]>[number]): string {
  const currentAddress = (stop.address ?? "").trim();
  if (currentAddress.length >= 5) {
    return currentAddress;
  }

  // 1. Intentar armar dirección estructurada si hay calle/número/colonia/CP
  const parts: string[] = [];
  if (stop.street?.trim()) {
    let streetLine = stop.street.trim();
    if (stop.exteriorNumber?.trim()) {
      streetLine += ` #${stop.exteriorNumber.trim()}`;
    }
    if (stop.interiorNumber?.trim()) {
      streetLine += `, Int. ${stop.interiorNumber.trim()}`;
    }
    parts.push(streetLine);
  }
  if (stop.colonia?.trim()) {
    parts.push(stop.colonia.trim());
  }
  if (stop.postalCode?.trim()) {
    parts.push(`C.P. ${stop.postalCode.trim()}`);
  }
  const structured = parts.join(", ").trim();
  if (structured.length >= 5) {
    return structured;
  }

  // 2. Si locationName tiene >= 5 caracteres (ej: "MUNDO DULCE")
  const locationName = (stop.locationName ?? "").trim();
  if (locationName.length >= 5) {
    return locationName;
  }

  // 3. Si locationName + city juntos suman >= 5 caracteres (ej: "GDL, Guadalajara")
  const city = (stop.city ?? "").trim();
  if (locationName && city && `${locationName}, ${city}`.length >= 5) {
    return `${locationName}, ${city}`;
  }

  // 4. Si city tiene >= 5 caracteres
  if (city.length >= 5) {
    return city;
  }

  // 5. Si hay alias o ciudad corta (ej: "GDL"), prefijar con "Ubicación "
  if (locationName) {
    return `Ubicación ${locationName}`;
  }
  if (city) {
    return `Ubicación ${city}`;
  }

  // 6. Fallback territorial con códigos SAT o estado
  const state = (stop.satEstadoCode || stop.state || "").trim();
  const mun = (stop.satMunicipioCode || "").trim();
  if (state || mun) {
    return `Ubicación ${state || "MEX"}-${mun || "000"}`;
  }

  // 7. Fallback último recurso garantizado >= 5 caracteres
  return "Ubicación de parada";
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
    address: resolveStopAddressForApi(source),
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
    sourceAddressId: source.sourceAddressId ?? undefined,
  };
}

/**
 * Payload para `PUT /trips/:id/stops`: no reenviar `addressId` del snapshot
 * owned por la parada (el replace borra stops y esas addresses dejan de existir).
 * Usa snapshot inline + `sourceAddressId` de catálogo (ADR-0055).
 */
export function mapStopToReplaceStopInput(
  source: NonNullable<Trip["stops"]>[number],
  edited?: TripStopOperationalValues,
): CreateStopInput {
  const mapped = mapStopToCreateStopInput(source, edited);
  const { addressId: _omit, ...rest } = mapped;
  return rest;
}
