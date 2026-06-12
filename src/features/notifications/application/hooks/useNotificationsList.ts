import { useQuery } from "@tanstack/react-query";
import type { ListNotificationsFilters } from "../../domain";
import { notificationsApi } from "../../infrastructure";
import { notificationsQueryKeys } from "../notificationsQueryKeys";

export function useNotificationsList(
  filters: ListNotificationsFilters,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: notificationsQueryKeys.list(filters as Record<string, unknown>),
    queryFn: () => notificationsApi.list(filters),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}
