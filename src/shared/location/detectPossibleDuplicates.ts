/**
 * Client-side duplicate address heuristic (ADR-0092 D-F).
 * Warning only — never blocks save.
 */

import { haversineKm } from "@shared/utils/geoUtils";

/** Max Levenshtein distance for street+exterior similarity. */
const SIMILAR_ADDRESS_MAX_DISTANCE = 2;

/** Nearby geo threshold in meters. */
const NEARBY_GEO_METERS = 200;

export interface DuplicateCandidate {
  id?: string | null;
  postalCode?: string | null;
  street?: string | null;
  exteriorNumber?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export type DuplicateReason = "similar_address" | "nearby_geo";

export interface DuplicateWarning {
  candidateId?: string;
  reason: DuplicateReason;
  /** Present when reason is nearby_geo. */
  distanceMeters?: number;
  message: string;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function addressKey(candidate: DuplicateCandidate): string {
  return `${normalizeText(candidate.street)}${normalizeText(candidate.exteriorNumber)}`;
}

/** Classic Levenshtein distance (edit ops). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);

  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j]! + 1,
        curr[j - 1]! + 1,
        prev[j - 1]! + cost,
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j]!;
  }

  return prev[b.length]!;
}

function samePostalCode(
  a: DuplicateCandidate,
  b: DuplicateCandidate,
): boolean {
  const pa = (a.postalCode ?? "").trim();
  const pb = (b.postalCode ?? "").trim();
  return pa.length > 0 && pa === pb;
}

function hasCoords(c: DuplicateCandidate): c is DuplicateCandidate & {
  latitude: number;
  longitude: number;
} {
  return (
    typeof c.latitude === "number" &&
    Number.isFinite(c.latitude) &&
    typeof c.longitude === "number" &&
    Number.isFinite(c.longitude)
  );
}

/**
 * Returns non-blocking warnings for possible duplicates among `existing`.
 * Match if: same postal code + similar street+exterior (Levenshtein ≤ 2)
 * OR geo within 200 m (haversine).
 */
export function detectPossibleDuplicates(
  draft: DuplicateCandidate,
  existing: readonly DuplicateCandidate[],
): DuplicateWarning[] {
  const warnings: DuplicateWarning[] = [];
  const draftKey = addressKey(draft);
  const draftId = draft.id ?? undefined;

  for (const candidate of existing) {
    if (draftId && candidate.id && draftId === candidate.id) continue;

    const candidateId = candidate.id ?? undefined;

    if (samePostalCode(draft, candidate) && draftKey.length > 0) {
      const otherKey = addressKey(candidate);
      if (
        otherKey.length > 0 &&
        levenshtein(draftKey, otherKey) <= SIMILAR_ADDRESS_MAX_DISTANCE
      ) {
        warnings.push({
          candidateId,
          reason: "similar_address",
          message:
            "Puede existir una dirección similar con el mismo código postal.",
        });
        continue;
      }
    }

    if (hasCoords(draft) && hasCoords(candidate)) {
      const distanceMeters =
        haversineKm(
          draft.latitude,
          draft.longitude,
          candidate.latitude,
          candidate.longitude,
        ) * 1000;
      if (distanceMeters <= NEARBY_GEO_METERS) {
        warnings.push({
          candidateId,
          reason: "nearby_geo",
          distanceMeters: Math.round(distanceMeters),
          message:
            "Hay otra ubicación a menos de 200 m de las coordenadas indicadas.",
        });
      }
    }
  }

  return warnings;
}
