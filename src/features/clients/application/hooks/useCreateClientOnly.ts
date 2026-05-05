/**
 * useCreateClientOnly Hook
 * Clean Architecture - Application Layer
 *
 * Hook mutation para crear un cliente SIN dirección fiscal.
 * Útil cuando el usuario decide capturar la dirección después
 * (toggle "Crear sin dirección" en el wizard).
 *
 * @example
 * const { mutate, isPending } = useCreateClientOnly();
 *
 * mutate(clientData, {
 *   onSuccess: ({ id }) => navigate(`/clients/${id}`),
 * });
 *
 * Ubicación: src/features/clients/application/hooks/useCreateClientOnly.ts
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks";
import { createClientUseCase } from "../useCases/CreateClientUseCase";
import { clientQueryKeys, type CreateClientDTO } from "../../domain";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateClientOnlyResult {
  id: string;
  clientCode: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useCreateClientOnly() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<CreateClientOnlyResult, Error, CreateClientDTO>({
    mutationFn: (data) => createClientUseCase.createClientOnly(data),

    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.active() });

      toast({
        title: "Cliente creado",
        description: `El cliente ${result.clientCode} se creó sin dirección. Puedes agregarla desde el detalle.`,
      });
    },

    onError: (error) => {
      toast({
        title: "Error al crear cliente",
        description: error.message || "Ocurrió un error al crear el cliente.",
        variant: "destructive",
      });
    },
  });
}

export default useCreateClientOnly;
