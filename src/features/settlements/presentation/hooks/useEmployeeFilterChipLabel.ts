import { useMemo } from "react";
import { useEmployeeBasic } from "@features/employees/application";
import {
  findEmployeeNameById,
  resolveEmployeeFilterChipLabel,
} from "../utils/resolveEmployeeFilterChipLabel";

type EmployeeNameRow = {
  readonly employeeId: string;
  readonly employeeFullName?: string | null;
};

/**
 * Label del chip `employeeId`: lista cargada → cache employee → «Operador».
 */
export function useEmployeeFilterChipLabel(
  employeeId: string,
  rows: ReadonlyArray<EmployeeNameRow>,
): string {
  const nameFromList = useMemo(
    () => findEmployeeNameById(employeeId, rows),
    [employeeId, rows],
  );
  const needsFetch = Boolean(employeeId) && !nameFromList;
  const { data: employeeBasic } = useEmployeeBasic(employeeId, needsFetch);

  return resolveEmployeeFilterChipLabel({
    name: nameFromList ?? employeeBasic?.fullName,
  });
}
