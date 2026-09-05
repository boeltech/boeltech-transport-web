import type { CorridorRefType } from "../../domain/enums";
import type { RouteCorridorTariff } from "../../domain/entities";

export function normalizeCorridorRefValue(
  refType: CorridorRefType,
  refValue: string,
): string {
  const trimmed = refValue.trim();
  if (refType === "branch") {
    return trimmed;
  }
  return trimmed.toLowerCase().replace(/\s+/g, " ");
}

export function buildCorridorMatchKey(
  corridor: Pick<
    RouteCorridorTariff,
    "originRefType" | "originRefValue" | "destinationRefType" | "destinationRefValue"
  >,
): string {
  const origin = normalizeCorridorRefValue(corridor.originRefType, corridor.originRefValue);
  const destination = normalizeCorridorRefValue(
    corridor.destinationRefType,
    corridor.destinationRefValue,
  );
  return `${corridor.originRefType}:${origin}|${corridor.destinationRefType}:${destination}`;
}

export interface DuplicateCorridorIndex {
  duplicateIds: ReadonlySet<string>;
  duplicateKeys: ReadonlyMap<string, readonly string[]>;
}

export function buildDuplicateCorridorIndex(
  corridors: readonly RouteCorridorTariff[],
): DuplicateCorridorIndex {
  const byKey = new Map<string, string[]>();

  for (const corridor of corridors) {
    const key = buildCorridorMatchKey(corridor);
    const ids = byKey.get(key) ?? [];
    ids.push(corridor.id);
    byKey.set(key, ids);
  }

  const duplicateIds = new Set<string>();
  const duplicateKeys = new Map<string, readonly string[]>();

  for (const [key, ids] of byKey.entries()) {
    if (ids.length < 2) continue;
    duplicateKeys.set(key, ids);
    for (const id of ids) {
      duplicateIds.add(id);
    }
  }

  return { duplicateIds, duplicateKeys };
}

export function findDuplicateCorridorIdsForPayload(
  corridors: readonly RouteCorridorTariff[],
  payload: Pick<
    RouteCorridorTariff,
    "originRefType" | "originRefValue" | "destinationRefType" | "destinationRefValue"
  >,
  excludeId?: string,
): readonly string[] {
  const key = buildCorridorMatchKey(payload);
  const matches = corridors.filter(
    (corridor) => corridor.id !== excludeId && buildCorridorMatchKey(corridor) === key,
  );
  return matches.map((corridor) => corridor.id);
}
