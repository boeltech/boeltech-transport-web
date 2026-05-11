import { useQuery } from "@tanstack/react-query";

import { searchPartners } from "../../infrastructure/partnersApi";

export function usePartnersSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["partners", "search", q],
    queryFn: () => searchPartners(q),
    enabled: q.length >= 2,
    staleTime: 60_000,
  });
}
