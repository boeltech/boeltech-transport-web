import type { QueryClient } from "@tanstack/react-query";
import { financeQueryKeys } from "@features/finance/domain";

/** Delay for MV refresh after approval / trip mutations that schedule recalculation. */
export const FINANCE_ANALYSIS_REFRESH_DELAY_MS = 70_000;

let pendingFinanceAnalysisRefresh: ReturnType<typeof setTimeout> | null = null;

/** Prefijos de Análisis (trips / aggregate / performance). */
export function invalidateFinanceAnalysisQueries(
  queryClient: QueryClient,
): void {
  void queryClient.invalidateQueries({
    queryKey: [...financeQueryKeys.all, "profitability-trips"],
  });
  void queryClient.invalidateQueries({
    queryKey: [...financeQueryKeys.all, "profitability-aggregate"],
  });
  void queryClient.invalidateQueries({
    queryKey: [...financeQueryKeys.all, "monthly-performance"],
  });
}

/**
 * Cancels a pending delayed Análisis refresh (logout / tenant switch).
 * Module-level timer — must not live in a React component.
 */
export function cancelFinanceAnalysisRefresh(): void {
  if (pendingFinanceAnalysisRefresh == null) return;
  clearTimeout(pendingFinanceAnalysisRefresh);
  pendingFinanceAnalysisRefresh = null;
}

/**
 * Schedules a single delayed Análisis invalidation (~70 s) for MV catch-up.
 * Replaces any prior pending timer (one at a time).
 * Call in addition to immediate invalidation — does not replace it.
 */
export function scheduleFinanceAnalysisRefresh(
  queryClient: QueryClient,
): void {
  cancelFinanceAnalysisRefresh();
  pendingFinanceAnalysisRefresh = setTimeout(() => {
    pendingFinanceAnalysisRefresh = null;
    invalidateFinanceAnalysisQueries(queryClient);
  }, FINANCE_ANALYSIS_REFRESH_DELAY_MS);
}
