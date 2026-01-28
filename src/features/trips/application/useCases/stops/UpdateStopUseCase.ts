import {
  TripStatus,
  type TripStop,
  type UseCaseResult,
  type CreateTripStopDTO,
  type IStopRepository,
  type ITripRepository,
} from "@features/trips/domain";

export interface IUpdateStopUseCase {
  execute(
    tripId: string,
    stopId: string,
    data: Partial<CreateTripStopDTO>,
  ): Promise<UseCaseResult<TripStop>>;
}

export class UpdateStopUseCase implements IUpdateStopUseCase {
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
    data: Partial<CreateTripStopDTO>,
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

      // Actualizar parada
      const stop = await this.stopRepository.update(tripId, stopId, data);

      return { success: true, data: stop };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "UPDATE_STOP_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error al actualizar parada",
        },
      };
    }
  }
}

export function createUpdateStopUseCase(
  tripRepository: ITripRepository,
  stopRepository: IStopRepository,
): IUpdateStopUseCase {
  return new UpdateStopUseCase(tripRepository, stopRepository);
}
