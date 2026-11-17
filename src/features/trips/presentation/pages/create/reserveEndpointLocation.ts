/**
 * Helpers F8 — Origen/Destino del canvas: ciudad vs lugar put-ready (Q14).
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

/** Ciudad de filtro para reserve (nunca inventa parada CP). */
export function cityLabelFromLocationValue(
  value: LocationValue | null | undefined,
): string {
  if (!value) return "";
  const locality = value.localityName?.trim();
  if (locality) return locality;
  const name = value.locationName?.trim();
  if (!name) return "";
  const beforeComma = name.split(",")[0]?.trim();
  return beforeComma || name;
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
