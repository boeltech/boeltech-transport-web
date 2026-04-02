/**
 * useClient Hook
 * Clean Architecture - Application Layer
 *
 * Hook para obtener un cliente específico por ID.
 *
 * @example
 * const { data: client, isLoading, error } = useClient(clientId);
 *
 * Ubicación: src/features/clients/application/hooks/useClient.ts
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { clientRepository } from "../../infrastructure";
import { clientQueryKeys, type Client } from "../../domain";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para obtener un cliente por ID
 *
 * @param clientId - ID del cliente
 * @param options - Opciones adicionales de React Query
 */
export function useClient(
  clientId: string | undefined,
  options?: Omit<UseQueryOptions<Client | null, Error>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: clientQueryKeys.detail(clientId ?? ""),
    queryFn: () => clientRepository.findById(clientId!),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos en cache
    ...options,
  });
}

export default useClient;
