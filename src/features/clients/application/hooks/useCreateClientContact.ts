import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks";
import { clientContactRepository } from "../../infrastructure";
import { clientQueryKeys, type ClientContact, type CreateClientContactDTO } from "../../domain";

interface CreateContactParams {
  clientId: string;
  data: CreateClientContactDTO;
}

export function useCreateClientContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ClientContact, Error, CreateContactParams>({
    mutationFn: ({ clientId, data }) => clientContactRepository.create(clientId, data),
    onSuccess: (_contact, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.contacts(clientId) });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.detail(clientId) });
      toast({ title: "Contacto creado", description: "El contacto se registró correctamente." });
    },
    onError: (error) => {
      toast({
        title: "Error al crear contacto",
        description: error.message || "Ocurrió un error al crear el contacto.",
        variant: "destructive",
      });
    },
  });
}
