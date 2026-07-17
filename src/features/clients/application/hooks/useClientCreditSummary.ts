import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { clientHistoryRepository } from "../../infrastructure";
import { clientQueryKeys, type ClientCreditSummary } from "../../domain";

export function useClientCreditSummary(
  clientId: string | undefined,
  prospectiveAmount?: number,
  options?: Omit<
    UseQueryOptions<ClientCreditSummary, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: clientQueryKeys.creditSummary(clientId ?? "", prospectiveAmount),
    queryFn: () =>
      clientHistoryRepository.getCreditSummary(clientId!, prospectiveAmount),
    enabled: !!clientId,
    staleTime: 30_000,
    ...options,
  });
}
