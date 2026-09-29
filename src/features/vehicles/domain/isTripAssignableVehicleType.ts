import { VehicleType, type VehicleTypeValue } from "./entities";

/** Tipos asignables como motriz de viaje. `utility` queda fuera. */
export const TRIP_ASSIGNABLE_VEHICLE_TYPES = [
  VehicleType.TRUCK,
  VehicleType.TORTON,
  VehicleType.RABON,
  VehicleType.PICKUP,
] as const;

export type TripAssignableVehicleType =
  (typeof TRIP_ASSIGNABLE_VEHICLE_TYPES)[number];

export function isTripAssignableVehicleType(
  type: string | null | undefined,
): type is TripAssignableVehicleType {
  return (
    type === VehicleType.TRUCK ||
    type === VehicleType.TORTON ||
    type === VehicleType.RABON ||
    type === VehicleType.PICKUP
  );
}

export function isVehicleTypeValue(
  type: string | null | undefined,
): type is VehicleTypeValue {
  return (
    type === VehicleType.TRUCK ||
    type === VehicleType.TORTON ||
    type === VehicleType.RABON ||
    type === VehicleType.PICKUP ||
    type === VehicleType.UTILITY
  );
}
