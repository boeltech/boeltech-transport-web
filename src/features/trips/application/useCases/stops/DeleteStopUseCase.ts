import {
  TripStatus,
  type UseCaseResult,
  type IStopRepository,
  type ITripRepository,
  canDeleteStop,
} from "@features/trips/domain";

export interface IDeleteStopUseCase {
  execute(tripId: string, stopId: string): Promise<UseCaseResult<void>>;
}

export class DeleteStopUseCase implements IDeleteStopUseCase {
  private readonly tripRepository: ITripRepository;
  private readonly stopRepository: IStopRepository;

  constructor(
    tripRepository: ITripRepository,
    stopRepository: IStopRepository,
  ) {
    this.tripRepository = tripRepository;
    this.stopRepository = stopRepository;
  }

  async execute(tripId: string, stopId: string): Promise<UseCaseResult<void>> {
    try {
      // Verificar que el viaje existe
      const trip = await this.tripRepository.findById(tripId);

      if (!trip) {
        return {
          success: false,
          error: {
            code: "TRIP_NOT_FOUND",
            message: "El viaje no fue encontrado",
          },
        };
      }

      // Solo se pueden modificar viajes en estado draft o scheduled
      if (
        trip.status !== TripStatus.DRAFT &&
        trip.status !== TripStatus.SCHEDULED
      ) {
        return {
          success: false,
          error: {
            code: "CANNOT_MODIFY_STOPS",
            message:
              "Solo se pueden modificar paradas de viajes en borrador o programados",
          },
        };
      }

      // Obtener todas las paradas para validar eliminación
      const allStops = await this.stopRepository.findByTripId(tripId);
      const stopToDelete = allStops.find((s) => s.id === stopId);

      if (!stopToDelete) {
        return {
          success: false,
          error: {
            code: "STOP_NOT_FOUND",
            message: "La parada no fue encontrada",
          },
        };
      }

      // Verificar si se puede eliminar
      const { canDelete, reason } = canDeleteStop(stopToDelete, allStops);

      if (!canDelete) {
        return {
          success: false,
          error: {
            code: "CANNOT_DELETE_STOP",
            message: reason || "No se puede eliminar esta parada",
          },
        };
      }

      await this.stopRepository.delete(tripId, stopId);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "DELETE_STOP_ERROR",
          message:
            error instanceof Error ? error.message : "Error al eliminar parada",
        },
      };
    }
  }
}

export function createDeleteStopUseCase(
  tripRepository: ITripRepository,
  stopRepository: IStopRepository,
): IDeleteStopUseCase {
  return new DeleteStopUseCase(tripRepository, stopRepository);
}
