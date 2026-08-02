import type { QueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../infrastructure";
import { notificationsQueryKeys } from "./notificationsQueryKeys";

/**
 * Invalidates inbox lists and refreshes the unread badge with a forced
 * server sync so resolved items disappear without waiting for the 60s throttle.
 */
export function invalidateNotificationsQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({
    queryKey: notificationsQueryKeys.all,
    predicate: (query) => query.queryKey[1] !== "unread-count",
  });
  void queryClient.fetchQuery({
    queryKey: notificationsQueryKeys.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount({ force: true }),
  });
}
