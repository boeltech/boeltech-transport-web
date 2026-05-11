import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createPartner } from "../../infrastructure/partnersApi";

export function useCreatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPartner,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["partners", "search"] });
    },
  });
}
