/**
 * useCreateTrip Hook
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hook para crear un viaje completo usando el endpoint transaccional.
 *
 * Ubicación: src/features/trips/application/hooks/useCreateTrip.ts
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  CreateTripUseCase,
  type CreateTripResult,
} from "@features/trips/application/useCases/trip/CreateTripUseCase";
import { tripRepository } from "@features/trips/infrastructure/repositories/tripRepository";
import { tripQueryKeys, type CreateTripInput } from "@features/trips/domain";

// ============================================================================
// CUSTOM ERROR CLASS
// ============================================================================

/**
 * Error de creación de viaje con información detallada
 */
export class TripCreationError extends Error {
  code: string;
  originalMessage?: string;

  constructor(code: string, message: string, originalMessage?: string) {
    super(message);
    this.name = "TripCreationError";
    this.code = code;
    this.originalMessage = originalMessage;
  }
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para crear un viaje completo con todos sus detalles.
 *
 * Usa POST al recurso de viajes (body completo); el `apiClient` serializa a snake_case.
 * El contrato no incluye `origin_address` / `destination_address` en `trips` (migración 045):
 * resumen de ruta con `originCity` / `destinationCity` y domicilio en `stops[]`.
 *
 * @example
 * ```tsx
 * const createTrip = useCreateTrip();
 *
 * const handleSubmit = async (formData: TripWizardFormValues) => {
 *   try {
 *     const result = await createTrip.mutateAsync({
 *       vehicleId: formData.vehicleId,
 *       driverId: formData.driverId,
 *       scheduledDeparture: localDateTimeToISO(formData.scheduledDeparture),
 *       originCity: formData.stops[0].cityName,
 *       originState: formData.stops[0].satStateCode,
 *       destinationCity: formData.stops.at(-1)?.cityName,
 *       destinationState: formData.stops.at(-1)?.satStateCode,
 *       stops: formData.stops,
 *       cargos: formData.cargos,
 *       estimatedExpenses: formData.expenses,
 *     });
 *
 *     toast({ title: `Viaje ${result.summary.tripCode} creado` });
 *     navigate(`/trips/${result.trip.id}`);
 *   } catch (error) {
 *     if (error instanceof TripCreationError) {
 *       toast({ title: "Error", description: error.message, variant: "error" });
 *     }
 *   }
 * };
 * ```
 */
export function useCreateTrip(
  options?: UseMutationOptions<
    CreateTripResult,
    TripCreationError,
    CreateTripInput
  >,
) {
  const queryClient = useQueryClient();
  const useCase = new CreateTripUseCase(tripRepository);

  return useMutation({
    mutationFn: async (input: CreateTripInput) => {
      const result = await useCase.execute(input);

      if (!result.success) {
        throw new TripCreationError(
          result.error.code,
          result.error.message,
          result.error.originalMessage,
        );
      }

      return result.data;
    },

    onSuccess: (result) => {
      // Invalidar lista de viajes
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });

      // Pre-popular cache del detalle
      queryClient.setQueryData(
        tripQueryKeys.detail(result.trip.id),
        result.trip,
      );
    },

    ...options,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { CreateTripInput, CreateTripResult };
