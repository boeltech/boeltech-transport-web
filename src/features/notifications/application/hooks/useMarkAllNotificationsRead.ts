import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MarkAllNotificationsReadInput } from "../../domain";
import { notificationsApi } from "../../infrastructure";
import { invalidateNotificationsQueries } from "../invalidateNotificationsQueries";

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MarkAllNotificationsReadInput = {}) =>
      notificationsApi.markAllRead(input),
    onSuccess: () => {
      invalidateNotificationsQueries(queryClient);
    },
  });
}
