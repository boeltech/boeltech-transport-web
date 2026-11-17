/**
 * Helpers F8 / F8b — Origen/Destino del canvas: ciudad vs lugar put-ready (Q14).
 */
import type { CreateStopInput } from "@features/trips/domain";
import type { LocationValue } from "@shared/ui/location";
import {
  locationValueToAddressSearchListItem,
  synthesizeSearchItemFromLocationValue,
} from "@shared/ui/location";

import {
  addressSearchItemToCreateStopInput,
  finalizeReplaceStopsPayload,
  isComposerPickPutReady,
  type ComposerEndpointDraft,
  type ComposerEndpointPick,
} from "../../components/trip-route/buildReplaceStopsPayload";

/**
 * Evidencia de «lugar» en la card (no solo ciudad): coords+CP, o badge
 * ajustada/aproximada/exacta con rastro de domicilio.
 */
export function isPlaceLikeLocationValue(
  value: LocationValue | null | undefined,
): boolean {
  if (!value) return false;
  const lat = value.latitude;
  const lng = value.longitude;
  const hasCoords =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
  const hasCp = /^\d{5}$/.test(value.postalCode?.trim() ?? "");
  if (hasCoords && hasCp) return true;

  const accuracy = value.geocodingAccuracy;
  const adjusted =
    accuracy === "manual" ||
    accuracy === "exact" ||
    accuracy === "approximate";
  if (
    adjusted &&
    (hasCoords || hasCp || Boolean(value.street?.trim()) || Boolean(value.satStateCode?.trim()))
  ) {
    return true;
  }
  return false;
}

/**
 * Ciudad de filtro para reserve (D56 / O4).
 * Preferir localidad SAT; ciudad-only puede usar `locationName`.
 * Nunca el nombre comercial de un lugar.
 */
export function cityLabelFromLocationValue(
  value: LocationValue | null | undefined,
): string {
  if (!value) return "";
  const locality = value.localityName?.trim();
  if (locality) return locality;

  if (!isPlaceLikeLocationValue(value)) {
    const name = value.locationName?.trim();
    if (!name) return "";
    const beforeComma = name.split(",")[0]?.trim();
    return beforeComma || name;
  }

  return "";
}

/**
 * Label de ciudad para el form de reserve: localidad SAT, o fallback no comercial
 * cuando el extremo ya es put-ready (Zod exige ciudad ≥2).
 */
export function reserveCityLabelForForm(
  value: LocationValue | null | undefined,
  pickReady: boolean,
): string {
  const city = cityLabelFromLocationValue(value);
  if (city.length >= 2) return city;
  if (!pickReady || !value) return city;
  const state = value.satStateCode?.trim();
  if (state && state.length >= 2) return state;
  return city;
}

export function locationValueToEndpointPick(
  value: LocationValue,
): ComposerEndpointPick {
  return (
    locationValueToAddressSearchListItem(value) ??
    synthesizeSearchItemFromLocationValue(value)
  );
}

export function cityOnlyLocationValue(city: string): LocationValue {
  return { locationName: city.trim() || null };
}

/** Mensaje cuando la card parece lugar pero no pasa put-ready (O2/O3). */
export function placeIncompleteForReserveMessage(
  value: LocationValue | null | undefined,
): string | null {
  if (!value || !isPlaceLikeLocationValue(value)) return null;
  const pick = locationValueToEndpointPick(value);
  if (isComposerPickPutReady(pick)) return null;

  if ((value.satAmbiguities?.length ?? 0) > 0) {
    return "Hay más de una colonia o municipio posibles. Completa el domicilio en Confirmar para guardarlo como parada.";
  }
  if (!value.satStateCode?.trim()) {
    return "Falta el estado SAT para guardar como parada. Completa Confirmar o elige solo una ciudad.";
  }
  const street = value.street?.trim() ?? "";
  const label = value.locationName?.trim() ?? "";
  if (street.length < 1 && label.length < 5) {
    return "Falta calle o un nombre de al menos 5 caracteres para guardar como parada.";
  }
  const lat = value.latitude;
  const lng = value.longitude;
  if (
    lat == null ||
    lng == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return "Falta el punto en el mapa para guardar como parada.";
  }
  if (!/^\d{5}$/.test(value.postalCode?.trim() ?? "")) {
    return "Falta un código postal de 5 dígitos para guardar como parada.";
  }
  return "Faltan datos para guardar como parada. Completa Confirmar o elige solo una ciudad.";
}

/**
 * 0–2 stops put-ready para POST reserve (sin corredor).
 * Ciudad-only no entra: solo `isComposerPickPutReady`.
 */
export function buildReserveStopsFromEndpointDraft(
  draft: ComposerEndpointDraft,
): CreateStopInput[] | undefined {
  const stops: CreateStopInput[] = [];
  if (draft.origin && isComposerPickPutReady(draft.origin)) {
    stops.push(addressSearchItemToCreateStopInput(draft.origin, "origin", 1));
  }
  if (draft.destination && isComposerPickPutReady(draft.destination)) {
    stops.push(
      addressSearchItemToCreateStopInput(draft.destination, "destination", 1),
    );
  }
  if (stops.length === 0) return undefined;
  return finalizeReplaceStopsPayload(stops);
}
