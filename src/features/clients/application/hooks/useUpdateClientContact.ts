import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks";
import { clientContactRepository } from "../../infrastructure";
import { clientQueryKeys, type ClientContact, type UpdateClientContactDTO } from "../../domain";

interface UpdateContactParams {
  clientId: string;
  contactId: string;
  data: UpdateClientContactDTO;
}

export function useUpdateClientContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ClientContact, Error, UpdateContactParams>({
    mutationFn: ({ clientId, contactId, data }) =>
      clientContactRepository.update(clientId, contactId, data),
    onSuccess: (contact, { clientId, contactId }) => {
      queryClient.setQueryData(clientQueryKeys.contact(clientId, contactId), contact);
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.contacts(clientId) });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.detail(clientId) });
      toast({ title: "Contacto actualizado", description: "Los cambios se guardaron correctamente." });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar contacto",
        description: error.message || "Ocurrió un error al actualizar el contacto.",
        variant: "destructive",
      });
    },
  });
}
