import { getTodayString } from "@shared/utils/dateUtils";

/** Día civil CDMX para el default de `hire_date` en alta de empleado. */
export function getDefaultHireDate(): string {
  return getTodayString();
}
