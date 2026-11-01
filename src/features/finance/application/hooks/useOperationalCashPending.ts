import { useQuery } from "@tanstack/react-query";
import {
  OPERATIONAL_CASH_PENDING_PAGE_SIZE,
  type OperationalCashPendingQueryParams,
} from "@features/finance/domain/operationalCashPending";
import { operationalCashPendingApi } from "@features/finance/infrastructure/operationalCashPendingApi";
import { financeQueryKeys } from "../financeQueryKeys";

export function useOperationalCashPending(
  params: OperationalCashPendingQueryParams = {},
  options?: { enabled?: boolean },
) {
  const page = params.page ?? 1;
  const limit = params.limit ?? OPERATIONAL_CASH_PENDING_PAGE_SIZE;
  const clientId = params.clientId?.trim() || null;

  return useQuery({
    queryKey: financeQueryKeys.operationalCashPending({
      clientId,
      page,
      limit,
    }),
    queryFn: () =>
      operationalCashPendingApi.list({ clientId, page, limit }),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}
