/**
 * Create Trip Use Case
 * Clean Architecture - Application Layer
 *
 * ACTUALIZADO: Modelo Carga → Movimientos
 * - CreateTripCargoInput usa movements[] en lugar de pickupStopIndex/deliveryStopIndex
 * - Validaciones de negocio para movimientos (pickup obligatorio, entregas parciales)
 */

import {
  type CargoMovementTypeValue,
  type StopTypeValue,
} from "@features/trips/domain/entities";

import {
  type CreateTripDTO,
  type CreateTripStopDTO,
  type CreateTripCargoDTO,
  type CreateTripExpenseDTO,
  type CreateCargoMovementDTO,
  type ITripRepository,
  type ExpenseCategoryValue,
} from "@features/trips/domain/repository";

import { mapBackendError, type MappedError } from "@shared/utils/errorMapper";

// ============================================================================
// TYPES
// ============================================================================

export type UseCaseResult<T> =
  | { success: true; data: T }
  | { success: false; error: MappedError };

/**
 * Input para un movimiento de carga
 */
export interface CreateCargoMovementInput {
  stopIndex: number;
  movementType: CargoMovementTypeValue;
  weight?: number;
  units?: number;
  notes?: string;
}

/**
 * Input para crear un viaje
 */
export interface CreateTripInput {
  vehicleId: string;
  driverId: string;
  clientId?: string;

  scheduledDeparture: Date | string;
  scheduledArrival?: Date | string;
  startMileage?: number;

  originAddress: string;
  originCity: string;
  originState?: string;

  destinationAddress: string;
  destinationCity: string;
  destinationState?: string;

  cargoDescription?: string;
  cargoWeight?: number;
  cargoVolume?: number;
  cargoUnits?: number;
  cargoValue?: number;

  baseRate?: number;
  notes?: string;

  stops?: CreateTripStopInput[];
  cargos?: CreateTripCargoInput[];
  expenses?: CreateTripExpenseInput[];
}

/**
 * Input para crear una parada
 */
export interface CreateTripStopInput {
  sequenceOrder: number;
  stopType: StopTypeValue | StopTypeValue[];
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  contactName?: string;
  contactPhone?: string;
  estimatedArrival?: Date | string;
  cargoActionDescription?: string;
  cargoWeight?: number;
  cargoUnits?: number;
  notes?: string;
}

/**
 * Input para crear una carga
 * ACTUALIZADO: Usa movements[] en lugar de pickupStopIndex/deliveryStopIndex
 */
export interface CreateTripCargoInput {
  clientId: string;
  description: string;
  productType?: string;
  weight?: number;
  volume?: number;
  units?: number;
  declaredValue?: number;
  rate: number;
  currency?: string;
  movements: CreateCargoMovementInput[];
  notes?: string;
  specialInstructions?: string;
}

/**
 * Input para crear un gasto
 */
export interface CreateTripExpenseInput {
  category: ExpenseCategoryValue;
  description: string;
  amount: number;
  currency?: string;
  expenseDate?: Date | string;
  location?: string;
  vendorName?: string;
  notes?: string;
  isEstimated?: boolean;
}

/**
 * Respuesta del backend al crear un viaje
 */
export interface CreateTripResponse {
  id: string;
  tripCode: string;
}

// ============================================================================
// USE CASE INTERFACE
// ============================================================================

