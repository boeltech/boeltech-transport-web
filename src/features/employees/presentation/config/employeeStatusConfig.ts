/**
 * Employee Status Configuration
 * Clean Architecture - Feature Layer (Config)
 *
 * Configuración de UI para los estados de empleados.
 *
 * Ubicación: src/features/employees/presentation/config/employeeStatusConfig.ts
 */

import {
  CheckCircle2,
  XCircle,
  Palmtree,
  CalendarOff,
  AlertTriangle,
} from "lucide-react";
import {
  type StatusConfig,
  createStatusConfig,
} from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import {
  EMPLOYEE_STATUS_LABELS,
} from "./employeeConfig";
import type { EmployeeStatus } from "../../domain/entities";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const EMPLOYEE_STATUS_CONFIG: Record<EmployeeStatus, StatusConfig> = {
  active: createStatusConfig("success", {
    label: EMPLOYEE_STATUS_LABELS.active,
    icon: CheckCircle2,
    description: "Empleado activo en la empresa",
  }),

  on_leave: createStatusConfig("info", {
    label: EMPLOYEE_STATUS_LABELS.on_leave,
    icon: CalendarOff,
    description: "Empleado con permiso temporal",
  }),

  on_vacation: createStatusConfig("purple", {
    label: EMPLOYEE_STATUS_LABELS.on_vacation,
    icon: Palmtree,
    description: "Empleado en período de vacaciones",
  }),

  suspended: createStatusConfig("warning", {
    label: EMPLOYEE_STATUS_LABELS.suspended,
    icon: AlertTriangle,
    description: "Empleado suspendido temporalmente",
  }),

  terminated: createStatusConfig("danger", {
    label: EMPLOYEE_STATUS_LABELS.terminated,
    icon: XCircle,
    description: "Empleado dado de baja",
  }),
};

// ============================================================================
// TYPED BADGE COMPONENT
// ============================================================================

/**
 * Badge de estado para empleados.
 * Pre-configurado con EMPLOYEE_STATUS_CONFIG.
 *
 * @example
 * <EmployeeStatusBadge status={employee.status} />
 * <EmployeeStatusBadge status={employee.status} showIcon />
 */
export const EmployeeStatusBadge =
  createStatusBadgeComponent(EMPLOYEE_STATUS_CONFIG);

// ============================================================================
// HELPERS
// ============================================================================

export function getEmployeeStatusConfig(status: EmployeeStatus): StatusConfig {
  return EMPLOYEE_STATUS_CONFIG[status];
}

export function getEmployeeStatusLabel(status: EmployeeStatus): string {
  return EMPLOYEE_STATUS_CONFIG[status]?.label ?? status;
}

export function formatEmployeeName(employee: {
  firstName: string;
  lastName: string;
}): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}
