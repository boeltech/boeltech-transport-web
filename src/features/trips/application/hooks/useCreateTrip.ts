// src/features/trips/application/hooks/useCreateTrip.ts

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  createCreateTripUseCase,
  type CreateTripInput,
} from "@features/trips/application";
import { createTripRepository } from "@features/trips/infrastructure";
import { tripQueryKeys } from "@features/trips/domain/entities";
import type { CreateTripResponse } from "../useCases/trips";

// ============================================================================
// REPOSITORY INSTANCES
// ============================================================================

const tripRepository = createTripRepository();

// ============================================================================
// CUSTOM ERROR CLASS
// ============================================================================

/**
 * Error personalizado que preserva el código y mensaje mapeado del backend
 */
export class TripError extends Error {
  code: string;
  originalMessage?: string;

  constructor(code: string, message: string, originalMessage?: string) {
    super(message); // Este es el mensaje en español que se mostrará
    this.name = "TripError";
    this.code = code;
    this.originalMessage = originalMessage;
  }
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para crear viaje
 *
 * El error que se lanza contiene:
 * - error.message: Mensaje en español (mapeado) - USAR ESTE PARA MOSTRAR AL USUARIO
 * - error.code: Código del error del backend
 * - error.originalMessage: Mensaje original del backend (en inglés)
 */
export function useCreateTrip(
  options?: UseMutationOptions<CreateTripResponse, TripError, CreateTripInput>,
) {
  const queryClient = useQueryClient();
  const createTripUseCase = createCreateTripUseCase(tripRepository);

  return useMutation({
    mutationFn: async (input: CreateTripInput) => {
      const result = await createTripUseCase.execute(input);

      if (!result.success) {
        // Lanzar error con el mensaje EN ESPAÑOL (result.error.message)
        // El mensaje mapeado está en result.error.message
        // El mensaje original del backend está en result.error.originalMessage
        throw new TripError(
          result.error.code,
          result.error.message, // ← Mensaje en español (mapeado)
          result.error.originalMessage, // ← Mensaje original (inglés)
        );
      }

      return result.data;
    },
    onSuccess: (newTrip) => {
      // Invalidar lista de viajes para refrescar
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      // Opcional: pre-popular el cache del detalle
      queryClient.setQueryData(tripQueryKeys.detail(newTrip.id), newTrip);
    },
    ...options,
  });
}
