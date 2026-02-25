/**
 * Driver Query Hooks
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hooks de React Query para queries específicas de conductores:
 * - useAvailableDrivers: Conductores disponibles para asignación
 * - useDriverTrips: Historial de viajes de un conductor
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { DriverTripSummary } from "@features/drivers/domain";
import { DriverQueryError, driverQueryKeys } from "@features/drivers/domain";
import { driverRepository } from "@features/drivers/infrastructure/driverRepository";
import {
  createGetDriverTripsUseCase,
  type GetDriverTripsParams,
} from "../index";
import type { MappedPaginatedResult } from "@shared/api";

// ============================================================================
// USE DRIVER TRIPS
// ============================================================================

/**
 * Hook para obtener el historial de viajes de un conductor
 *
 * @param driverId - ID del conductor
 * @param params - Parámetros de paginación
 *
 * @example
 * ```tsx
 * function DriverTripsHistory({ driverId }) {
 *   const { data, isLoading } = useDriverTrips(driverId, { page: 1, limit: 10 });
 *
 *   return (
 *     <div>
 *       <h3>Viajes realizados: {data?.pagination.total}</h3>
 *       <TripsList trips={data?.data} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useDriverTrips(
  driverId: string,
  params?: GetDriverTripsParams,
  options?: Omit<
    UseQueryOptions<MappedPaginatedResult<DriverTripSummary>, DriverQueryError>,
    "queryKey" | "queryFn"
  >,
) {
  const getDriverTripsUseCase = createGetDriverTripsUseCase(driverRepository);

  return useQuery({
    queryKey: driverQueryKeys.tripsPage(driverId, params?.page ?? 1),
    queryFn: async () => {
      const result = await getDriverTripsUseCase.execute(driverId, params);

      if (!result.success) {
        throw new DriverQueryError(
          result.error.code,
          result.error.message,
          result.error.originalMessage,
        );
      }

      return result.data;
    },
    enabled: !!driverId,
    ...options,
  });
}
