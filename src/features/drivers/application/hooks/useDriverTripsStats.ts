/**
 * Driver Query Hooks
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hooks de React Query para queries específicas de conductores:
 * - useAvailableDrivers: Conductores disponibles para asignación
 * - useDriverTrips: Historial de viajes de un conductor
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { DriverQueryError, driverQueryKeys } from "@features/drivers/domain";
import { driverRepository } from "@features/drivers/infrastructure/driverRepository";
import { createGetDriverTripsUseCase } from "../index";

// ============================================================================
// HELPER: GET DRIVER TRIPS STATS
// ============================================================================

/**
 * Hook que calcula estadísticas a partir de los viajes del conductor
 *
 * @example
 * ```tsx
 * function DriverStats({ driverId }) {
 *   const { data: stats, isLoading } = useDriverTripsStats(driverId);
 *
 *   return (
 *     <StatsGrid>
 *       <Stat label="Total viajes" value={stats?.totalTrips} />
 *       <Stat label="Viajes completados" value={stats?.completedTrips} />
 *       <Stat label="Km recorridos" value={stats?.totalKm} />
 *     </StatsGrid>
 *   );
 * }
 * ```
 */
export function useDriverTripsStats(
  driverId: string,
  options?: Omit<
    UseQueryOptions<
      {
        totalTrips: number;
        completedTrips: number;
        cancelledTrips: number;
        inProgressTrips: number;
        totalDistance: number | null;
        totalRevenue: number;
      },
      DriverQueryError
    >,
    "queryKey" | "queryFn"
  >,
) {
  const getDriverTripsUseCase = createGetDriverTripsUseCase(driverRepository);

  return useQuery({
    queryKey: [...driverQueryKeys.trips(driverId), "stats"],
    queryFn: async () => {
      // Obtener todos los viajes (límite alto para estadísticas)
      const result = await getDriverTripsUseCase.execute(driverId, {
        page: 1,
        limit: 1000, // Obtener todos para calcular stats
      });

      if (!result.success) {
        throw new DriverQueryError(
          result.error.code,
          result.error.message,
          result.error.originalMessage,
        );
      }

      const trips = result.data.data;

      // Calcular estadísticas
      const stats = {
        totalTrips: trips.length,
        completedTrips: trips.filter((t) => t.status === "completed").length,
        cancelledTrips: trips.filter((t) => t.status === "cancelled").length,
        inProgressTrips: trips.filter((t) => t.status === "in_progress").length,
        totalDistance:
          trips.reduce((sum, t) => sum + (t.distance ?? 0), 0) || null,
        totalRevenue: trips.reduce((sum, t) => sum + (t.totalCost ?? 0), 0),
      };

      return stats;
    },
    enabled: !!driverId,
    staleTime: 5 * 60 * 1000, // 5 minutos - las stats no cambian tan frecuentemente
    ...options,
  });
}
