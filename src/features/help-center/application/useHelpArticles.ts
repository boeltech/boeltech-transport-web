import { useQuery } from "@tanstack/react-query";
import { helpCenterApi, type HelpArticlesFilters } from "../infrastructure";
import { helpCenterQueryKeys } from "./helpCenterQueryKeys";

export function useHelpArticles(
  filters: HelpArticlesFilters = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: helpCenterQueryKeys.articles(filters),
    queryFn: () => helpCenterApi.getArticles(filters),
    staleTime: 5 * 60_000,
    enabled: options?.enabled ?? true,
  });
}
