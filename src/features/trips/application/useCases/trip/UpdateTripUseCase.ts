import {
  canEditTrip,
  type CreateStopInput,
  type Trip,
  type ITripRepository,
  type UpdateTripInput,
  isUnifiedAddressId,
} from "@features/trips/domain";
import type { UseCaseResult } from "@shared/utils/errorMapper";

// ============================================================================
// UPDATE TRIP USE CASE
// ============================================================================

export interface IUpdateTripUseCase {
  execute(id: string, data: UpdateTripInput): Promise<UseCaseResult<Trip>>;
}

export class UpdateTripUseCase implements IUpdateTripUseCase {
  private readonly repository: ITripRepository;

  constructor(repository: ITripRepository) {
    this.repository = repository;
  }

  async execute(
    id: string,
    data: UpdateTripInput,
  ): Promise<UseCaseResult<Trip>> {
    try {
      // Obtener viaje actual
      const currentTrip = await this.repository.findById(id);

      if (!currentTrip) {
        return {
          success: false,
          error: {
            code: "TRIP_NOT_FOUND",
            message: "El viaje no fue encontrado",
          },
        };
      }

      // Verificar que se puede editar
      if (!canEditTrip(currentTrip.data.status)) {
        return {
          success: false,
          error: {
            code: "CANNOT_EDIT_TRIP",
            message: "Solo se pueden editar viajes en borrador o programados",
          },
        };
      }

      // Validar datos de actualización
      const validationError = this.validateUpdateData(data, currentTrip.data);
      if (validationError) {
        return { success: false, error: validationError };
      }

      if (data.stops?.length) {
        const stopsError = this.validateStopsPayload(data.stops);
        if (stopsError) {
          return { success: false, error: stopsError };
        }
      }

      // Actualizar
      const updatedTrip = await this.repository.update(id, data);

      return { success: true, data: updatedTrip.data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "UPDATE_TRIP_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error al actualizar viaje",
        },
      };
    }
  }

  private validateUpdateData(
    data: UpdateTripInput,
    _currentTrip: Trip,
  ): { code: string; message: string } | null {
    // Validar fechas si se proporcionan
    if (data.scheduledDeparture && data.scheduledArrival) {
      const departure = new Date(data.scheduledDeparture);
      const arrival = new Date(data.scheduledArrival);

      if (arrival <= departure) {
        return {
          code: "INVALID_DATES",
          message: "La fecha de llegada debe ser posterior a la de salida",
        };
      }
    }

    // Validar valores numéricos
    // if (data.startMileage !== undefined && data.startMileage < 0) {
    //   return {
    //     code: "INVALID_MILEAGE",
    //     message: "El kilometraje no puede ser negativo",
    //   };
    // }

    if (data.baseRate !== undefined && data.baseRate < 0) {
      return {
        code: "INVALID_BASE_RATE",
        message: "La tarifa base no puede ser negativa",
      };
    }

    return null;
  }

  private validateStopsPayload(
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

      const linked = isUnifiedAddressId(stop.addressId);
      if (!linked) {
        if (!stop.address?.trim()) {
          return {
            code: "STOP_ADDRESS_REQUIRED",
            message: `Parada #${i + 1}: La dirección es requerida`,
          };
        }

        if (!stop.city?.trim()) {
          return {
            code: "STOP_CITY_REQUIRED",
            message: `Parada #${i + 1}: La ciudad es requerida`,
          };
        }
      }
    }

    return null;
  }
}

export function createUpdateTripUseCase(
  repository: ITripRepository,
): IUpdateTripUseCase {
  return new UpdateTripUseCase(repository);
}
