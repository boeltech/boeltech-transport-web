/**
 * Driver Query Hooks
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hooks de React Query para queries específicas de conductores:
 * - useAvailableDrivers: Conductores disponibles para asignación
 * - useDriverTrips: Historial de viajes de un conductor
 */

import {
  useInfiniteQuery,
  type UseInfiniteQueryOptions,
} from "@tanstack/react-query";

import type { DriverTripSummary } from "@features/drivers/domain";
import { DriverQueryError, driverQueryKeys } from "@features/drivers/domain";
import { driverRepository } from "@features/drivers/infrastructure/driverRepository";
import {
  createGetDriverTripsUseCase,
  type GetDriverTripsParams,
} from "../index";
import type { MappedPaginatedResult } from "@shared/api";

// ============================================================================
// USE DRIVER TRIPS INFINITE
// ============================================================================

/**
 * Hook para obtener viajes de un conductor con scroll infinito
 *
 * Ideal para listas largas donde el usuario hace scroll
 *
 * @example
 * ```tsx
 * function DriverTripsInfiniteList({ driverId }) {
 *   const {
 *     data,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetchingNextPage,
 *   } = useDriverTripsInfinite(driverId);
 *
 *   const trips = data?.pages.flatMap(page => page.data) ?? [];
 *
 *   return (
 *     <InfiniteScroll
 *       loadMore={fetchNextPage}
 *       hasMore={hasNextPage}
 *       isLoading={isFetchingNextPage}
 *     >
 *       {trips.map(trip => <TripCard key={trip.id} trip={trip} />)}
 *     </InfiniteScroll>
 *   );
 * }
 * ```
 */
export function useDriverTripsInfinite(
  driverId: string,
  params?: Omit<GetDriverTripsParams, "page">,
  options?: Omit<
    UseInfiniteQueryOptions<
      MappedPaginatedResult<DriverTripSummary>,
      DriverQueryError
    >,
    "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
  >,
) {
  const getDriverTripsUseCase = createGetDriverTripsUseCase(driverRepository);
  const limit = params?.limit ?? 10;

  return useInfiniteQuery({
    queryKey: driverQueryKeys.trips(driverId),
    queryFn: async ({ pageParam }) => {
      const result = await getDriverTripsUseCase.execute(driverId, {
        page: pageParam,
        limit,
      });

      if (!result.success) {
        throw new DriverQueryError(
          result.error.code,
          result.error.message,
          result.error.originalMessage,
        );
      }

      return result.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: !!driverId,
    ...options,
  });
}
