import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListNotificationsFilters } from "../../domain";
import { notificationsApi } from "../../infrastructure";
import { notificationsQueryKeys } from "../notificationsQueryKeys";

export function useNotificationsList(
  filters: ListNotificationsFilters,
  options?: { enabled?: boolean },
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: notificationsQueryKeys.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const result = await notificationsApi.list(filters);
      // Sync badge after list (which force-syncs producers / dismissStale).
      queryClient.setQueryData(
        notificationsQueryKeys.unreadCount(),
        result.unreadCount,
      );
      return result;
    },
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}
