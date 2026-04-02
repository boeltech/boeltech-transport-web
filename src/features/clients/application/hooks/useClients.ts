/**
 * useClients Hooks
 * Clean Architecture - Application Layer
 *
 * Hooks para obtener listados de clientes con filtros y paginación.
 *
 * @example
 * // Listado paginado
 * const { data, isLoading } = useClients({ search: "acme" }, { page: 1, limit: 20 });
 *
 * // Clientes activos (para selectores)
 * const { data: clients } = useActiveClients();
 *
 * Ubicación: src/features/clients/application/hooks/useClients.ts
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { clientRepository } from "../../infrastructure";
import {
  clientQueryKeys,
  type ClientListItem,
  type ClientFilters,
  type PaginationParams,
  type PaginatedResult,
} from "../../domain";

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para obtener clientes con filtros y paginación
 */
export function useClients(
  filters: ClientFilters = {},
  pagination: PaginationParams = { page: 1, limit: 20 },
  options?: Omit<
    UseQueryOptions<PaginatedResult<ClientListItem>, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: clientQueryKeys.list({ ...filters, ...pagination }),
    queryFn: () => clientRepository.findAll(filters, pagination),
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos en cache
    ...options,
  });
}

/**
 * Hook para obtener clientes activos (para selectores)
 */
export function useActiveClients(
  options?: Omit<
    UseQueryOptions<ClientListItem[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: clientQueryKeys.active(),
    queryFn: () => clientRepository.findActive(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos en cache
    ...options,
  });
}

export default useClients;
