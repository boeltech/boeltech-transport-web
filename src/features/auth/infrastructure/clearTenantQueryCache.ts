/**
 * Clears tenant React Query cache while preserving platform keys
 * (`platformQueryKeys.all` → ["platform"]).
 */
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { cancelFinanceAnalysisRefresh } from "@features/finance/application/invalidateFinanceAnalysisQueries";

export function isPlatformQueryKey(queryKey: QueryKey): boolean {
  return queryKey[0] === "platform";
}

export function clearTenantQueryCache(queryClient: QueryClient): void {
  cancelFinanceAnalysisRefresh();
  queryClient.removeQueries({
    predicate: (query) => !isPlatformQueryKey(query.queryKey),
  });
}
