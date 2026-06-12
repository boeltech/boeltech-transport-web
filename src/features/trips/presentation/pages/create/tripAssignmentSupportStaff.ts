import type { EmployeeListItem } from "@features/employees";
import type { DriverListItem } from "@features/drivers/domain";

import {
  BUSY_ON_ACTIVE_TRIP,
  type BusyAssignmentResourceIds,
} from "./tripAssignmentBusyResources";
import { classifyDriverAssignability } from "./tripAssignmentDrivers";

export type SupportStaffPositionFilter = "Conductor" | "Ayudante general";

export type SupportStaffInternalRole = "secondary_driver" | "helper";

export interface AssignableSupportStaffItem {
  employeeId: string;
  fullName: string;
  position: string;
  internalRole: SupportStaffInternalRole;
  canBeAssigned: boolean;
  blockReason?: string;
}

export interface BuildAssignableSupportStaffParams {
  employees: readonly EmployeeListItem[];
  driversByEmployeeId: ReadonlyMap<string, DriverListItem>;
  busyResources: BusyAssignmentResourceIds;
  positionFilter: SupportStaffPositionFilter;
  excludeEmployeeIds: ReadonlySet<string>;
}

function employeePositionMatchesFilter(
  employee: EmployeeListItem,
  filter: SupportStaffPositionFilter,
): boolean {
  const pos = (employee.position ?? "").trim().toLowerCase();
  return pos === filter.trim().toLowerCase();
}

function internalRoleForPosition(
  filter: SupportStaffPositionFilter,
): SupportStaffInternalRole {
  return filter === "Conductor" ? "secondary_driver" : "helper";
}

function isEmployeeActive(employee: EmployeeListItem): boolean {
  return employee.isActive && employee.status === "active";
}

function classifySupportStaffAssignability(
  employee: EmployeeListItem,
  internalRole: SupportStaffInternalRole,
  driver: DriverListItem | undefined,
  busyResources: BusyAssignmentResourceIds,
): Pick<AssignableSupportStaffItem, "canBeAssigned" | "blockReason"> {
  if (!isEmployeeActive(employee)) {
    return { canBeAssigned: false, blockReason: "Inactivo" };
  }

  if (busyResources.employeeIds.has(employee.id)) {
    return { canBeAssigned: false, blockReason: BUSY_ON_ACTIVE_TRIP };
  }

  if (internalRole === "secondary_driver" && !driver) {
    return {
      canBeAssigned: false,
      blockReason: "Sin perfil de conductor activo",
    };
  }

  if (driver) {
    const driverAssignability = classifyDriverAssignability(driver);
    if (!driverAssignability.canBeAssigned) {
      return driverAssignability;
    }
    if (busyResources.driverIds.has(driver.id)) {
      return { canBeAssigned: false, blockReason: BUSY_ON_ACTIVE_TRIP };
    }
  }

  return { canBeAssigned: true };
}

export function buildAssignableSupportStaffForTripWizard(
  params: BuildAssignableSupportStaffParams,
): AssignableSupportStaffItem[] {
  const {
    employees,
    driversByEmployeeId,
    busyResources,
    positionFilter,
    excludeEmployeeIds,
  } = params;

  const internalRole = internalRoleForPosition(positionFilter);

  return employees
    .filter((employee) => employeePositionMatchesFilter(employee, positionFilter))
    .filter((employee) => !excludeEmployeeIds.has(employee.id))
    .map((employee) => {
      const driver = driversByEmployeeId.get(employee.id);
      const { canBeAssigned, blockReason } = classifySupportStaffAssignability(
        employee,
        internalRole,
        driver,
        busyResources,
      );

      return {
        employeeId: employee.id,
        fullName: employee.fullName,
        position: employee.position ?? "",
        internalRole,
        canBeAssigned,
        blockReason,
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
}

export function findSupportStaffAssignability(
  employeeId: string,
  params: Omit<BuildAssignableSupportStaffParams, "positionFilter"> & {
    positionFilter?: SupportStaffPositionFilter;
  },
): AssignableSupportStaffItem | undefined {
  const employee = params.employees.find((e) => e.id === employeeId);
  if (!employee) return undefined;

  const positionFilter =
    params.positionFilter ??
    (employeePositionMatchesFilter(employee, "Conductor")
      ? "Conductor"
      : "Ayudante general");

  const busyForRow: BusyAssignmentResourceIds = {
    vehicleIds: params.busyResources.vehicleIds,
    driverIds: params.busyResources.driverIds,
    employeeIds: new Set(
      [...params.busyResources.employeeIds].filter((id) => id !== employeeId),
    ),
  };

  const [item] = buildAssignableSupportStaffForTripWizard({
    ...params,
    busyResources: busyForRow,
    positionFilter,
    excludeEmployeeIds: new Set(
      [...params.excludeEmployeeIds].filter((id) => id !== employeeId),
    ),
  }).filter((row) => row.employeeId === employeeId);

  return item;
}
