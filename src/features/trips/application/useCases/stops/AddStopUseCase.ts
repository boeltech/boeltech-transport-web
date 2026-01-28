import {
  canAddStopType,
  getNextStopOrder,
  TripStatus,
  type TripStop,
  type UseCaseResult,
  type IStopRepository,
  type ITripRepository,
  type StopTypeValue,
  type AddStopData,
} from "@features/trips/domain";

export interface AddStopInput {
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
  estimatedArrival?: Date | string;
  cargoActionDescription?: string;
  cargoWeight?: number;
  cargoUnits?: number;
  notes?: string;
}

export interface IAddStopUseCase {
  execute(
    tripId: string,
    input: AddStopInput,
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
    input: AddStopInput,
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
            message: "El viaje no fue encontrado",
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

      // Preparar datos para agregar
      const stopData: AddStopData = {
        sequenceOrder,
        stopType: input.stopType,
        address: input.address,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        latitude: input.latitude,
        longitude: input.longitude,
        locationName: input.locationName,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        estimatedArrival: input.estimatedArrival,
        cargoActionDescription: input.cargoActionDescription,
        cargoWeight: input.cargoWeight,
        cargoUnits: input.cargoUnits,
        notes: input.notes,
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
    input: AddStopInput,
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
