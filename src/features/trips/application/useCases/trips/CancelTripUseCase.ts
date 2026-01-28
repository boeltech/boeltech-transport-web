import {
  TripStatus,
  type Trip,
  type UseCaseResult,
  type ITripRepository,
  canCancelTrip,
} from "@features/trips/domain";

// ============================================================================
// CANCEL TRIP USE CASE
// ============================================================================

export interface ICancelTripUseCase {
  execute(id: string, reason?: string): Promise<UseCaseResult<Trip>>;
}

export class CancelTripUseCase implements ICancelTripUseCase {
  private readonly repository: ITripRepository;

  constructor(repository: ITripRepository) {
    this.repository = repository;
  }

  async execute(id: string, reason?: string): Promise<UseCaseResult<Trip>> {
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

      if (!canCancelTrip(currentTrip.status)) {
        return {
          success: false,
          error: {
            code: "CANNOT_CANCEL_TRIP",
            message: "Este viaje no puede ser cancelado",
          },
        };
      }

      const updatedTrip = await this.repository.updateStatus(id, {
        status: TripStatus.CANCELLED,
        reason: reason,
      });

      return { success: true, data: updatedTrip };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "CANCEL_TRIP_ERROR",
          message:
            error instanceof Error ? error.message : "Error al cancelar viaje",
        },
      };
    }
  }
}

export function createCancelTripUseCase(
  repository: ITripRepository,
): ICancelTripUseCase {
  return new CancelTripUseCase(repository);
}
