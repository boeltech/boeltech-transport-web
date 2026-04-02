/**
 * useDeleteClient Hook
 * Clean Architecture - Application Layer
 *
 * Hook mutation para eliminar un cliente (soft delete).
 *
 * @example
 * const { mutate, isPending } = useDeleteClient();
 *
 * const handleDelete = () => {
 *   mutate(clientId, {
 *     onSuccess: () => navigate("/clients"),
 *   });
 * };
 *
 * Ubicación: src/features/clients/application/hooks/useDeleteClient.ts
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks";
import { clientRepository } from "../../infrastructure";
import { clientQueryKeys } from "../../domain";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook mutation para eliminar un cliente
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, string>({
    mutationFn: (clientId) => clientRepository.delete(clientId),

    onSuccess: (_, clientId) => {
      // Remover del cache
      queryClient.removeQueries({ queryKey: clientQueryKeys.detail(clientId) });

      // Invalidar listados
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.active() });

      // Notificar éxito
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente.",
      });
    },

    onError: (error) => {
      toast({
        title: "Error al eliminar",
        description:
          error.message || "Ocurrió un error al eliminar el cliente.",
        variant: "destructive",
      });
    },
  });
}

export default useDeleteClient;
