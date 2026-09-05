import type { CorridorRefType } from "../../domain/enums";
import type { RouteCorridorTariff } from "../../domain/entities";

export type BranchNameMap = ReadonlyMap<string, string>;

export function buildBranchNameMap(
  branches: readonly { id: string; name: string; code?: string }[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const branch of branches) {
    map.set(
      branch.id,
      branch.code ? `${branch.code} — ${branch.name}` : branch.name,
    );
  }
  return map;
}

export function formatCorridorEndpoint(
  refType: CorridorRefType,
  refValue: string,
  branchNameMap?: BranchNameMap,
): string {
  if (refType === "branch" && branchNameMap?.has(refValue)) {
    return branchNameMap.get(refValue) ?? refValue;
  }
  return refValue;
}

export function formatCorridorRouteHuman(
  corridor: Pick<
    RouteCorridorTariff,
    | "originRefType"
    | "originRefValue"
    | "destinationRefType"
    | "destinationRefValue"
  >,
  branchNameMap?: BranchNameMap,
): string {
  const origin = formatCorridorEndpoint(
    corridor.originRefType,
    corridor.originRefValue,
    branchNameMap,
  );
  const destination = formatCorridorEndpoint(
    corridor.destinationRefType,
    corridor.destinationRefValue,
    branchNameMap,
  );
  return `${origin} → ${destination}`;
}
