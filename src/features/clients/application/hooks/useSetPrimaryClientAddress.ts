import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks";
import { clientAddressRepository } from "../../infrastructure";
import { clientQueryKeys } from "../../domain";

interface SetPrimaryAddressParams {
  clientId: string;
  addressId: string;
}

interface UseSetPrimaryClientAddressOptions {
  silent?: boolean;
}

export function useSetPrimaryClientAddress(
  options: UseSetPrimaryClientAddressOptions = {},
) {
  const { silent = false } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, SetPrimaryAddressParams>({
    mutationFn: ({ clientId, addressId }) =>
      clientAddressRepository.setPrimaryAddress(clientId, addressId),

    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({
        queryKey: clientQueryKeys.addresses(clientId),
      });

      if (!silent) {
        toast({
          title: "Dirección principal actualizada",
          description: "La dirección seleccionada ahora es la principal.",
        });
      }
    },

    onError: (error) => {
      if (!silent) {
        toast({
          title: "Error al marcar como principal",
          description:
            error.message ||
            "No se pudo actualizar la dirección principal del cliente.",
          variant: "destructive",
        });
      }
    },
  });
}

export default useSetPrimaryClientAddress;
