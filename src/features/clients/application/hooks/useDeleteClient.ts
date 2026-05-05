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
import {
  clientQueryKeys,
  type ClientListItem,
  type PaginatedResult,
} from "../../domain";

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
      queryClient.removeQueries({ queryKey: clientQueryKeys.detail(clientId) });

      // Quitar el cliente de los listados en caché sin refetch inmediato: un
      // soft delete en API suele devolver el mismo registro al invalidar, y
      // el ítem “reaparece” hasta que el backend filtre por `deleted_at`.
      queryClient.setQueriesData<PaginatedResult<ClientListItem>>(
        { queryKey: clientQueryKeys.lists() },
        (old) => {
          if (!old?.data?.length) return old;
          if (!old.data.some((c) => c.id === clientId)) return old;
          return {
            ...old,
            data: old.data.filter((c) => c.id !== clientId),
            pagination: {
              ...old.pagination,
              total: Math.max(0, old.pagination.total - 1),
            },
          };
        },
      );

      queryClient.setQueryData<ClientListItem[]>(
        clientQueryKeys.active(),
        (old) => (old ? old.filter((c) => c.id !== clientId) : old),
      );

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
