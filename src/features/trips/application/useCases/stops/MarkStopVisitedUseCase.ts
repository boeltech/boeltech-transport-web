import {
  TripStatus,
  type TripStop,
  type UseCaseResult,
  type IStopRepository,
  type ITripRepository,
} from "@features/trips/domain";

export interface IMarkStopVisitedUseCase {
  execute(tripId: string, stopId: string): Promise<UseCaseResult<TripStop>>;
}

export class MarkStopVisitedUseCase implements IMarkStopVisitedUseCase {
  private readonly tripRepository: ITripRepository;
  private readonly stopRepository: IStopRepository;

  constructor(
    tripRepository: ITripRepository,
    stopRepository: IStopRepository,
  ) {
    this.tripRepository = tripRepository;
    this.stopRepository = stopRepository;
  }

  async execute(
    tripId: string,
    stopId: string,
  ): Promise<UseCaseResult<TripStop>> {
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

      // Solo se pueden marcar paradas en viajes en curso
      if (trip.status !== TripStatus.IN_PROGRESS) {
        return {
          success: false,
          error: {
            code: "TRIP_NOT_IN_PROGRESS",
            message: "Solo se pueden marcar paradas en viajes en curso",
          },
        };
      }

      // Verificar que la parada existe
      const existingStop = await this.stopRepository.findById(tripId, stopId);

      if (!existingStop) {
        return {
          success: false,
          error: {
            code: "STOP_NOT_FOUND",
            message: "La parada no fue encontrada",
          },
        };
      }

      // Verificar que no esté ya visitada
      if (existingStop.actualArrival) {
        return {
          success: false,
          error: {
            code: "STOP_ALREADY_VISITED",
            message: "Esta parada ya fue marcada como visitada",
          },
        };
      }

      const stop = await this.stopRepository.markVisited(
        tripId,
        stopId,
        new Date(),
      );

      return { success: true, data: stop };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "MARK_VISITED_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error al marcar parada como visitada",
        },
      };
    }
  }
}

export function createMarkStopVisitedUseCase(
  tripRepository: ITripRepository,
  stopRepository: IStopRepository,
): IMarkStopVisitedUseCase {
  return new MarkStopVisitedUseCase(tripRepository, stopRepository);
}
