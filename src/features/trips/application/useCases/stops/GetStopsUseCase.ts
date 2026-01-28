import type { TripStop, UseCaseResult } from "@features/trips/domain";
import type { IStopRepository } from "@features/trips/domain";

// ============================================================================
// GET STOPS USE CASE
// ============================================================================

export interface IGetStopsUseCase {
  execute(tripId: string): Promise<UseCaseResult<TripStop[]>>;
}

export class GetStopsUseCase implements IGetStopsUseCase {
  private readonly stopRepository: IStopRepository;

  constructor(stopRepository: IStopRepository) {
    this.stopRepository = stopRepository;
  }

  async execute(tripId: string): Promise<UseCaseResult<TripStop[]>> {
    try {
      if (!tripId) {
        return {
          success: false,
          error: {
            code: "INVALID_TRIP_ID",
            message: "El ID del viaje es requerido",
          },
        };
      }

      const stops = await this.stopRepository.findByTripId(tripId);

      // Ordenar por sequenceOrder antes de retornar
      const orderedStops = [...stops].sort(
        (a, b) => a.sequenceOrder - b.sequenceOrder,
      );

      return { success: true, data: orderedStops };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "GET_STOPS_ERROR",
          message:
            error instanceof Error ? error.message : "Error al obtener paradas",
        },
      };
    }
  }
}

export function createGetStopsUseCase(
  stopRepository: IStopRepository,
): IGetStopsUseCase {
  return new GetStopsUseCase(stopRepository);
}
