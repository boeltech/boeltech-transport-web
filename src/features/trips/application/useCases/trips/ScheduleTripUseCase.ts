import {
  TripStatus,
  type Trip,
  type UseCaseResult,
  type ITripRepository,
  validateStatusTransition,
} from "@features/trips/domain";

// ============================================================================
// SCHEDULE TRIP USE CASE
// ============================================================================

export interface IScheduleTripUseCase {
  execute(id: string): Promise<UseCaseResult<Trip>>;
}

export class ScheduleTripUseCase implements IScheduleTripUseCase {
  private readonly repository: ITripRepository;

  constructor(repository: ITripRepository) {
    this.repository = repository;
  }

  async execute(id: string): Promise<UseCaseResult<Trip>> {
    try {
      // Obtener el viaje actual
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

      // Validar que la transición de estado sea válida
      const validation = validateStatusTransition(
        currentTrip.status,
        TripStatus.SCHEDULED,
      );

      if (!validation.success) {
        return {
          success: false,
          error: validation.error!,
        };
      }

      // Validar que el viaje tenga la información mínima requerida
      const validationResult = this.validateTripForScheduling(currentTrip);
      if (!validationResult.success) {
        return validationResult;
      }

      // Actualizar el estado del viaje
      const updatedTrip = await this.repository.updateStatus(id, {
        status: TripStatus.SCHEDULED,
      });

      return { success: true, data: updatedTrip };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "SCHEDULE_TRIP_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error al programar el viaje",
        },
      };
    }
  }

  /**
   * Valida que el viaje tenga la información mínima para ser programado
   */
  private validateTripForScheduling(trip: Trip): UseCaseResult<null> {
    // Validar que tenga fecha de salida programada
    if (!trip.scheduledDeparture) {
      return {
        success: false,
        error: {
          code: "MISSING_SCHEDULED_DEPARTURE",
          message: "El viaje debe tener una fecha de salida programada",
        },
      };
    }

    // Validar que tenga fecha de llegada programada
    if (!trip.scheduledArrival) {
      return {
        success: false,
        error: {
          code: "MISSING_SCHEDULED_ARRIVAL",
          message: "El viaje debe tener una fecha de llegada programada",
        },
      };
    }

    // Validar que tenga conductor asignado
    if (!trip.driverId) {
      return {
        success: false,
        error: {
          code: "MISSING_DRIVER",
          message: "El viaje debe tener un conductor asignado",
        },
      };
    }

    // Validar que tenga vehículo asignado
    if (!trip.vehicleId) {
      return {
        success: false,
        error: {
          code: "MISSING_VEHICLE",
          message: "El viaje debe tener un vehículo asignado",
        },
      };
    }

    // Validar que tenga origen y destino
    if (!trip.originAddress || !trip.destinationAddress) {
      return {
        success: false,
        error: {
          code: "MISSING_ROUTE",
          message: "El viaje debe tener origen y destino definidos",
        },
      };
    }

    return { success: true, data: null };
  }
}

export function createScheduleTripUseCase(
  repository: ITripRepository,
): IScheduleTripUseCase {
  return new ScheduleTripUseCase(repository);
}
