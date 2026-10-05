import { useMutation, useQueryClient } from "@tanstack/react-query";
import { helpCenterApi } from "../infrastructure";
import { helpCenterQueryKeys } from "./helpCenterQueryKeys";

export function useCreateHelpTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => helpCenterApi.createTicket(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...helpCenterQueryKeys.all, "tickets"],
      });
    },
  });
}
