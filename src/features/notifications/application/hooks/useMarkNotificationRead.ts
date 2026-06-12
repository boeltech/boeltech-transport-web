import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../../infrastructure";
import { invalidateNotificationsQueries } from "../invalidateNotificationsQueries";

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      invalidateNotificationsQueries(queryClient);
    },
  });
}
