/**
 * useUpdateClientAddress Hook
 * Clean Architecture - Application Layer
 *
 * Hook mutation para actualizar una dirección de cliente.
 *
 * @example
 * const { mutate, isPending } = useUpdateClientAddress();
 *
 * const handleSubmit = (data) => {
 *   mutate({ clientId, addressId, data });
 * };
 *
 * Ubicación: src/features/clients/application/hooks/useUpdateClientAddress.ts
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks";
import { clientAddressRepository } from "../../infrastructure";
import {
  clientQueryKeys,
  type ClientAddress,
  type UpdateClientAddressDTO,
} from "../../domain";

// ============================================================================
// TYPES
// ============================================================================

interface UpdateAddressParams {
  clientId: string;
  addressId: string;
  data: UpdateClientAddressDTO;
}

interface UseUpdateClientAddressOptions {
  silent?: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook mutation para actualizar una dirección de cliente
 */
export function useUpdateClientAddress(options: UseUpdateClientAddressOptions = {}) {
  const { silent = false } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ClientAddress, Error, UpdateAddressParams>({
    mutationFn: ({ clientId, addressId, data }) =>
      clientAddressRepository.update(clientId, addressId, data),

    onSuccess: (address, { clientId, addressId }) => {
      // Actualizar cache de la dirección específica
      queryClient.setQueryData(
        clientQueryKeys.address(clientId, addressId),
        address,
      );

      // Invalidar lista de direcciones (en background)
      queryClient.invalidateQueries({
        queryKey: clientQueryKeys.addresses(clientId),
      });

      // Notificar éxito
      if (!silent) {
        toast({
          title: "Dirección actualizada",
          description: "Los cambios han sido guardados exitosamente.",
        });
      }
    },

    onError: (error) => {
      if (!silent) {
        toast({
          title: "Error al actualizar",
          description:
            error.message || "Ocurrió un error al actualizar la dirección.",
          variant: "destructive",
        });
      }
    },
  });
}

export default useUpdateClientAddress;
