/**
 * Cargo Hooks
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hooks de React Query para operaciones de cargas.
 * Sigue el patrón: Hook → UseCase → Repository
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type {
  TripCargo,
  CargoMovement,
} from "@features/trips/domain/entities/entities";
import { tripQueryKeys } from "@features/trips/domain/entities/entities";
import {
  cargoRepository,
  // createCargoRepository,
} from "@features/trips/infrastructure";
import {
  createGetCargosUseCase,
  createAddCargoUseCase,
  createUpdateCargoUseCase,
  createDeleteCargoUseCase,
  createAddCargoMovementUseCase,
  createCompleteCargoMovementUseCase,
  type CreateCargoInput,
  type UpdateCargoInput,
  type CreateCargoMovementInput,
} from "../../useCases/cargo/CargoUseCases";
// import { mapBackendError, type MappedError } from "@shared/utils/errorMapper";

// ============================================================================
// ERROR CLASS
// ============================================================================

export class CargoError extends Error {
  code: string;
  originalMessage?: string;

  constructor(code: string, message: string, originalMessage?: string) {
    super(message);
    this.name = "CargoError";
    this.code = code;
    this.originalMessage = originalMessage;
  }
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook para obtener las cargas de un viaje
 */
export function useTripCargos(
  tripId: string,
  options?: Omit<
    UseQueryOptions<TripCargo[], CargoError>,
    "queryKey" | "queryFn"
  >,
) {
  const getCargosUseCase = createGetCargosUseCase(cargoRepository);

  return useQuery({
    queryKey: tripQueryKeys.cargos(tripId),
    queryFn: async () => {
      const result = await getCargosUseCase.execute(tripId);

      if (!result.success) {
        throw new CargoError(result.error.code, result.error.message);
      }

      return result.data;
    },
    enabled: !!tripId,
    ...options,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook para agregar una carga a un viaje
 */
export function useAddCargo(
  tripId: string,
  options?: UseMutationOptions<TripCargo, CargoError, CreateCargoInput>,
) {
  const queryClient = useQueryClient();
  const addCargoUseCase = createAddCargoUseCase(cargoRepository);

  return useMutation({
    mutationFn: async (input: CreateCargoInput) => {
      const result = await addCargoUseCase.execute(tripId, input);

      if (!result.success) {
        throw new CargoError(
          result.error.code,
          result.error.message,
          result.error.originalMessage,
        );
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidar cache de cargas del viaje
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.cargos(tripId) });
      // Invalidar detalle del viaje (puede incluir cargas)
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) });
    },
    ...options,
  });
}

/**
 * Hook para actualizar una carga
 */
export function useUpdateCargo(
  tripId: string,
  options?: UseMutationOptions<
    TripCargo,
    CargoError,
    { cargoId: string; data: UpdateCargoInput }
  >,
) {
  const queryClient = useQueryClient();
  const updateCargoUseCase = createUpdateCargoUseCase(cargoRepository);

  return useMutation({
    mutationFn: async ({
      cargoId,
      data,
    }: {
      cargoId: string;
      data: UpdateCargoInput;
    }) => {
      const result = await updateCargoUseCase.execute(tripId, cargoId, data);

      if (!result.success) {
        throw new CargoError(
          result.error.code,
          result.error.message,
          result.error.originalMessage,
        );
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.cargos(tripId) });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) });
    },
    ...options,
  });
}

/**
 * Hook para eliminar una carga
 */
export function useDeleteCargo(
  tripId: string,
  options?: UseMutationOptions<void, CargoError, string>,
) {
  const queryClient = useQueryClient();
  const deleteCargoUseCase = createDeleteCargoUseCase(cargoRepository);

  return useMutation({
    mutationFn: async (cargoId: string) => {
      const result = await deleteCargoUseCase.execute(tripId, cargoId);

      if (!result.success) {
        throw new CargoError(
          result.error.code,
          result.error.message,
          result.error.originalMessage,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.cargos(tripId) });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) });
    },
    ...options,
  });
}

/**
 * Hook para agregar un movimiento a una carga
 */
export function useAddCargoMovement(
  tripId: string,
  cargoId: string,
  options?: UseMutationOptions<
    CargoMovement,
    CargoError,
    CreateCargoMovementInput
  >,
) {
  const queryClient = useQueryClient();
  const addMovementUseCase = createAddCargoMovementUseCase(cargoRepository);

  return useMutation({
    mutationFn: async (input: CreateCargoMovementInput) => {
      const result = await addMovementUseCase.execute(tripId, cargoId, input);

      if (!result.success) {
        throw new CargoError(
          result.error.code,
          result.error.message,
          result.error.originalMessage,
        );
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.cargos(tripId) });
    },
    ...options,
  });
}

/**
 * Hook para completar un movimiento de carga
 */
export function useCompleteCargoMovement(
  tripId: string,
  cargoId: string,
  options?: UseMutationOptions<
    CargoMovement,
    CargoError,
    { movementId: string; completedAt?: string }
  >,
) {
  const queryClient = useQueryClient();
  const completeMovementUseCase =
    createCompleteCargoMovementUseCase(cargoRepository);

  return useMutation({
    mutationFn: async ({
      movementId,
      completedAt,
    }: {
      movementId: string;
      completedAt?: string;
    }) => {
      const result = await completeMovementUseCase.execute(
        tripId,
        cargoId,
        movementId,
        completedAt,
      );

      if (!result.success) {
        throw new CargoError(
          result.error.code,
          result.error.message,
          result.error.originalMessage,
        );
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.cargos(tripId) });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) });
    },
    ...options,
  });
}

// ============================================================================
// BULK OPERATIONS HOOK
// ============================================================================

/**
 * Hook para agregar múltiples cargas a un viaje
 * Útil para la creación inicial del viaje
 */
export function useAddMultipleCargos(
  tripId: string,
  options?: UseMutationOptions<TripCargo[], CargoError, CreateCargoInput[]>,
) {
  const queryClient = useQueryClient();
  const addCargoUseCase = createAddCargoUseCase(cargoRepository);

  return useMutation({
    mutationFn: async (cargos: CreateCargoInput[]) => {
      const results: TripCargo[] = [];

      for (const cargo of cargos) {
        const result = await addCargoUseCase.execute(tripId, cargo);

        if (!result.success) {
          throw new CargoError(
            result.error.code,
            `Error agregando carga "${cargo.description}": ${result.error.message}`,
            result.error.originalMessage,
          );
        }

        results.push(result.data);
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.cargos(tripId) });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) });
    },
    ...options,
  });
}
