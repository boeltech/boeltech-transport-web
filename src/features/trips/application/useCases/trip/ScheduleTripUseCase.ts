import {
  TripStatus,
  type CreateTripWarning,
  type Trip,
  type ITripRepository,
  validateStatusTransition,
  validateTripRouteForScheduling,
} from "@features/trips/domain";
import type { UseCaseResult } from "@shared/utils/errorMapper";
import { assertCommercialScheduleReadiness } from "@boeltech/cfdi-domain";

// ============================================================================
// SCHEDULE TRIP USE CASE
// ============================================================================

/** Confirm draft→scheduled; may include soft-overlap warnings (0071 E2). */
export type ScheduleTripResult = {
  trip: Trip;
  warnings?: CreateTripWarning[];
};

export interface IScheduleTripUseCase {
  execute(id: string): Promise<UseCaseResult<ScheduleTripResult>>;
}

export class ScheduleTripUseCase implements IScheduleTripUseCase {
  private readonly repository: ITripRepository;

  constructor(repository: ITripRepository) {
    this.repository = repository;
  }

  async execute(id: string): Promise<UseCaseResult<ScheduleTripResult>> {
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

      const validation = validateStatusTransition(
        currentTrip.data.status,
        TripStatus.SCHEDULED,
      );

      if (!validation.success) {
        return {
          success: false,
          error: validation.error!,
        };
      }

      const validationResult = this.validateTripForScheduling(currentTrip.data);
      if (!validationResult.success) {
        return validationResult;
      }

      const updatedTrip = await this.repository.updateStatus(id, {
        status: TripStatus.SCHEDULED,
      });

      return {
        success: true,
        data: {
          trip: updatedTrip.data,
          ...(updatedTrip.warnings && updatedTrip.warnings.length > 0
            ? { warnings: updatedTrip.warnings }
            : {}),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "SCHEDULE_TRIP_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error al programar el viaje",
        },
      };
    }
  }

  /**
   * Readiness comercial ADR-0071 + resumen de ruta.
   * No exige paradas CP31 (se completan en /edit antes de timbrar).
   */
  private validateTripForScheduling(trip: Trip): UseCaseResult<null> {
    const readiness = assertCommercialScheduleReadiness({
      vehicleId: trip.vehicleId,
      driverId: trip.driverId,
      scheduledDeparture: trip.scheduledDeparture,
      scheduledArrival: trip.scheduledArrival,
      baseRate: trip.costs?.baseRate,
      cfdiDocumentIntent: trip.cfdiDocumentIntent ?? "ingreso",
      startMileage: trip.mileage.start,
    });

    if (!readiness.ok) {
      const first = readiness.error[0];
      return {
        success: false,
        error: {
          code: first?.code ?? "SCHEDULE_NOT_READY",
          message:
            first?.message ??
            "Falta información comercial para confirmar la reserva",
        },
      };
    }

    const routeError = validateTripRouteForScheduling(trip);
    if (routeError) {
      return {
        success: false,
        error: routeError,
      };
    }

    return { success: true, data: null };
  }
}

export function createScheduleTripUseCase(
  repository: ITripRepository,
): IScheduleTripUseCase {
  return new ScheduleTripUseCase(repository);
}
