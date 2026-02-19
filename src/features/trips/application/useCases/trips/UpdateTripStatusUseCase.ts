import {
  validateStatusTransition,
  type Trip,
  type TripStatusType,
  type UseCaseResult,
  type ITripRepository,
} from "@features/trips/domain";

// ============================================================================
// UPDATE TRIP STATUS USE CASE
// ============================================================================

export interface IUpdateTripStatusUseCase {
  execute(
    id: string,
    newStatus: TripStatusType,
    options?: {
      mileage?: number;
      reason?: string;
      latitude?: number;
      longitude?: number;
    },
  ): Promise<UseCaseResult<Trip>>;
}

export class UpdateTripStatusUseCase implements IUpdateTripStatusUseCase {
  private readonly repository: ITripRepository;

  constructor(repository: ITripRepository) {
    this.repository = repository;
  }

  async execute(
    id: string,
    newStatus: TripStatusType,
    options?: {
      mileage?: number;
      reason?: string;
      latitude?: number;
      longitude?: number;
    },
  ): Promise<UseCaseResult<Trip>> {
    try {
      // Obtener viaje actual
      const currentTrip = await this.repository.findById(id);

      if (!currentTrip.data) {
        return {
          success: false,
          error: {
            code: "TRIP_NOT_FOUND",
            message: currentTrip.message
              ? currentTrip.message
              : "El viaje no fue encontrado",
          },
        };
      }

      // Validar transición de estado
      const transitionResult = validateStatusTransition(
        currentTrip.data.status,
        newStatus,
      );

      if (!transitionResult.success) {
        return {
          success: false,
          error: transitionResult.error,
        };
      }

      // Actualizar estado
      const updatedTrip = await this.repository.updateStatus(id, {
        status: newStatus,
        mileage: options?.mileage,
        reason: options?.reason,
        latitude: options?.latitude,
        longitude: options?.longitude,
      });

      return { success: true, data: updatedTrip.data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "UPDATE_STATUS_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error al actualizar estado",
        },
      };
    }
  }
}

export function createUpdateTripStatusUseCase(
  repository: ITripRepository,
): IUpdateTripStatusUseCase {
  return new UpdateTripStatusUseCase(repository);
}
