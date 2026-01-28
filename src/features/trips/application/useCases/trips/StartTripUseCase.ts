import {
  TripStatus,
  type Trip,
  type UseCaseResult,
  type ITripRepository,
  canStartTrip,
} from "@features/trips/domain";

// ============================================================================
// START TRIP USE CASE
// ============================================================================

export interface IStartTripUseCase {
  execute(
    id: string,
    options?: { mileage?: number; latitude?: number; longitude?: number },
  ): Promise<UseCaseResult<Trip>>;
}

export class StartTripUseCase implements IStartTripUseCase {
  private readonly repository: ITripRepository;

  constructor(repository: ITripRepository) {
    this.repository = repository;
  }

  async execute(
    id: string,
    options?: { mileage?: number; latitude?: number; longitude?: number },
  ): Promise<UseCaseResult<Trip>> {
    try {
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

      if (!canStartTrip(currentTrip.status)) {
        return {
          success: false,
          error: {
            code: "CANNOT_START_TRIP",
            message: "Solo se pueden iniciar viajes programados",
          },
        };
      }

      const updatedTrip = await this.repository.updateStatus(id, {
        status: TripStatus.IN_PROGRESS,
        mileage: options?.mileage,
        latitude: options?.latitude,
        longitude: options?.longitude,
      });

      return { success: true, data: updatedTrip };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "START_TRIP_ERROR",
          message:
            error instanceof Error ? error.message : "Error al iniciar viaje",
        },
      };
    }
  }
}

export function createStartTripUseCase(
  repository: ITripRepository,
): IStartTripUseCase {
  return new StartTripUseCase(repository);
}
