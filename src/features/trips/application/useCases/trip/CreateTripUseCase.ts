/**
 * Create Trip Use Case
 * Clean Architecture - Application Layer
 *
 * PATRÓN ACTUALIZADO:
 * - Input: camelCase (lo que recibe el UseCase)
 * - El apiClient convierte automáticamente a snake_case
 * - NO se necesitan DTOs ni funciones toApi*()
 *
 * Ubicación: src/features/trips/application/useCases/CreateTripUseCase.ts
 */

import type {
  CreateCargoInput,
  CreateCargoMovementInput,
  CreateExpenseInput,
  CreateStopInput,
  CreateTripInput,
  ITripRepository,
  Trip,
} from "@features/trips/domain";
import {
  validateCreateStopHasResolvableLocation,
  validateCreateTripRoute,
} from "@features/trips/domain";
import { mapBackendError, type UseCaseResult } from "@shared/utils/errorMapper";

// ============================================================================
// RESULT TYPE (camelCase - lo que retorna el UseCase)
// ============================================================================

/**
 * Resultado de crear un viaje
 */
export interface CreateTripWarning {
  code: string;
  message: string;
  vehicleId?: string;
  driverId?: string;
  conflictingTripId?: string;
  conflictingTripCode?: string;
}

export interface CreateTripResult {
  trip: Trip;
  summary: {
    tripId: string;
    tripCode: string;
    stopsCreated: number;
    cargosCreated: number;
    expensesCreated: number;
    finalStatus: string;
  };
  warnings?: CreateTripWarning[];
}

// ============================================================================
// USE CASE INTERFACE
// ============================================================================

export interface ICreateTripUseCase {
  execute(input: CreateTripInput): Promise<UseCaseResult<CreateTripResult>>;
}

// ============================================================================
// USE CASE IMPLEMENTATION
// ============================================================================

export class CreateTripUseCase implements ICreateTripUseCase {
  private readonly repository: ITripRepository;

  constructor(repository: ITripRepository) {
    this.repository = repository;
  }

  async execute(
    input: CreateTripInput,
  ): Promise<UseCaseResult<CreateTripResult>> {
    try {
      // ════════════════════════════════════════════════════════════════════
      // VALIDACIONES DE NEGOCIO
      // ════════════════════════════════════════════════════════════════════

      const validationError = this.validate(input);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // ════════════════════════════════════════════════════════════════════
      // LLAMAR AL REPOSITORIO
      // El Input va en camelCase, el apiClient convierte automáticamente
      // ════════════════════════════════════════════════════════════════════

      const result = await this.repository.create(input);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("[CreateTripUseCase] Error:", error);

      return {
        success: false,
        error: mapBackendError(error),
      };
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VALIDACIONES
  // ══════════════════════════════════════════════════════════════════════════

  private validate(
    input: CreateTripInput,
  ): { code: string; message: string } | null {
    // Validar viaje base
    const tripError = this.validateTrip(input);
    if (tripError) return tripError;

    // Validar paradas
    if (input.stops?.length) {
      const stopsError = this.validateStops(input.stops);
      if (stopsError) return stopsError;
    }

    // Validar cargas
    if (input.cargos?.length) {
      const cargosError = this.validateCargos(input.cargos, input.stops);
      if (cargosError) return cargosError;
    }

    // Validar gastos
    if (input.estimatedExpenses?.length) {
      const expensesError = this.validateExpenses(input.estimatedExpenses);
      if (expensesError) return expensesError;
    }

    return null;
  }

  private validateTrip(
    input: CreateTripInput,
  ): { code: string; message: string } | null {
    if (!input.vehicleId) {
      return { code: "VEHICLE_REQUIRED", message: "El vehículo es requerido" };
    }

    if (!input.driverId) {
      return { code: "DRIVER_REQUIRED", message: "El conductor es requerido" };
    }

    if (!input.scheduledDeparture) {
      return {
        code: "DEPARTURE_REQUIRED",
        message: "La fecha de salida es requerida",
      };
    }

    const routeError = validateCreateTripRoute(input);
    if (routeError) return routeError;

    // Validar fecha de salida no sea en el pasado
    const departureDate = new Date(input.scheduledDeparture);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (departureDate < today) {
      return {
        code: "INVALID_DEPARTURE_DATE",
        message: "La fecha de salida no puede ser en el pasado",
      };
    }

    // Validar fecha de llegada posterior a salida
    if (input.scheduledArrival) {
      const arrivalDate = new Date(input.scheduledArrival);
      if (arrivalDate <= departureDate) {
        return {
          code: "INVALID_ARRIVAL_DATE",
          message: "La fecha de llegada debe ser posterior a la de salida",
        };
      }
    }

    // Validar valores numéricos
    if (input.startMileage !== undefined && input.startMileage < 0) {
      return {
        code: "INVALID_MILEAGE",
        message: "El kilometraje inicial no puede ser negativo",
      };
    }

    if (input.baseRate !== undefined && input.baseRate < 0) {
      return {
        code: "INVALID_BASE_RATE",
        message: "La tarifa base no puede ser negativa",
      };
    }

    return null;
  }

  private validateStops(
    stops: CreateStopInput[],
  ): { code: string; message: string } | null {
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];

      if (!stop.stopType || stop.stopType.length === 0) {
        return {
          code: "STOP_TYPE_REQUIRED",
          message: `Parada #${i + 1}: El tipo de parada es requerido`,
        };
      }

      const locationError = validateCreateStopHasResolvableLocation(stop);
      if (locationError) {
        return {
          code: locationError.code,
          message: `Parada #${i + 1}: ${locationError.message}`,
        };
      }
    }

    return null;
  }

