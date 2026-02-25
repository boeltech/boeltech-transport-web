import type {
  TripQueryParams,
  ITripRepository,
  TripListItem,
} from "@features/trips/domain";
import type { MappedPaginatedResult } from "@shared/api";
import type { UseCaseResult } from "@shared/utils/errorMapper";

// ============================================================================
// GET TRIPS USE CASE
// ============================================================================

export interface IGetTripsUseCase {
  execute(
    params?: TripQueryParams,
  ): Promise<UseCaseResult<MappedPaginatedResult<TripListItem>>>;
}

export class GetTripsUseCase implements IGetTripsUseCase {
  private readonly repository: ITripRepository;

  constructor(repository: ITripRepository) {
    this.repository = repository;
  }

  async execute(
    params?: TripQueryParams,
  ): Promise<UseCaseResult<MappedPaginatedResult<TripListItem>>> {
    try {
      const result = await this.repository.findAll(params);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "GET_TRIPS_ERROR",
          message:
            error instanceof Error ? error.message : "Error al obtener viajes",
        },
      };
    }
  }
}

export function createGetTripsUseCase(
  repository: ITripRepository,
): IGetTripsUseCase {
  return new GetTripsUseCase(repository);
}
