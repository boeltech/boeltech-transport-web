/**
 * Cargo Hooks
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hooks de React Query para operaciones de cargas.
 * Sigue el patrón: Hook → UseCase → Repository
 *
 * Importante: no poner `...options` después de `onSuccess` — el caller
 * (toast) sobrescribiría la invalidación de cache.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { cargoRepository } from "@features/trips/infrastructure";
import {
  createGetCargosUseCase,
  createAddCargoUseCase,
  createUpdateCargoUseCase,
  createDeleteCargoUseCase,
  createAddCargoMovementUseCase,
  createCompleteCargoMovementUseCase,
} from "../../useCases/cargo/CargoUseCases";
import {
  tripQueryKeys,
  type CargoMovement,
  type CreateCargoInput,
  type CreateCargoMovementInput,
  type TripCargo,
  type UpdateCargoInput,
} from "@features/trips/domain";

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

function splitMutationOptions<TData, TError, TVariables, TContext = unknown>(
  options?: UseMutationOptions<TData, TError, TVariables, TContext>,
) {
  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    onSettled: userOnSettled,
    ...rest
  } = options ?? {};
  return { userOnSuccess, userOnError, userOnSettled, rest };
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
  const { userOnSuccess, userOnError, userOnSettled, rest } =
    splitMutationOptions(options);

  return useMutation({
    ...rest,
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
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.cargos(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      await userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
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
  const { userOnSuccess, userOnError, userOnSettled, rest } =
    splitMutationOptions(options);

  return useMutation({
    ...rest,
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
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.cargos(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      await userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
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
  const { userOnSuccess, userOnError, userOnSettled, rest } =
    splitMutationOptions(options);

  return useMutation({
    ...rest,
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
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.cargos(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      await userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
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
  const { userOnSuccess, userOnError, userOnSettled, rest } =
    splitMutationOptions(options);

  return useMutation({
    ...rest,
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
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.cargos(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      await userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}

/**
 * Hook para completar un movimiento de cualquier carga del viaje.
 */
export function useCompleteTripCargoMovement(
  tripId: string,
  options?: UseMutationOptions<
    CargoMovement,
    CargoError,
    { cargoId: string; movementId: string; completedAt?: string }
  >,
) {
  const queryClient = useQueryClient();
  const completeMovementUseCase =
    createCompleteCargoMovementUseCase(cargoRepository);
  const { userOnSuccess, userOnError, userOnSettled, rest } =
    splitMutationOptions(options);

  return useMutation({
    ...rest,
    mutationFn: async ({
      cargoId,
      movementId,
      completedAt,
    }: {
      cargoId: string;
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
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.cargos(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.timeline(tripId),
      });
      await userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
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
  const { userOnSuccess, userOnError, userOnSettled, rest } =
    splitMutationOptions(options);

  return useMutation({
    ...rest,
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
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.cargos(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      await userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
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
  const { userOnSuccess, userOnError, userOnSettled, rest } =
    splitMutationOptions(options);

  return useMutation({
    ...rest,
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
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.cargos(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      await userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}