  private validateCargos(
    cargos: CreateCargoInput[],
    stops?: CreateStopInput[],
  ): { code: string; message: string } | null {
    const maxStopIndex = stops ? stops.length - 1 : -1;

    for (let i = 0; i < cargos.length; i++) {
      const cargo = cargos[i];

      if (!cargo.clientId) {
        return {
          code: "CARGO_CLIENT_REQUIRED",
          message: `Carga #${i + 1}: El cliente es requerido`,
        };
      }

      if (!cargo.description?.trim()) {
        return {
          code: "CARGO_DESCRIPTION_REQUIRED",
          message: `Carga #${i + 1}: La descripción es requerida`,
        };
      }

      // Validar movimientos
      if (cargo.movements?.length) {
        const movementsError = this.validateCargoMovements(
          cargo.movements,
          cargo.description,
          maxStopIndex,
          cargo.weight,
          cargo.units,
        );
        if (movementsError) return movementsError;
      }
    }

    return null;
  }

  private validateCargoMovements(
    movements: CreateCargoMovementInput[],
    cargoDescription: string,
    maxStopIndex: number,
    cargoWeight?: number,
    cargoUnits?: number,
  ): { code: string; message: string } | null {
    // Debe tener al menos un pickup
    const hasPickup = movements.some((m) => m.movementType === "pickup");
    if (!hasPickup) {
      return {
        code: "CARGO_MISSING_PICKUP",
        message: `Carga "${cargoDescription}": Debe tener al menos un punto de recogida`,
      };
    }

    // Validar índices de paradas
    for (const movement of movements) {
      if (maxStopIndex >= 0 && movement.stopIndex > maxStopIndex) {
        return {
          code: "INVALID_STOP_INDEX",
          message: `Carga "${cargoDescription}": El índice de parada ${movement.stopIndex} no existe`,
        };
      }
    }

    // Validar orden: deliveries después de pickups
    const pickupMovement = movements.find((m) => m.movementType === "pickup");
    const deliveries = movements.filter((m) => m.movementType === "delivery");

    for (const delivery of deliveries) {
      if (pickupMovement && delivery.stopIndex <= pickupMovement.stopIndex) {
        return {
          code: "INVALID_DELIVERY_ORDER",
          message: `Carga "${cargoDescription}": Las entregas deben estar después de la recogida`,
        };
      }
    }

    // Validar peso no exceda
    if (deliveries.length > 0 && cargoWeight && cargoWeight > 0) {
      const totalWeight = deliveries.reduce(
        (sum, d) => sum + (d.weight || 0),
        0,
      );
      if (totalWeight > cargoWeight) {
        return {
          code: "DELIVERY_WEIGHT_EXCEEDS",
          message: `Carga "${cargoDescription}": Peso de entregas (${totalWeight} kg) excede el total (${cargoWeight} kg)`,
        };
      }
    }

    // Validar unidades no excedan
    if (deliveries.length > 0 && cargoUnits && cargoUnits > 0) {
      const totalUnits = deliveries.reduce((sum, d) => sum + (d.units || 0), 0);
      if (totalUnits > cargoUnits) {
        return {
          code: "DELIVERY_UNITS_EXCEEDS",
          message: `Carga "${cargoDescription}": Unidades de entregas (${totalUnits}) exceden el total (${cargoUnits})`,
        };
      }
    }

    return null;
  }

  private validateExpenses(
    expenses: CreateExpenseInput[],
  ): { code: string; message: string } | null {
    const validCategories = [
      "fuel",
      "tolls",
      "driver_allowance",
      "lodging",
      "loading_unloading",
      "parking",
      "maintenance",
      "insurance",
      "permits",
      "other",
    ];

    for (let i = 0; i < expenses.length; i++) {
      const expense = expenses[i];

      if (!expense.category) {
        return {
          code: "EXPENSE_CATEGORY_REQUIRED",
          message: `Gasto #${i + 1}: La categoría es requerida`,
        };
      }

      if (!validCategories.includes(expense.category)) {
        return {
          code: "EXPENSE_INVALID_CATEGORY",
          message: `Gasto #${i + 1}: Categoría inválida "${expense.category}"`,
        };
      }

      if (!expense.description?.trim()) {
        return {
          code: "EXPENSE_DESCRIPTION_REQUIRED",
          message: `Gasto #${i + 1}: La descripción es requerida`,
        };
      }

      if (expense.amount === undefined || expense.amount <= 0) {
        return {
          code: "EXPENSE_INVALID_AMOUNT",
          message: `Gasto "${expense.description}": El monto debe ser mayor a cero`,
        };
      }
    }

    return null;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createCreateTripUseCase(
  repository: ITripRepository,
): ICreateTripUseCase {
  return new CreateTripUseCase(repository);
}
