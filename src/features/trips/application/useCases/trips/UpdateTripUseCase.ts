import {
  canEditTrip,
  type Trip,
  type UseCaseResult,
  type ITripRepository,
  type UpdateTripDTO,
} from "@features/trips/domain";

// ============================================================================
// UPDATE TRIP USE CASE
// ============================================================================

export interface IUpdateTripUseCase {
  execute(id: string, data: UpdateTripDTO): Promise<UseCaseResult<Trip>>;
}

export class UpdateTripUseCase implements IUpdateTripUseCase {
  private readonly repository: ITripRepository;

  constructor(repository: ITripRepository) {
    this.repository = repository;
  }

  async execute(id: string, data: UpdateTripDTO): Promise<UseCaseResult<Trip>> {
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
      if (!canEditTrip(currentTrip.status)) {
        return {
          success: false,
          error: {
            code: "CANNOT_EDIT_TRIP",
            message: "Solo se pueden editar viajes en borrador o programados",
          },
        };
      }

      // Validar datos de actualización
      const validationError = this.validateUpdateData(data, currentTrip);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Actualizar
      const updatedTrip = await this.repository.update(id, data);

      return { success: true, data: updatedTrip };
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
    data: UpdateTripDTO,
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
    if (data.startMileage !== undefined && data.startMileage < 0) {
      return {
        code: "INVALID_MILEAGE",
        message: "El kilometraje no puede ser negativo",
      };
    }

    if (data.baseRate !== undefined && data.baseRate < 0) {
      return {
        code: "INVALID_BASE_RATE",
        message: "La tarifa base no puede ser negativa",
      };
    }

    return null;
  }
}

export function createUpdateTripUseCase(
  repository: ITripRepository,
): IUpdateTripUseCase {
  return new UpdateTripUseCase(repository);
}
