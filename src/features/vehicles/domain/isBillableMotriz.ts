import {
  VehicleStatus,
  VehicleType,
  type VehicleStatusType,
  type VehicleTypeValue,
} from "./entities";

/** Tipos de tracción que cuentan para cobro motriz (ADR-0094 §2; pickup desde cutover). */
export const BILLABLE_MOTRIZ_TYPES = [
  VehicleType.TRUCK,
  VehicleType.TORTON,
  VehicleType.RABON,
  VehicleType.PICKUP,
] as const;

export type BillableMotrizType = (typeof BILLABLE_MOTRIZ_TYPES)[number];

export function isBillableMotrizType(
  type: string | null | undefined,
): type is BillableMotrizType {
  return (
    type === VehicleType.TRUCK ||
    type === VehicleType.TORTON ||
    type === VehicleType.RABON ||
    type === VehicleType.PICKUP
  );
}

export type BillableMotrizNowInput = {
  readonly type?: VehicleTypeValue | string | null;
  readonly status?: VehicleStatusType | string | null;
  readonly isActive?: boolean | null;
};

/**
 * Cobrable ahora: tipo de tracción ∧ activa ∧ no fuera de servicio.
 * `in_maintenance` sí cuenta. Utility no.
 */
export function isBillableMotrizNow({
  type,
  status,
  isActive,
}: BillableMotrizNowInput): boolean {
  return (
    isBillableMotrizType(type) &&
    isActive !== false &&
    status !== VehicleStatus.OUT_OF_SERVICE
  );
}
