import {
  canAddStopType,
  getNextStopOrder,
  TripStatus,
  type TripStop,
  type IStopRepository,
  type ITripRepository,
  type CreateStopInput,
} from "@features/trips/domain";
import type { UseCaseResult } from "@shared/utils/errorMapper";

export interface IAddStopUseCase {
  execute(
    tripId: string,
    input: CreateStopInput,
  ): Promise<UseCaseResult<TripStop>>;
}

export class AddStopUseCase implements IAddStopUseCase {
  private readonly tripRepository: ITripRepository;
  private readonly stopRepository: IStopRepository;

  constructor(
    tripRepository: ITripRepository,
    stopRepository: IStopRepository,
  ) {
    this.tripRepository = tripRepository;
    this.stopRepository = stopRepository;
  }

  async execute(
    tripId: string,
    input: CreateStopInput,
  ): Promise<UseCaseResult<TripStop>> {
    try {
      // Validar input
      const validationError = this.validateInput(input);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Verificar que el viaje existe
      const trip = await this.tripRepository.findById(tripId);

      if (!trip) {
        return {
          success: false,
          error: {
            code: "TRIP_NOT_FOUND",
            message: trip ? trip : "El viaje no fue encontrado",
          },
        };
      }

      // Solo se pueden modificar viajes en estado draft o scheduled
      if (
        trip.data.status !== TripStatus.DRAFT &&
        trip.data.status !== TripStatus.SCHEDULED
      ) {
        return {
          success: false,
          error: {
            code: "CANNOT_MODIFY_STOPS",
            message:
              "Solo se pueden modificar paradas de viajes en borrador o programados",
          },
        };
      }

      // Obtener paradas actuales
      const currentStops = await this.stopRepository.findByTripId(tripId);

      // Verificar si se puede agregar este tipo de parada
      const stopTypes = Array.isArray(input.stopType)
        ? input.stopType
        : [input.stopType];
      const canAdd = stopTypes.every((st) =>
        canAddStopType(currentStops.data, st),
      );
      if (!canAdd) {
        return {
          success: false,
          error: {
            code: "DUPLICATE_STOP_TYPE",
            message: `Ya existe una parada de tipo ${stopTypes.join(", ")}`,
          },
        };
      }

      // Calcular orden
      const sequenceOrder = getNextStopOrder(currentStops.data);

      const stopData = {
        ...input,
        sequenceOrder,
      };

      // Agregar parada
      const stop = await this.stopRepository.add(tripId, stopData);

      return { success: true, data: stop.data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "ADD_STOP_ERROR",
          message:
            error instanceof Error ? error.message : "Error al agregar parada",
        },
      };
    }
  }

  private validateInput(
    input: CreateStopInput,
  ): { code: string; message: string } | null {
    if (!input.stopType) {
      return {
        code: "STOP_TYPE_REQUIRED",
        message: "El tipo de parada es requerido",
      };
    }

    if (!input.address) {
      return { code: "ADDRESS_REQUIRED", message: "La dirección es requerida" };
    }

    if (!input.city) {
      return { code: "CITY_REQUIRED", message: "La ciudad es requerida" };
    }

    return null;
  }
}

export function createAddStopUseCase(
  tripRepository: ITripRepository,
  stopRepository: IStopRepository,
): IAddStopUseCase {
  return new AddStopUseCase(tripRepository, stopRepository);
}
