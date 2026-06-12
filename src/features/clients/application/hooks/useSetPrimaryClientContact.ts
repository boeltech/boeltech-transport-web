import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks";
import { clientContactRepository } from "../../infrastructure";
import { clientQueryKeys } from "../../domain";

interface SetPrimaryParams {
  clientId: string;
  contactId: string;
}

export function useSetPrimaryClientContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, SetPrimaryParams>({
    mutationFn: ({ clientId, contactId }) =>
      clientContactRepository.setPrimary(clientId, contactId),
    onSuccess: (_data, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.contacts(clientId) });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.detail(clientId) });
      toast({
        title: "Contacto principal",
        description: "Se actualizó el contacto principal del cliente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo marcar como principal.",
        variant: "destructive",
      });
    },
  });
}
