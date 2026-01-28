import {
  validateFinishTripData,
  type Trip,
  type UseCaseResult,
  type ITripRepository,
  type FinishTripDTO,
} from "@features/trips/domain";

// ============================================================================
// FINISH TRIP USE CASE
// ============================================================================

export interface FinishTripInput {
  endMileage: number;
  actualArrival: Date | string;
  fuelCost?: number;
  tollCost?: number;
  otherCosts?: number;
  notes?: string;
}

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
        currentTrip,
        input.endMileage,
        input.actualArrival,
      );

      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error,
        };
      }

      // Preparar DTO para el repositorio
      const finishDTO: FinishTripDTO = {
        endMileage: input.endMileage,
        actualArrival:
          typeof input.actualArrival === "string"
            ? input.actualArrival
            : input.actualArrival.toISOString(),
        fuelCost: input.fuelCost,
        tollCost: input.tollCost,
        otherCosts: input.otherCosts,
        notes: input.notes,
      };

      // Finalizar viaje
      const finishedTrip = await this.repository.finish(id, finishDTO);

      return { success: true, data: finishedTrip };
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
