/**
 * useCreateClient Hook
 * Clean Architecture - Application Layer
 *
 * Hook mutation para crear un cliente con su dirección fiscal.
 *
 * @example
 * const { mutate, isPending } = useCreateClient();
 *
 * const handleSubmit = (data) => {
 *   mutate(data, {
 *     onSuccess: (result) => {
 *       navigate(`/clients/${result.clientId}`);
 *     },
 *   });
 * };
 *
 * Ubicación: src/features/clients/application/hooks/useCreateClient.ts
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks";
import { createClientUseCase } from "../useCases/CreateClientUseCase";
import {
  clientQueryKeys,
  type CreateClientWithAddressDTO,
  type CreateClientResult,
} from "../../domain";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook mutation para crear un cliente con dirección fiscal
 */
export function useCreateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<CreateClientResult, Error, CreateClientWithAddressDTO>({
    mutationFn: (data) => createClientUseCase.execute(data),

    onSuccess: (result) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.active() });

      // Notificar éxito
      toast({
        title: "Cliente creado",
        description: `El cliente ${result.clientCode} ha sido creado exitosamente.`,
      });
    },

    onError: (error) => {
      // Notificar error
      toast({
        title: "Error al crear cliente",
        description: error.message || "Ocurrió un error al crear el cliente.",
        variant: "destructive",
      });
    },
  });
}

export default useCreateClient;
