import { useQuery } from "@tanstack/react-query";
import {
  OPERATIONAL_CASH_PENDING_PAGE_SIZE,
  type OperationalCashPendingQueryParams,
} from "@features/finance/domain/operationalCashPending";
import { operationalCashPendingApi } from "@features/finance/infrastructure/operationalCashPendingApi";
import { financeQueryKeys } from "@features/finance/domain";

export function useOperationalCashPending(
  params: OperationalCashPendingQueryParams = {},
  options?: { enabled?: boolean },
) {
  const page = params.page ?? 1;
  const limit = params.limit ?? OPERATIONAL_CASH_PENDING_PAGE_SIZE;
  const clientId = params.clientId?.trim() || null;
  const cobrosBucket = params.cobrosBucket ?? null;

  return useQuery({
    queryKey: financeQueryKeys.operationalCashPending({
      clientId,
      page,
      limit,
      cobrosBucket,
    }),
    queryFn: () =>
      operationalCashPendingApi.list({
        clientId,
        page,
        limit,
        cobrosBucket,
      }),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}
