import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "../../infrastructure";
import { notificationsQueryKeys } from "../notificationsQueryKeys";

export function useUnreadNotificationsCount(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: notificationsQueryKeys.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
