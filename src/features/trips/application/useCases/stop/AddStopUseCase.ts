import {
  canAddStopType,
  getNextStopOrder,
  TripStatus,
  type TripStop,
  type IStopRepository,
  type ITripRepository,
  type StopTypeValue,
} from "@features/trips/domain";
import type { UseCaseResult } from "@shared/utils/errorMapper";

/**
 * Input para parada
 */
export interface CreateStopInput {
  sequenceOrder: number;
  stopType: StopTypeValue;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  contactName?: string;
  contactPhone?: string;
  estimatedArrival?: string;
  notes?: string;
  // Carta Porte 3.1
  street?: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  colonia?: string;
  reference?: string;
  satEstadoCode?: string;
  satMunicipioCode?: string;
  satLocalidadCode?: string;
  satColoniaCode?: string;
  rfcRemitenteDestinatario?: string;
  distanceToNextKm?: number;
}

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
        trip.status !== TripStatus.DRAFT &&
        trip.status !== TripStatus.SCHEDULED
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
      if (!canAddStopType(currentStops, input.stopType)) {
        return {
          success: false,
          error: {
            code: "DUPLICATE_STOP_TYPE",
            message: `Ya existe una parada de tipo ${input.stopType}`,
          },
        };
      }

      // Calcular orden
      const sequenceOrder = getNextStopOrder(currentStops);

      const stopData = {
        ...input,
        sequenceOrder,
      };

      // Agregar parada
      const stop = await this.stopRepository.add(tripId, stopData);

      return { success: true, data: stop };
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
