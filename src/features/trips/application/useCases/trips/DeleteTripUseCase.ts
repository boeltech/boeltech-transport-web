import {
  canDeleteTrip,
  type UseCaseResult,
  type ITripRepository,
} from "@features/trips/domain";

// ============================================================================
// DELETE TRIP USE CASE
// ============================================================================

export interface IDeleteTripUseCase {
  execute(id: string): Promise<UseCaseResult<void>>;
}

export class DeleteTripUseCase implements IDeleteTripUseCase {
  private readonly repository: ITripRepository;

  constructor(repository: ITripRepository) {
    this.repository = repository;
  }

  async execute(id: string): Promise<UseCaseResult<void>> {
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

      // Verificar que se puede eliminar (solo drafts)
      if (!canDeleteTrip(currentTrip.status)) {
        return {
          success: false,
          error: {
            code: "CANNOT_DELETE_TRIP",
            message: "Solo se pueden eliminar viajes en borrador",
          },
        };
      }

      // Eliminar
      await this.repository.delete(id);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "DELETE_TRIP_ERROR",
          message:
            error instanceof Error ? error.message : "Error al eliminar viaje",
        },
      };
    }
  }
}

export function createDeleteTripUseCase(
  repository: ITripRepository,
): IDeleteTripUseCase {
  return new DeleteTripUseCase(repository);
}
