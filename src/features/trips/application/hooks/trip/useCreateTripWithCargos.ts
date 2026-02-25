/**
 * Create Trip With Cargos Hook
 * Clean Architecture - Application Layer (Orchestration)
 *
 * Hook de orquestación que implementa el Enfoque B:
 * 1. Crear viaje base + paradas
 * 2. Agregar cargas (POST separados)
 * 3. Agregar gastos estimados (POST separados)
 * 4. Opcionalmente cambiar estado
 *
 * Este hook coordina múltiples llamadas API en secuencia.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  tripQueryKeys,
  type TripStatusType,
} from "@features/trips/domain/entities";
import { createTripRepository } from "@features/trips/infrastructure/repositories/tripRepository";
import {
  cargoRepository,
  expenseRepository,
} from "@features/trips/infrastructure";
import {
  createCreateTripUseCase,
  type CreateTripInput,
} from "../../useCases/trip/CreateTripUseCase";
import {
  createAddCargoUseCase,
  type CreateCargoInput,
} from "../../useCases/cargo/CargoUseCases";
import {
  createAddExpenseUseCase,
  type CreateExpenseInput,
} from "../../useCases/expense/ExpenseUseCases";
import { mapBackendError } from "@shared/utils/errorMapper";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Error de orquestación con información del paso que falló
 */
export class TripOrchestrationError extends Error {
  code: string;
  step: "trip" | "cargos" | "expenses" | "status";
  tripId?: string; // ID del viaje si se creó
  originalMessage?: string;

  constructor(
    code: string,
    message: string,
    step: "trip" | "cargos" | "expenses" | "status",
    tripId?: string,
    originalMessage?: string,
  ) {
    super(message);
    this.name = "TripOrchestrationError";
    this.code = code;
    this.step = step;
    this.tripId = tripId;
    this.originalMessage = originalMessage;
  }
}

/**
 * Input para crear un viaje completo con cargas y gastos
 */
export interface CreateTripWithCargosInput {
  // Datos del viaje
  trip: Omit<CreateTripInput, "cargos" | "expenses">;

  // Cargas a agregar después de crear el viaje
  cargos?: CreateCargoInput[];

  // Gastos estimados a agregar
  estimatedExpenses?: CreateExpenseInput[];

  // Opciones de comportamiento
  options?: {
    /** Si true, programa el viaje después de crearlo */
    scheduleAfterCreate?: boolean;
    /** Si true, inicia el viaje inmediatamente */
    startImmediately?: boolean;
    /** Kilometraje inicial (requerido si startImmediately = true) */
    startMileage?: number;
  };
}

/**
 * Resultado de la creación del viaje
 */
