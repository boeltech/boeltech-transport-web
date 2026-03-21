import {
  validateFinishTripData,
  type Trip,
  type ITripRepository,
  type FinishTripInput,
} from "@features/trips/domain";
import type { UseCaseResult } from "@shared/utils/errorMapper";

// ============================================================================
// FINISH TRIP USE CASE
// ============================================================================

export interface IFinishTripUseCase {
  execute(id: string, input: FinishTripInput): Promise<UseCaseResult<Trip>>;
}

export class FinishTripUseCase implements IFinishTripUseCase {
  private readonly repository: ITripRepository;

  constructor(repository: ITripRepository) {
    this.repository = repository;
  }

  async execute(
    id: string,
    input: FinishTripInput,
  ): Promise<UseCaseResult<Trip>> {
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

      // Validar datos para finalizar
      const validationResult = validateFinishTripData(
        currentTrip.data,
        input.endMileage,
        input.actualArrival,
      );

      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error,
        };
      }

      // Finalizar viaje
      const finishedTrip = await this.repository.finish(id, input);

      return { success: true, data: finishedTrip.data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "FINISH_TRIP_ERROR",
          message:
            error instanceof Error ? error.message : "Error al finalizar viaje",
        },
      };
    }
  }
}

export function createFinishTripUseCase(
  repository: ITripRepository,
): IFinishTripUseCase {
  return new FinishTripUseCase(repository);
}
