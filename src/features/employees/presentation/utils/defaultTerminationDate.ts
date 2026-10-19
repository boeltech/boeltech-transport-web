import { getTodayString } from "@shared/utils/dateUtils";

/** Día civil CDMX para el default de `termination_date` en baja de empleado. */
export function getDefaultTerminationDate(): string {
  return getTodayString();
}
