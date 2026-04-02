/**
 * useClientAddresses Hook
 * Clean Architecture - Application Layer
 *
 * Hook para obtener las direcciones de un cliente.
 *
 * @example
 * const { data: addresses, isLoading } = useClientAddresses(clientId);
 *
 * Ubicación: src/features/clients/application/hooks/useClientAddresses.ts
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { clientAddressRepository } from "../../infrastructure";
import {
  clientQueryKeys,
  type ClientAddress,
  type ClientAddressListItem,
} from "../../domain";

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para obtener todas las direcciones de un cliente
 */
export function useClientAddresses(
  clientId: string | undefined,
  options?: Omit<
    UseQueryOptions<ClientAddressListItem[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: clientQueryKeys.addresses(clientId ?? ""),
    queryFn: () => clientAddressRepository.findByClientId(clientId!),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos en cache
    ...options,
  });
}

/**
 * Hook para obtener una dirección específica
 */
export function useClientAddress(
  clientId: string | undefined,
  addressId: string | undefined,
  options?: Omit<
    UseQueryOptions<ClientAddress | null, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: clientQueryKeys.address(clientId ?? "", addressId ?? ""),
    queryFn: () => clientAddressRepository.findById(clientId!, addressId!),
    enabled: !!clientId && !!addressId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    ...options,
  });
}

/**
 * Hook para obtener la dirección fiscal de un cliente
 */
export function useClientBillingAddress(
  clientId: string | undefined,
  options?: Omit<
    UseQueryOptions<ClientAddress | null, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: [...clientQueryKeys.addresses(clientId ?? ""), "billing"],
    queryFn: () => clientAddressRepository.findBillingAddress(clientId!),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    ...options,
  });
}

export default useClientAddresses;
