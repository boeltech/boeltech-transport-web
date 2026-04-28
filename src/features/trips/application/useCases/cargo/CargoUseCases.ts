/**
 * Cargo Use Cases
 * Clean Architecture - Application Layer
 *
 * Casos de uso para operaciones de cargas.
 * Enfoque B: Operaciones separadas del viaje principal.
 */

import type {
  CargoMovement,
  CompleteCargoMovementInput,
  CreateCargoInput,
  CreateCargoMovementInput,
  ICargoRepository,
  TripCargo,
  UpdateCargoInput,
} from "@features/trips/domain";
import {
  mapBackendError,
  type MappedError,
  type UseCaseResult,
} from "@shared/utils/errorMapper";

// ============================================================================
// GET CARGOS USE CASE
// ============================================================================

export interface IGetCargosUseCase {
  execute(tripId: string): Promise<UseCaseResult<TripCargo[]>>;
}

export class GetCargosUseCase implements IGetCargosUseCase {
  private readonly repository: ICargoRepository;

  constructor(repository: ICargoRepository) {
    this.repository = repository;
  }

  async execute(tripId: string): Promise<UseCaseResult<TripCargo[]>> {
    try {
      const result = await this.repository.findByTripId(tripId);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: mapBackendError(error),
      };
    }
  }
}

// ============================================================================
// ADD CARGO USE CASE
// ============================================================================

export interface IAddCargoUseCase {
  execute(
    tripId: string,
    input: CreateCargoInput,
  ): Promise<UseCaseResult<TripCargo>>;
}

export class AddCargoUseCase implements IAddCargoUseCase {
  private readonly repository: ICargoRepository;

  constructor(repository: ICargoRepository) {
    this.repository = repository;
  }

  async execute(
    tripId: string,
    input: CreateCargoInput,
  ): Promise<UseCaseResult<TripCargo>> {
    try {
      // Validaciones de negocio
      const validationError = this.validateInput(input);
      if (validationError) {
        return { success: false, error: validationError };
      }

      const result = await this.repository.create(tripId, input);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: mapBackendError(error),
      };
    }
  }

  private validateInput(input: CreateCargoInput): MappedError | null {
    if (!input.clientId) {
      return {
        code: "CLIENT_REQUIRED",
        message: "El cliente es requerido para la carga",
      };
    }

    if (!input.description?.trim()) {
      return {
        code: "DESCRIPTION_REQUIRED",
        message: "La descripción de la carga es requerida",
      };
    }

    // Validar movimientos si se proporcionan
    if (input.movements && input.movements.length > 0) {
      const hasPickup = input.movements.some(
        (m) => m.movementType === "pickup",
      );
      if (!hasPickup) {
        return {
          code: "MISSING_PICKUP",
          message: "La carga debe tener al menos un punto de recogida (pickup)",
        };
      }

      // Validar que entregas estén después del pickup
      const pickupIndex = input.movements.find(
        (m) => m.movementType === "pickup",
      )?.stopIndex;

      const invalidDelivery = input.movements.find(
        (m) =>
          m.movementType === "delivery" &&
          pickupIndex !== undefined &&
          m.stopIndex <= pickupIndex,
      );

      if (invalidDelivery) {
        return {
          code: "INVALID_DELIVERY_ORDER",
          message:
            "Los puntos de entrega deben estar después del punto de recogida",
        };
      }
    }

    return null;
  }
}

// ============================================================================
// UPDATE CARGO USE CASE
// ============================================================================

export interface IUpdateCargoUseCase {
  execute(
    tripId: string,
    cargoId: string,
    input: UpdateCargoInput,
  ): Promise<UseCaseResult<TripCargo>>;
}

export class UpdateCargoUseCase implements IUpdateCargoUseCase {
  private readonly repository: ICargoRepository;

  constructor(repository: ICargoRepository) {
    this.repository = repository;
  }

