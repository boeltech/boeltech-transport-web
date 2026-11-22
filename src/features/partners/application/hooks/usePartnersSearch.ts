import { useQuery } from "@tanstack/react-query";

import { partnerQueryKeys } from "../../domain";
import { searchPartners } from "../../infrastructure/partnersApi";

export function usePartnersSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: partnerQueryKeys.searchQuery(q),
    queryFn: () => searchPartners(q),
    enabled: q.length >= 2,
    staleTime: 60_000,
  });
}
