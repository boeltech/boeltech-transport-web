import type {
  Trip,
  UseCaseResult,
  ITripRepository,
} from "@features/trips/domain";

// ============================================================================
// GET TRIP BY ID USE CASE
// ============================================================================

export interface IGetTripByIdUseCase {
  execute(id: string): Promise<UseCaseResult<Trip>>;
}

export class GetTripByIdUseCase implements IGetTripByIdUseCase {
  private readonly repository: ITripRepository;

  constructor(repository: ITripRepository) {
    this.repository = repository;
  }

  async execute(id: string): Promise<UseCaseResult<Trip>> {
    try {
      if (!id) {
        return {
          success: false,
          error: {
            code: "INVALID_ID",
            message: "El ID del viaje es requerido",
          },
        };
      }

      const trip = await this.repository.findById(id);

      if (!trip) {
        return {
          success: false,
          error: {
            code: "TRIP_NOT_FOUND",
            message: "El viaje no fue encontrado",
          },
        };
      }

      return { success: true, data: trip };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "GET_TRIP_ERROR",
          message:
            error instanceof Error ? error.message : "Error al obtener viaje",
        },
      };
    }
  }
}

export function createGetTripByIdUseCase(
  repository: ITripRepository,
): IGetTripByIdUseCase {
  return new GetTripByIdUseCase(repository);
}
