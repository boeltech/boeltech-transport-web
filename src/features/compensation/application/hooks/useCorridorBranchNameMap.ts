import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { branchQueryKeys } from "@features/branches/domain";
import { branchesApi } from "@features/branches/infrastructure";
import type { RouteCorridorTariff } from "../../domain/entities";
import {
  buildBranchNameMap,
  type BranchNameMap,
} from "../../presentation/utils/formatCorridorRoute";

function collectBranchIds(corridors: readonly RouteCorridorTariff[]): string[] {
  const ids = new Set<string>();

  for (const corridor of corridors) {
    if (corridor.originRefType === "branch" && corridor.originRefValue.trim()) {
      ids.add(corridor.originRefValue.trim());
    }
    if (corridor.destinationRefType === "branch" && corridor.destinationRefValue.trim()) {
      ids.add(corridor.destinationRefValue.trim());
    }
  }

  return [...ids];
}

export function useCorridorBranchNameMap(
  corridors: readonly RouteCorridorTariff[],
  prefetchedBranches: readonly { id: string; name: string; code?: string }[],
): BranchNameMap {
  const baseMap = useMemo(
    () => buildBranchNameMap(prefetchedBranches),
    [prefetchedBranches],
  );

  const missingBranchIds = useMemo(
    () => collectBranchIds(corridors).filter((id) => !baseMap.has(id)),
    [corridors, baseMap],
  );

  const detailQueries = useQueries({
    queries: missingBranchIds.map((branchId) => ({
      queryKey: branchQueryKeys.detail(branchId),
      queryFn: async () => {
        const response = await branchesApi.getById(branchId);
        if (!response.data) {
          throw new Error("No se encontró la sucursal");
        }
        return response.data;
      },
      enabled: Boolean(branchId),
      staleTime: 30_000,
    })),
  });

  return useMemo(() => {
    const merged = new Map(baseMap);

    for (const query of detailQueries) {
      const branch = query.data;
      if (!branch) continue;
      merged.set(
        branch.id,
        branch.code ? `${branch.code} — ${branch.name}` : branch.name,
      );
    }

    return merged;
  }, [baseMap, detailQueries]);
}
