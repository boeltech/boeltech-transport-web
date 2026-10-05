import { useQuery } from "@tanstack/react-query";
import { helpCenterApi } from "../infrastructure";
import { helpCenterQueryKeys } from "./helpCenterQueryKeys";

export function useHelpArticle(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: helpCenterQueryKeys.article(id),
    queryFn: () => helpCenterApi.getArticle(id),
    staleTime: 5 * 60_000,
    enabled: options?.enabled ?? true,
  });
}
