import type { QueryClient } from "@tanstack/react-query";
import { invalidateApprovalsRelatedQueries } from "@features/approvals/application";
import { settlementsQueryKeys } from "./settlementsQueryKeys";

/**
 * Liquidaciones, detalle, anticipos y bandeja.
 * Incluye fan-out al hub de aprobaciones (ADR-0099: recargar, no reintentar).
 */
export function invalidateSettlementQueries(
  queryClient: QueryClient,
  id?: string,
): void {
  if (id) {
    void queryClient.invalidateQueries({
      queryKey: settlementsQueryKeys.settlementDetail(id),
    });
  }
  void queryClient.invalidateQueries({
    queryKey: settlementsQueryKeys.settlements(),
  });
  void queryClient.invalidateQueries({
    queryKey: settlementsQueryKeys.advances(),
  });
  invalidateApprovalsRelatedQueries(queryClient);
}
