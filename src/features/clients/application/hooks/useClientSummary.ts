import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { clientHistoryRepository } from "../../infrastructure";
import { clientQueryKeys, type ClientSummary } from "../../domain";

export function useClientSummary(
  clientId: string | undefined,
  options?: Omit<UseQueryOptions<ClientSummary, Error>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: clientQueryKeys.summary(clientId ?? ""),
    queryFn: () => clientHistoryRepository.getSummary(clientId!),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
    ...options,
  });
}
