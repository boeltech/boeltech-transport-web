/**
 * useDeleteClient Hook
 * Clean Architecture - Application Layer
 *
 * Hook mutation para eliminar un cliente (soft delete).
 * Toast de éxito por defecto; si se pasa `onError`, el caller muestra el error
 * (p. ej. Alert inline en Dialog — D11).
 *
 * @example
 * const { mutate, isPending } = useDeleteClient({
 *   onSuccess: () => navigate("/clients"),
 *   onError: (error) => setDeleteError(error.message),
 * });
 *
 * Ubicación: src/features/clients/application/hooks/useDeleteClient.ts
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
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
export function useDeleteClient(
  options?: Omit<UseMutationOptions<void, Error, string>, "mutationFn">,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (clientId: string) => clientRepository.delete(clientId),

    onSuccess: (_, clientId, onMutateResult, context) => {
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

      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente.",
      });
      options?.onSuccess?.(_, clientId, onMutateResult, context);
    },

    onError: (error, variables, onMutateResult, context) => {
      if (options?.onError) {
        options.onError(error, variables, onMutateResult, context);
        return;
      }
      toast({
        title: "Error al eliminar",
        description:
          error.message || "Ocurrió un error al eliminar el cliente.",
        variant: "destructive",
      });
    },
    onSettled: options?.onSettled,
  });
}

export default useDeleteClient;
