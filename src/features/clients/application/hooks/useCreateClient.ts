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
import { useNavigate } from "react-router-dom";
import { useToast } from "@shared/hooks";
import {
  createClientUseCase,
  CreateClientAddressFailedError,
  CreateClientPrimaryContactFailedError,
} from "../useCases/CreateClientUseCase";
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
  const navigate = useNavigate();

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
      if (error instanceof CreateClientAddressFailedError) {
        queryClient.invalidateQueries({ queryKey: clientQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: clientQueryKeys.active() });
        queryClient.invalidateQueries({
          queryKey: clientQueryKeys.detail(error.clientId),
        });

        toast({
          title: "Cliente creado; dirección fiscal pendiente",
          description: `El cliente ${error.clientCode} se guardó, pero no se pudo registrar la dirección. Puedes completarla en el detalle del cliente.`,
          variant: "destructive",
          duration: 12_000,
          action: {
            label: "Abrir cliente",
            onClick: () => {
              navigate(`/clients/${error.clientId}`);
            },
          },
        });
        return;
      }

      if (error instanceof CreateClientPrimaryContactFailedError) {
        queryClient.invalidateQueries({ queryKey: clientQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: clientQueryKeys.active() });
        queryClient.invalidateQueries({
          queryKey: clientQueryKeys.detail(error.clientId),
        });

        toast({
          title: "Cliente creado; contacto pendiente",
          description: `El cliente ${error.clientCode} y su dirección se guardaron, pero no se pudo registrar el contacto principal. Puedes agregarlo en el detalle del cliente.`,
          variant: "destructive",
          duration: 12_000,
          action: {
            label: "Abrir cliente",
            onClick: () => {
              navigate(`/clients/${error.clientId}`);
            },
          },
        });
        navigate(`/clients/${error.clientId}`);
        return;
      }

      toast({
        title: "Error al crear cliente",
        description: error.message || "Ocurrió un error al crear el cliente.",
        variant: "destructive",
      });
    },
  });
}

export default useCreateClient;
