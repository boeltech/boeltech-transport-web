import {
  TripStatus,
  type TripStop,
  type UseCaseResult,
  type IStopRepository,
  type ITripRepository,
} from "@features/trips/domain";

export interface IReorderStopsUseCase {
  execute(
    tripId: string,
    orderedIds: string[],
  ): Promise<UseCaseResult<TripStop[]>>;
}

export class ReorderStopsUseCase implements IReorderStopsUseCase {
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
    orderedIds: string[],
  ): Promise<UseCaseResult<TripStop[]>> {
    try {
      if (!orderedIds || orderedIds.length === 0) {
        return {
          success: false,
          error: {
            code: "INVALID_ORDER",
            message: "Se requiere el orden de las paradas",
          },
        };
      }

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
              "Solo se pueden reordenar paradas de viajes en borrador o programados",
          },
        };
      }

      // Verificar que todos los IDs corresponden a paradas existentes
      const currentStops = await this.stopRepository.findByTripId(tripId);
      const currentIds = new Set(currentStops.map((s) => s.id));

      for (const id of orderedIds) {
        if (!currentIds.has(id)) {
          return {
            success: false,
            error: {
              code: "INVALID_STOP_ID",
              message: `La parada con ID ${id} no existe en este viaje`,
            },
          };
        }
      }

      // Verificar que no falten IDs
      if (orderedIds.length !== currentStops.length) {
        return {
          success: false,
          error: {
            code: "INCOMPLETE_ORDER",
            message: "El orden debe incluir todas las paradas del viaje",
          },
        };
      }

      const stops = await this.stopRepository.reorder(tripId, orderedIds);

      return { success: true, data: stops };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "REORDER_STOPS_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error al reordenar paradas",
        },
      };
    }
  }
}

export function createReorderStopsUseCase(
  tripRepository: ITripRepository,
  stopRepository: IStopRepository,
): IReorderStopsUseCase {
  return new ReorderStopsUseCase(tripRepository, stopRepository);
}