export interface CreateTripWithCargosResult {
  tripId: string;
  tripCode: string;
  cargosCreated: number;
  expensesCreated: number;
  finalStatus: TripStatusType;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para crear un viaje completo con cargas y gastos
 *
 * Implementa la orquestación del Enfoque B:
 * 1. POST /api/v1/trips → Crear viaje + paradas
 * 2. POST /api/v1/trips/:id/cargos × N → Agregar cargas
 * 3. POST /api/v1/trips/:id/expenses × N → Agregar gastos estimados
 * 4. PATCH /api/v1/trips/:id/status → Cambiar estado (opcional)
 *
 * Si algún paso falla después de crear el viaje, el viaje queda en "draft"
 * y puede completarse manualmente después.
 */
export function useCreateTripWithCargos() {
  const queryClient = useQueryClient();

  // Repositorios e instancias de use cases
  const tripRepository = createTripRepository();
  const createTripUseCase = createCreateTripUseCase(tripRepository);
  const addCargoUseCase = createAddCargoUseCase(cargoRepository);
  const addExpenseUseCase = createAddExpenseUseCase(expenseRepository);

  return useMutation<
    CreateTripWithCargosResult,
    TripOrchestrationError,
    CreateTripWithCargosInput
  >({
    mutationFn: async (input: CreateTripWithCargosInput) => {
      let tripId: string | undefined;
      let tripCode: string | undefined;

      // ════════════════════════════════════════════════════════════════════
      // PASO 1: Crear viaje base con paradas
      // ════════════════════════════════════════════════════════════════════
      try {
        const tripResult = await createTripUseCase.execute(input.trip);

        if (!tripResult.success) {
          throw new TripOrchestrationError(
            tripResult.error.code,
            tripResult.error.message,
            "trip",
            undefined,
            tripResult.error.originalMessage,
          );
        }

        tripId = tripResult.data.id;
        tripCode = tripResult.data.tripCode;
      } catch (error) {
        if (error instanceof TripOrchestrationError) {
          throw error;
        }

        const mapped = mapBackendError(error);
        throw new TripOrchestrationError(
          mapped.code,
          mapped.message,
          "trip",
          undefined,
          mapped.originalMessage,
        );
      }

      // ════════════════════════════════════════════════════════════════════
      // PASO 2: Agregar cargas (si las hay)
      // ════════════════════════════════════════════════════════════════════
      let cargosCreated = 0;

      if (input.cargos && input.cargos.length > 0) {
        for (const cargo of input.cargos) {
          try {
            const cargoResult = await addCargoUseCase.execute(tripId, cargo);

            if (!cargoResult.success) {
              // Log el error pero continuar con las demás cargas
              console.warn(
                `[CreateTripWithCargos] Error agregando carga "${cargo.description}":`,
                cargoResult.error,
              );

              // Si queremos fallar en el primer error de carga:
              throw new TripOrchestrationError(
                cargoResult.error.code,
                `Error agregando carga "${cargo.description}": ${cargoResult.error.message}`,
                "cargos",
                tripId,
                cargoResult.error.originalMessage,
              );
            }

            cargosCreated++;
          } catch (error) {
            if (error instanceof TripOrchestrationError) {
              throw error;
            }

            const mapped = mapBackendError(error);
            throw new TripOrchestrationError(
              mapped.code,
              `Error agregando carga "${cargo.description}": ${mapped.message}`,
              "cargos",
              tripId,
              mapped.originalMessage,
            );
          }
        }
      }

      // ════════════════════════════════════════════════════════════════════
      // PASO 3: Agregar gastos estimados (si los hay)
      // ════════════════════════════════════════════════════════════════════
      let expensesCreated = 0;

      if (input.estimatedExpenses && input.estimatedExpenses.length > 0) {
        for (const expense of input.estimatedExpenses) {
          try {
            // Asegurar que se marca como estimado
            const expenseWithFlag = {
              ...expense,
              isEstimated: true,
            };

            const expenseResult = await addExpenseUseCase.execute(
              tripId,
              expenseWithFlag,
            );

            if (!expenseResult.success) {
              console.warn(
                `[CreateTripWithCargos] Error agregando gasto "${expense.description}":`,
                expenseResult.error,
              );

              throw new TripOrchestrationError(
                expenseResult.error.code,
                `Error agregando gasto "${expense.description}": ${expenseResult.error.message}`,
                "expenses",
                tripId,
                expenseResult.error.originalMessage,
              );
            }

            expensesCreated++;
          } catch (error) {
            if (error instanceof TripOrchestrationError) {
              throw error;
            }

            const mapped = mapBackendError(error);
            throw new TripOrchestrationError(
              mapped.code,
              `Error agregando gasto "${expense.description}": ${mapped.message}`,
              "expenses",
              tripId,
              mapped.originalMessage,
            );
          }
        }
      }

      // ════════════════════════════════════════════════════════════════════
      // PASO 4: Cambiar estado (opcional)
      // ════════════════════════════════════════════════════════════════════
      let finalStatus: TripStatusType = "draft";

      if (
        input.options?.scheduleAfterCreate ||
        input.options?.startImmediately
      ) {
        try {
          const newStatus = input.options.startImmediately
            ? "in_progress"
            : "scheduled";

          const statusData: { status: TripStatusType; mileage?: number } = {
            status: newStatus as TripStatusType,
          };

          if (input.options.startImmediately && input.options.startMileage) {
            statusData.mileage = input.options.startMileage;
          }

          const statusResult = await tripRepository.updateStatus(
            tripId,
            statusData,
          );

          finalStatus = statusResult.data?.status || newStatus;
        } catch (error) {
          // El viaje se creó, solo falló el cambio de estado
          // No lanzamos error, solo advertimos
          console.warn(
            "[CreateTripWithCargos] Error cambiando estado del viaje:",
            error,
          );

          // Si queremos ser estrictos y fallar:
          // const mapped = mapBackendError(error);
          // throw new TripOrchestrationError(
          //   mapped.code,
          //   `Viaje creado pero error al cambiar estado: ${mapped.message}`,
          //   "status",
          //   tripId,
          //   mapped.originalMessage,
          // );
        }
      }

      return {
        tripId,
        tripCode: tripCode || "",
        cargosCreated,
        expensesCreated,
        finalStatus,
      };
    },

    onSuccess: (result) => {
      // Invalidar todas las queries relacionadas con viajes
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(result.tripId),
      });
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.cargos(result.tripId),
      });
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.expenses(result.tripId),
      });
    },
  });
}

// ============================================================================
// HELPER HOOK: Solo viaje básico (sin orquestación)
// ============================================================================

/**
 * Hook simple para crear solo el viaje base
 * Útil cuando se quiere control granular sobre cada paso
 */
export function useCreateTripBase() {
  const queryClient = useQueryClient();
  const tripRepository = createTripRepository();
  const createTripUseCase = createCreateTripUseCase(tripRepository);

  return useMutation({
    mutationFn: async (input: CreateTripInput) => {
      const result = await createTripUseCase.execute(input);

      if (!result.success) {
        throw new TripOrchestrationError(
          result.error.code,
          result.error.message,
          "trip",
          undefined,
          result.error.originalMessage,
        );
      }

      return result.data;
    },
    onSuccess: (newTrip) => {
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      queryClient.setQueryData(tripQueryKeys.detail(newTrip.id), newTrip);
    },
  });
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export type { CreateTripInput };
export type { CreateCargoInput };
export type { CreateExpenseInput };
