/**
 * useUpdateClient Hook
 * Clean Architecture - Application Layer
 *
 * Hook mutation para actualizar un cliente existente.
 * Toast / navegación / mapeo de errores de campo: responsabilidad de la página
 * (p. ej. ClientEditPage), igual que useUpdateDriver.
 *
 * @example
 * const { mutate, isPending } = useUpdateClient({
 *   onSuccess: () => navigate(`/clients/${clientId}`),
 *   onError: (error) => { ... },
 * });
 *
 * Ubicación: src/features/clients/application/hooks/useUpdateClient.ts
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
  type Client,
  type UpdateClientDTO,
} from "../../domain";
import { evictInvoicePrefillQueries } from "@features/invoicing/application";

// ============================================================================
// TYPES
// ============================================================================

interface UpdateClientParams {
  clientId: string;
  data: UpdateClientDTO;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook mutation para actualizar un cliente
 */
export function useUpdateClient(
  options?: Omit<
    UseMutationOptions<Client, Error, UpdateClientParams>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, data }: UpdateClientParams) =>
      clientRepository.update(clientId, data),

    onSuccess: (client, variables, onMutateResult, context) => {
      queryClient.setQueryData(clientQueryKeys.detail(client.id), client);
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.active() });
      evictInvoicePrefillQueries(queryClient);
      options?.onSuccess?.(client, variables, onMutateResult, context);
    },

    onError: options?.onError,
    onSettled: options?.onSettled,
  });
}

/**
 * Hook mutation para activar un cliente
 */
export function useActivateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Client, Error, string>({
    mutationFn: (clientId) =>
      clientRepository.update(clientId, { isActive: true }),

    onSuccess: (client) => {
      queryClient.setQueryData(clientQueryKeys.detail(client.id), client);
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.active() });

      toast({
        title: "Cliente activado",
        description: "El cliente ha sido activado exitosamente.",
      });
    },

    onError: (error) => {
      toast({
        title: "Error al activar",
        description: error.message || "Ocurrió un error al activar el cliente.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook mutation para desactivar un cliente
 */
export function useDeactivateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Client, Error, string>({
    mutationFn: (clientId) =>
      clientRepository.update(clientId, { isActive: false }),

    onSuccess: (client) => {
      queryClient.setQueryData(clientQueryKeys.detail(client.id), client);
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.active() });

      toast({
        title: "Cliente desactivado",
        description: "El cliente ha sido desactivado exitosamente.",
      });
    },

    onError: (error) => {
      toast({
        title: "Error al desactivar",
        description:
          error.message || "Ocurrió un error al desactivar el cliente.",
        variant: "destructive",
      });
    },
  });
}

export default useUpdateClient;