  async execute(
    tripId: string,
    cargoId: string,
    input: UpdateCargoInput,
  ): Promise<UseCaseResult<TripCargo>> {
    try {
      // const dto: UpdateCargoDT = {
      //   description: input.description,
      //   productType: input.productType,
      //   weight: input.weight,
      //   volume: input.volume,
      //   units: input.units,
      //   declaredValue: input.declaredValue,
      //   rate: input.rate,
      //   currency: input.currency,
      //   notes: input.notes,
      //   specialInstructions: input.specialInstructions,
      // };

      const result = await this.repository.update(tripId, cargoId, input);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: mapBackendError(error),
      };
    }
  }
}

// ============================================================================
// DELETE CARGO USE CASE
// ============================================================================

export interface IDeleteCargoUseCase {
  execute(tripId: string, cargoId: string): Promise<UseCaseResult<void>>;
}

export class DeleteCargoUseCase implements IDeleteCargoUseCase {
  private readonly repository: ICargoRepository;

  constructor(repository: ICargoRepository) {
    this.repository = repository;
  }

  async execute(tripId: string, cargoId: string): Promise<UseCaseResult<void>> {
    try {
      await this.repository.delete(tripId, cargoId);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: mapBackendError(error),
      };
    }
  }
}

// ============================================================================
// ADD CARGO MOVEMENT USE CASE
// ============================================================================

export interface IAddCargoMovementUseCase {
  execute(
    tripId: string,
    cargoId: string,
    input: CreateCargoMovementInput,
  ): Promise<UseCaseResult<CargoMovement>>;
}

export class AddCargoMovementUseCase implements IAddCargoMovementUseCase {
  private readonly repository: ICargoRepository;

  constructor(repository: ICargoRepository) {
    this.repository = repository;
  }

  async execute(
    tripId: string,
    cargoId: string,
    input: CreateCargoMovementInput,
  ): Promise<UseCaseResult<CargoMovement>> {
    try {
      const result = await this.repository.addMovement(tripId, cargoId, input);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: mapBackendError(error),
      };
    }
  }
}

// ============================================================================
// COMPLETE CARGO MOVEMENT USE CASE
// ============================================================================

export interface ICompleteCargoMovementUseCase {
  execute(
    tripId: string,
    cargoId: string,
    movementId: string,
    completedAt?: string,
  ): Promise<UseCaseResult<CargoMovement>>;
}

export class CompleteCargoMovementUseCase implements ICompleteCargoMovementUseCase {
  private readonly repository: ICargoRepository;

  constructor(repository: ICargoRepository) {
    this.repository = repository;
  }

  async execute(
    tripId: string,
    cargoId: string,
    movementId: string,
    completedAt?: string,
  ): Promise<UseCaseResult<CargoMovement>> {
    try {
      const dto: CompleteCargoMovementInput | undefined = completedAt
        ? { completedAt }
        : undefined;

      const result = await this.repository.completeMovement(
        tripId,
        cargoId,
        movementId,
        dto,
      );

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: mapBackendError(error),
      };
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createGetCargosUseCase(
  repository: ICargoRepository,
): IGetCargosUseCase {
  return new GetCargosUseCase(repository);
}

export function createAddCargoUseCase(
  repository: ICargoRepository,
): IAddCargoUseCase {
  return new AddCargoUseCase(repository);
}

export function createUpdateCargoUseCase(
  repository: ICargoRepository,
): IUpdateCargoUseCase {
  return new UpdateCargoUseCase(repository);
}

export function createDeleteCargoUseCase(
  repository: ICargoRepository,
): IDeleteCargoUseCase {
  return new DeleteCargoUseCase(repository);
}

export function createAddCargoMovementUseCase(
  repository: ICargoRepository,
): IAddCargoMovementUseCase {
  return new AddCargoMovementUseCase(repository);
}

export function createCompleteCargoMovementUseCase(
  repository: ICargoRepository,
): ICompleteCargoMovementUseCase {
  return new CompleteCargoMovementUseCase(repository);
}