export interface ICreateTripUseCase {
  execute(input: CreateTripInput): Promise<UseCaseResult<CreateTripResponse>>;
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
  ): Promise<UseCaseResult<CreateTripResponse>> {
    try {
      const validationError = this.validateInput(input);
      if (validationError) {
        return {
          success: false,
          error: validationError,
        };
      }

      const createDTO = this.mapInputToDTO(input);
      const trip = await this.repository.create(createDTO);

      return {
        success: true,
        data: {
          id: trip.id,
          tripCode: trip.tripCode,
        },
      };
    } catch (error) {
      const mappedError = mapBackendError(error);

      console.error("[CreateTripUseCase] Error:", {
        original: error,
        mapped: mappedError,
      });

      return {
        success: false,
        error: mappedError,
      };
    }
  }

  /**
   * Valida el input antes de enviarlo al backend
   */
  private validateInput(
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

    if (!input.originAddress || !input.originCity) {
      return { code: "ORIGIN_REQUIRED", message: "El origen es requerido" };
    }

    if (!input.destinationAddress || !input.destinationCity) {
      return {
        code: "DESTINATION_REQUIRED",
        message: "El destino es requerido",
      };
    }

    // Validar fecha de salida no sea en el pasado
    const departureDate =
      typeof input.scheduledDeparture === "string"
        ? new Date(input.scheduledDeparture)
        : input.scheduledDeparture;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (departureDate < now) {
      return {
        code: "INVALID_DEPARTURE_DATE",
        message: "La fecha de salida no puede ser en el pasado",
      };
    }

    if (input.scheduledArrival) {
      const arrivalDate =
        typeof input.scheduledArrival === "string"
          ? new Date(input.scheduledArrival)
          : input.scheduledArrival;

      if (arrivalDate <= departureDate) {
        return {
          code: "INVALID_ARRIVAL_DATE",
          message: "La fecha de llegada debe ser posterior a la de salida",
        };
      }
    }

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

    // Validar movimientos de cargas
    if (input.cargos && input.cargos.length > 0) {
      for (let i = 0; i < input.cargos.length; i++) {
        const cargo = input.cargos[i];

        if (!cargo.movements || cargo.movements.length === 0) {
          return {
            code: "CARGO_MISSING_MOVEMENTS",
            message: `La carga "${cargo.description}" debe tener al menos un movimiento de carga (pickup)`,
          };
        }

        const hasPickup = cargo.movements.some(
          (m) => m.movementType === "pickup",
        );
        if (!hasPickup) {
          return {
            code: "CARGO_MISSING_PICKUP",
            message: `La carga "${cargo.description}" debe tener al menos un punto de recogida (pickup)`,
          };
        }

        // Validar que delivery stops estén después del pickup stop
        const pickupStop = cargo.movements.find(
          (m) => m.movementType === "pickup",
        );
        const deliveries = cargo.movements.filter(
          (m) => m.movementType === "delivery",
        );

        for (const delivery of deliveries) {
          if (pickupStop && delivery.stopIndex <= pickupStop.stopIndex) {
            return {
              code: "INVALID_DELIVERY_ORDER",
              message: `La carga "${cargo.description}" tiene un punto de entrega anterior o igual al punto de recogida`,
            };
          }
        }

        // Validar concordancia de peso
        if (deliveries.length > 0 && cargo.weight != null && cargo.weight > 0) {
          const totalDeliveryWeight = deliveries.reduce(
            (sum, d) => sum + (d.weight || 0),
            0,
          );
          if (totalDeliveryWeight > cargo.weight) {
            return {
              code: "DELIVERY_WEIGHT_EXCEEDS",
              message: `La carga "${cargo.description}": el peso de entregas (${totalDeliveryWeight} kg) excede el peso de la carga (${cargo.weight} kg)`,
            };
          }
        }

        // Validar concordancia de unidades
        if (deliveries.length > 0 && cargo.units != null && cargo.units > 0) {
          const totalDeliveryUnits = deliveries.reduce(
            (sum, d) => sum + (d.units || 0),
            0,
          );
          if (totalDeliveryUnits > cargo.units) {
            return {
              code: "DELIVERY_UNITS_EXCEEDS",
              message: `La carga "${cargo.description}": las unidades de entregas (${totalDeliveryUnits}) exceden las unidades de la carga (${cargo.units})`,
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Mapea el input al DTO esperado por el repositorio
   */
  private mapInputToDTO(input: CreateTripInput): CreateTripDTO {
    return {
      vehicleId: input.vehicleId,
      driverId: input.driverId,
      clientId: input.clientId,
      scheduledDeparture:
        typeof input.scheduledDeparture === "string"
          ? input.scheduledDeparture
          : input.scheduledDeparture.toISOString(),
      scheduledArrival: input.scheduledArrival
        ? typeof input.scheduledArrival === "string"
          ? input.scheduledArrival
          : input.scheduledArrival.toISOString()
        : undefined,
      startMileage: input.startMileage,
      originAddress: input.originAddress,
      originCity: input.originCity,
      originState: input.originState,
      destinationAddress: input.destinationAddress,
      destinationCity: input.destinationCity,
      destinationState: input.destinationState,
      cargoDescription: input.cargoDescription,
      cargoWeight: input.cargoWeight,
      cargoVolume: input.cargoVolume,
      cargoUnits: input.cargoUnits,
      cargoValue: input.cargoValue,
      baseRate: input.baseRate,
      notes: input.notes,
      stops: input.stops?.map(this.mapStopInputToDTO),
      cargos: input.cargos?.map(this.mapCargoInputToDTO),
      expenses: input.expenses?.map(this.mapExpenseInputToDTO),
    };
  }

  private mapStopInputToDTO(stop: CreateTripStopInput): CreateTripStopDTO {
    return {
      sequenceOrder: stop.sequenceOrder,
      stopType: stop.stopType,
      address: stop.address,
      city: stop.city,
      state: stop.state,
      postalCode: stop.postalCode,
      latitude: stop.latitude,
      longitude: stop.longitude,
      locationName: stop.locationName,
      contactName: stop.contactName,
      contactPhone: stop.contactPhone,
      estimatedArrival: stop.estimatedArrival
        ? typeof stop.estimatedArrival === "string"
          ? stop.estimatedArrival
          : stop.estimatedArrival.toISOString()
        : undefined,
      cargoActionDescription: stop.cargoActionDescription,
      cargoWeight: stop.cargoWeight,
      cargoUnits: stop.cargoUnits,
      notes: stop.notes,
    };
  }

  private mapCargoInputToDTO(cargo: CreateTripCargoInput): CreateTripCargoDTO {
    return {
      clientId: cargo.clientId,
      description: cargo.description,
      productType: cargo.productType,
      weight: cargo.weight,
      volume: cargo.volume,
      units: cargo.units,
      declaredValue: cargo.declaredValue,
      rate: cargo.rate,
      currency: cargo.currency,
      movements: cargo.movements.map(
        (m): CreateCargoMovementDTO => ({
          stopIndex: m.stopIndex,
          movementType: m.movementType,
          weight: m.weight,
          units: m.units,
          notes: m.notes,
        }),
      ),
      notes: cargo.notes,
      specialInstructions: cargo.specialInstructions,
    };
  }

  private mapExpenseInputToDTO(
    expense: CreateTripExpenseInput,
  ): CreateTripExpenseDTO {
    return {
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      expenseDate: expense.expenseDate
        ? typeof expense.expenseDate === "string"
          ? expense.expenseDate
          : expense.expenseDate.toISOString()
        : undefined,
      location: expense.location,
      vendorName: expense.vendorName,
      notes: expense.notes,
      isEstimated: expense.isEstimated,
    };
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
