import { useQuery } from "@tanstack/react-query";
import { compensationApi } from "../../infrastructure/compensationApi";
import { compensationQueryKeys } from "../compensationQueryKeys";

export function useFrequentCityPairs(
  params?: { limit?: number; q?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: compensationQueryKeys.frequentCityPairs(params),
    queryFn: () => compensationApi.listFrequentCityPairs(params),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
}
