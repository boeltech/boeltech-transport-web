import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks";
import { clientContactRepository } from "../../infrastructure";
import { clientQueryKeys } from "../../domain";

interface DeleteContactParams {
  clientId: string;
  contactId: string;
}

export function useDeleteClientContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, DeleteContactParams>({
    mutationFn: ({ clientId, contactId }) =>
      clientContactRepository.delete(clientId, contactId),
    onSuccess: (_data, { clientId, contactId }) => {
      queryClient.removeQueries({ queryKey: clientQueryKeys.contact(clientId, contactId) });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.contacts(clientId) });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.detail(clientId) });
      toast({ title: "Contacto eliminado", description: "El contacto se eliminó correctamente." });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar contacto",
        description: error.message || "Ocurrió un error al eliminar el contacto.",
        variant: "destructive",
      });
    },
  });
}
