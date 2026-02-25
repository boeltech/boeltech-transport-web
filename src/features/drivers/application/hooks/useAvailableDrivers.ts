/**
 * Driver Query Hooks
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hooks de React Query para queries específicas de conductores:
 * - useAvailableDrivers: Conductores disponibles para asignación
 * - useDriverTrips: Historial de viajes de un conductor
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { DriverListItem } from "@features/drivers/domain";
import { DriverQueryError, driverQueryKeys } from "@features/drivers/domain";
import { driverRepository } from "@features/drivers/infrastructure/driverRepository";
import { createGetAvailableDriversUseCase } from "../useCases/GetAvailableDriversUseCase";

// ============================================================================
// USE AVAILABLE DRIVERS
// ============================================================================

/**
 * Hook para obtener conductores disponibles
 *
 * Ideal para:
 * - Selectores en formularios de creación de viajes
 * - Listas de asignación rápida
 * - Dropdowns de conductores
 *
 * @example
 * ```tsx
 * function DriverSelect({ value, onChange }) {
 *   const { data: drivers, isLoading } = useAvailableDrivers();
 *
 *   return (
 *     <Select value={value} onValueChange={onChange} disabled={isLoading}>
 *       {drivers?.map(driver => (
 *         <SelectItem key={driver.id} value={driver.id}>
 *           {driver.fullName} - {driver.licenseType}
 *         </SelectItem>
 *       ))}
 *     </Select>
 *   );
 * }
 * ```
 */
export function useAvailableDrivers(
  options?: Omit<
    UseQueryOptions<DriverListItem[], DriverQueryError>,
    "queryKey" | "queryFn"
  >,
) {
  const getAvailableUseCase =
    createGetAvailableDriversUseCase(driverRepository);

  return useQuery({
    queryKey: driverQueryKeys.available(),
    queryFn: async () => {
      const result = await getAvailableUseCase.execute();

      if (!result.success) {
        throw new DriverQueryError(
          result.error.code,
          result.error.message,
          result.error.originalMessage,
        );
      }

      return result.data;
    },
    // Los conductores disponibles pueden cambiar frecuentemente
    staleTime: 30 * 1000, // 30 segundos
    ...options,
  });
}
