import type { VehicleStatusType, VehicleTypeValue } from "../../domain";

/** Datos mínimos de la unidad para los diálogos «Dar de baja» y «Restaurar». */
export interface VehicleLifecycleTarget {
  readonly id: string;
  readonly unitNumber: string;
  readonly type?: VehicleTypeValue | string | null;
  readonly status: VehicleStatusType;
  readonly isActive?: boolean;
}
