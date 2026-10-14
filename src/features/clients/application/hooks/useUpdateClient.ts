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
 * Hook mutation para activar un cliente.
 * Toast de éxito por defecto; si se pasa `onError`, el caller muestra el error
 * (p. ej. Alert inline en Dialog — D11).
 */
export function useActivateClient(
  options?: Omit<UseMutationOptions<Client, Error, string>, "mutationFn">,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (clientId: string) =>
      clientRepository.update(clientId, { isActive: true }),

    onSuccess: (client, variables, onMutateResult, context) => {
      queryClient.setQueryData(clientQueryKeys.detail(client.id), client);
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.active() });

      toast({
        title: "Cliente activado",
        description: "El cliente ha sido activado exitosamente.",
      });
      options?.onSuccess?.(client, variables, onMutateResult, context);
    },

    onError: (error, variables, onMutateResult, context) => {
      if (options?.onError) {
        options.onError(error, variables, onMutateResult, context);
        return;
      }
      toast({
        title: "Error al activar",
        description: error.message || "Ocurrió un error al activar el cliente.",
        variant: "destructive",
      });
    },
    onSettled: options?.onSettled,
  });
}

/**
 * Hook mutation para desactivar un cliente.
 * Toast de éxito por defecto; si se pasa `onError`, el caller muestra el error
 * (p. ej. Alert inline en Dialog — D11).
 */
export function useDeactivateClient(
  options?: Omit<UseMutationOptions<Client, Error, string>, "mutationFn">,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (clientId: string) =>
      clientRepository.update(clientId, { isActive: false }),

    onSuccess: (client, variables, onMutateResult, context) => {
      queryClient.setQueryData(clientQueryKeys.detail(client.id), client);
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.active() });

      toast({
        title: "Cliente desactivado",
        description: "El cliente ha sido desactivado exitosamente.",
      });
      options?.onSuccess?.(client, variables, onMutateResult, context);
    },

    onError: (error, variables, onMutateResult, context) => {
      if (options?.onError) {
        options.onError(error, variables, onMutateResult, context);
        return;
      }
      toast({
        title: "Error al desactivar",
        description:
          error.message || "Ocurrió un error al desactivar el cliente.",
        variant: "destructive",
      });
    },
    onSettled: options?.onSettled,
  });
}

export default useUpdateClient;
