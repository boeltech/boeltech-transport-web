/**
 * useDeleteClientAddress Hook
 * Clean Architecture - Application Layer
 *
 * Hook mutation para eliminar una dirección de cliente.
 *
 * @example
 * const { mutate, isPending } = useDeleteClientAddress();
 *
 * const handleDelete = () => {
 *   mutate({ clientId, addressId });
 * };
 *
 * Ubicación: src/features/clients/application/hooks/useDeleteClientAddress.ts
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks";
import { clientAddressRepository } from "../../infrastructure";
import { clientQueryKeys } from "../../domain";

// ============================================================================
// TYPES
// ============================================================================

interface DeleteAddressParams {
  clientId: string;
  addressId: string;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook mutation para eliminar una dirección de cliente
 */
export function useDeleteClientAddress() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, DeleteAddressParams>({
    mutationFn: ({ clientId, addressId }) =>
      clientAddressRepository.delete(clientId, addressId),

    onSuccess: (_, { clientId, addressId }) => {
      // Remover del cache
      queryClient.removeQueries({
        queryKey: clientQueryKeys.address(clientId, addressId),
      });

      // Invalidar lista de direcciones
      queryClient.invalidateQueries({
        queryKey: clientQueryKeys.addresses(clientId),
      });

      // Notificar éxito
      toast({
        title: "Dirección eliminada",
        description: "La dirección ha sido eliminada exitosamente.",
      });
    },

    onError: (error) => {
      toast({
        title: "Error al eliminar",
        description:
          error.message || "Ocurrió un error al eliminar la dirección.",
        variant: "destructive",
      });
    },
  });
}

export default useDeleteClientAddress;
