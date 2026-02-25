/**
 * Cargo Use Cases
 * Clean Architecture - Application Layer
 *
 * Casos de uso para operaciones de cargas.
 * Enfoque B: Operaciones separadas del viaje principal.
 */

import type {
  TripCargo,
  CargoMovement,
  CargoMovementTypeValue,
} from "@features/trips/domain/entities";
import type {
  ICargoRepository,
  CreateCargoDTO,
  UpdateCargoDTO,
  CreateCargoMovementDTO,
  CompleteCargoMovementDTO,
} from "@features/trips/domain";
import {
  mapBackendError,
  type MappedError,
  type UseCaseResult,
} from "@shared/utils/errorMapper";

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Input para crear un movimiento de carga
 */
export interface CreateCargoMovementInput {
  stopId: string;
  stopIndex: number;
  movementType: CargoMovementTypeValue;
  weight?: number;
  units?: number;
  notes?: string;
}

/**
 * Input para crear una carga
 */
export interface CreateCargoInput {
  clientId: string;
  description: string;
  productType?: string;
  weight?: number;
  volume?: number;
  units?: number;
  declaredValue?: number;
  rate: number;
  currency?: string;
  pickupStopId?: string;
  deliveryStopId?: string;
  notes?: string;
  specialInstructions?: string;
  movements?: CreateCargoMovementInput[];
  // Carta Porte
  satProductCode?: string;
  satUnitCode?: string;
  satUnitName?: string;
  weightInKg?: number;
  dimensions?: string;
  hazardousMaterial?: boolean;
  hazardousMaterialCode?: string;
  packagingType?: string;
  packagingDescription?: string;
}

/**
 * Input para actualizar una carga
 */
export interface UpdateCargoInput {
  description?: string;
  productType?: string | null;
  weight?: number | null;
  volume?: number | null;
  units?: number | null;
  declaredValue?: number | null;
  rate?: number;
  currency?: string;
  notes?: string | null;
  specialInstructions?: string | null;
}

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

      // Mapear input a DTO
      const dto = this.mapInputToDTO(input);

      const result = await this.repository.create(tripId, dto);

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

    if (input.rate === undefined || input.rate < 0) {
      return {
        code: "INVALID_RATE",
        message: "La tarifa debe ser un valor positivo",
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

  private mapInputToDTO(input: CreateCargoInput): CreateCargoDTO {
    return {
      clientId: input.clientId,
      description: input.description,
      productType: input.productType,
      weight: input.weight,
      volume: input.volume,
      units: input.units,
      declaredValue: input.declaredValue,
      rate: input.rate,
      currency: input.currency,
      pickupStopId: input.pickupStopId,
      deliveryStopId: input.deliveryStopId,
      notes: input.notes,
      specialInstructions: input.specialInstructions,
      movements: input.movements?.map((m) => ({
        stopId: m.stopId,
        stopIndex: m.stopIndex,
        movementType: m.movementType,
        weight: m.weight,
        units: m.units,
        notes: m.notes,
      })),
      // Carta Porte
      satProductCode: input.satProductCode,
      satUnitCode: input.satUnitCode,
      satUnitName: input.satUnitName,
      weightInKg: input.weightInKg,
      dimensions: input.dimensions,
      hazardousMaterial: input.hazardousMaterial,
      hazardousMaterialCode: input.hazardousMaterialCode,
      packagingType: input.packagingType,
      packagingDescription: input.packagingDescription,
    };
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
      const dto: UpdateCargoDTO = {
        description: input.description,
        productType: input.productType,
        weight: input.weight,
        volume: input.volume,
        units: input.units,
        declaredValue: input.declaredValue,
        rate: input.rate,
        currency: input.currency,
        notes: input.notes,
        specialInstructions: input.specialInstructions,
      };

      const result = await this.repository.update(tripId, cargoId, dto);

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
      const dto: CreateCargoMovementDTO = {
        stopId: input.stopId,
        stopIndex: input.stopIndex,
        movementType: input.movementType,
        weight: input.weight,
        units: input.units,
        notes: input.notes,
      };

      const result = await this.repository.addMovement(tripId, cargoId, dto);

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
      const dto: CompleteCargoMovementDTO | undefined = completedAt
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
