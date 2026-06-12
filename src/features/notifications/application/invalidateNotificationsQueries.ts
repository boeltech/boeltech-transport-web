import type { QueryClient } from "@tanstack/react-query";
import { notificationsQueryKeys } from "./notificationsQueryKeys";

export function invalidateNotificationsQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.all });
}
