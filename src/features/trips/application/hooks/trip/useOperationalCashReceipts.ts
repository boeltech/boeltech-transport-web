import { useQuery } from "@tanstack/react-query";
import {
  tripQueryKeys,
  type OperationalCashReceipt,
} from "@features/trips/domain";
import { tripsApi } from "@features/trips/infrastructure/api/tripsApi";

export function useOperationalCashReceipts(
  tripId: string | undefined,
  options?: { includeVoided?: boolean; enabled?: boolean },
) {
  const includeVoided = options?.includeVoided ?? true;
  return useQuery<OperationalCashReceipt[]>({
    queryKey: [
      ...tripQueryKeys.operationalCashReceipts(tripId ?? ""),
      { includeVoided },
    ],
    queryFn: () =>
      tripsApi.listOperationalCashReceipts(tripId!, { includeVoided }),
    enabled: Boolean(tripId) && (options?.enabled ?? true),
  });
}
