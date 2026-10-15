import { settlementsCopy } from "../copy/settlementsCopy";

type EmployeeNameRow = {
  readonly employeeId: string;
  readonly employeeFullName?: string | null;
};

/**
 * Chip de filtro por operador: nombre legible, nunca UUID truncado.
 * Fallback sin nombre → «Operador».
 */
export function resolveEmployeeFilterChipLabel(options?: {
  name?: string | null;
}): string {
  const trimmed = options?.name?.trim();
  if (trimmed) {
    return settlementsCopy.workbench.chip.employee(trimmed);
  }
  return settlementsCopy.workbench.chip.employeeFallback;
}

export function findEmployeeNameById(
  employeeId: string,
  rows: ReadonlyArray<EmployeeNameRow>,
): string | undefined {
  if (!employeeId) return undefined;
  const match = rows.find((row) => row.employeeId === employeeId);
  const name = match?.employeeFullName?.trim();
  return name || undefined;
}
