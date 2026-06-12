import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { clientHistoryRepository } from "../../infrastructure";
import {
  clientQueryKeys,
  type ClientTripHistoryFilters,
  type ClientTripHistoryItem,
  type PaginatedResult,
} from "../../domain";

export function useClientTripHistory(
  clientId: string | undefined,
  filters: ClientTripHistoryFilters = {},
  options?: Omit<
    UseQueryOptions<PaginatedResult<ClientTripHistoryItem>, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: clientQueryKeys.tripHistory(clientId ?? "", filters),
    queryFn: () => clientHistoryRepository.getTripHistory(clientId!, filters),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
    ...options,
  });
}
