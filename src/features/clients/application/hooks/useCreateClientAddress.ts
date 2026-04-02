/**
 * useCreateClientAddress Hook
 * Clean Architecture - Application Layer
 *
 * Hook mutation para crear una dirección de cliente.
 *
 * @example
 * const { mutate, isPending } = useCreateClientAddress();
 *
 * const handleSubmit = (data) => {
 *   mutate({ clientId, data });
 * };
 *
 * Ubicación: src/features/clients/application/hooks/useCreateClientAddress.ts
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks";
import { clientAddressRepository } from "../../infrastructure";
import {
  clientQueryKeys,
  ADDRESS_TYPE_LABELS,
  type ClientAddress,
  type CreateClientAddressDTO,
} from "../../domain";

// ============================================================================
// TYPES
// ============================================================================

interface CreateAddressParams {
  clientId: string;
  data: CreateClientAddressDTO;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook mutation para crear una dirección de cliente
 */
export function useCreateClientAddress() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ClientAddress, Error, CreateAddressParams>({
    mutationFn: ({ clientId, data }) =>
      clientAddressRepository.create(clientId, data),

    onSuccess: (address, { clientId }) => {
      // Invalidar cache de direcciones
      queryClient.invalidateQueries({
        queryKey: clientQueryKeys.addresses(clientId),
      });

      // Notificar éxito
      const typeLabel = ADDRESS_TYPE_LABELS[address.addressType];
      toast({
        title: "Dirección creada",
        description: `La dirección de ${typeLabel.toLowerCase()} ha sido creada exitosamente.`,
      });
    },

    onError: (error) => {
      toast({
        title: "Error al crear dirección",
        description: error.message || "Ocurrió un error al crear la dirección.",
        variant: "destructive",
      });
    },
  });
}

export default useCreateClientAddress;
