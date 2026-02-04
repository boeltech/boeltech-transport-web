// src/features/trips/application/hooks/useTrips.ts

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type {
  PaginatedList,
  TripListItem, // ← Cambio: usar TripListItem para listados
  TripQueryParams,
} from "@features/trips/domain";
import { createGetTripsUseCase } from "@features/trips/application";
import { createTripRepository } from "@features/trips/infrastructure";
import { tripQueryKeys } from "@features/trips/domain/entities";

// ============================================================================
// REPOSITORY INSTANCES
// ============================================================================

const tripRepository = createTripRepository();

/**
 * Hook para obtener lista de viajes (devuelve TripListItem, no Trip completo)
 *
 * Para obtener un viaje completo con todos sus detalles, usar useTrip(id)
 */
export function useTrips(
  params?: TripQueryParams,
  options?: Omit<
    UseQueryOptions<PaginatedList<TripListItem>>, // ← Cambio aquí
    "queryKey" | "queryFn"
  >,
) {
  const getTripsUseCase = createGetTripsUseCase(tripRepository);

  return useQuery({
    queryKey: tripQueryKeys.list(params),
    queryFn: async () => {
      const result = await getTripsUseCase.execute(params);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    staleTime: 0, // Sin staleTime para que siempre refetch cuando se invalida
    refetchOnMount: true, // Refetch al montar el componente
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
    ...options,
  });
}
