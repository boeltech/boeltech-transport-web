import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "../../infrastructure";
import { notificationsQueryKeys } from "../notificationsQueryKeys";

export function useUnreadNotificationsCount(options?: {
  enabled?: boolean;
  /** Force producer sync (portal roles need dismiss of staff-ops drafts). */
  force?: boolean;
}) {
  const force = options?.force === true;

  return useQuery({
    queryKey: notificationsQueryKeys.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount({ force }),
    enabled: options?.enabled ?? true,
    staleTime: force ? 0 : 60_000,
    refetchOnWindowFocus: true,
  });
}
