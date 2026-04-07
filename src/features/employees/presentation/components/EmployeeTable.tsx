/**
 * EmployeeTable
 * Clean Architecture - Presentation Layer (Components)
 *
 * Componente de tabla para listar empleados.
 * Homologado con DriverTable y VehicleTable.
 *
 * Ubicación: src/features/employees/presentation/components/EmployeeTable.tsx
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Skeleton } from "@shared/ui/skeleton";
import { formatDate } from "@shared/utils/dateUtils";
import type { EmployeeListItem } from "../../domain/entities";
import { EmployeeStatusBadge } from "../config/employeeStatusConfig";
import { EMPLOYMENT_TYPE_LABELS } from "../config/employeeConfig";
import { EmployeeActions } from "./EmployeeActions";

// ============================================================================
// TYPES
// ============================================================================

interface EmployeeTableProps {
  employees: EmployeeListItem[];
  isLoading: boolean;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onTerminate?: (id: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TABLE_HEADERS = [
  { key: "name", label: "Empleado" },
  { key: "contact", label: "Contacto", className: "hidden md:table-cell" },
  { key: "dept", label: "Departamento / Puesto", className: "hidden lg:table-cell" },
  { key: "type", label: "Contrato", className: "hidden lg:table-cell" },
  { key: "hire", label: "Ingreso", className: "hidden xl:table-cell" },
  { key: "status", label: "Estado" },
  { key: "actions", label: "", className: "w-12" },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TableHeaderRow() {
  return (
    <TableHeader>
      <TableRow>
        {TABLE_HEADERS.map((h) => (
          <TableHead key={h.key} className={h.className}>
            {h.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

function LoadingSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="space-y-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell className="hidden lg:table-cell">
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </TableCell>
          <TableCell className="hidden lg:table-cell">
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell className="hidden xl:table-cell">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

function EmptyState() {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={TABLE_HEADERS.length} className="h-24 text-center">
          No se encontraron empleados.
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EmployeeTable({
  employees,
  isLoading,
  onView,
  onEdit,
  onTerminate,
}: EmployeeTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeaderRow />
          <LoadingSkeleton />
        </Table>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeaderRow />
          <EmptyState />
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeaderRow />
        <TableBody>
          {employees.map((emp) => (
            <TableRow
              key={emp.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onView(emp.id)}
            >
              {/* Empleado */}
              <TableCell>
                <div className="space-y-0.5">
                  <p className="font-medium">{emp.fullName}</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {emp.employeeNumber}
                  </p>
                </div>
              </TableCell>

              {/* Contacto */}
              <TableCell className="hidden md:table-cell">
                <div className="space-y-0.5 text-sm">
                  <p>{emp.email || "—"}</p>
                  <p className="text-muted-foreground">{emp.phone || ""}</p>
                </div>
              </TableCell>

              {/* Departamento / Puesto */}
              <TableCell className="hidden lg:table-cell">
                <div className="space-y-0.5 text-sm">
                  <p>{emp.department || "—"}</p>
                  <p className="text-muted-foreground">{emp.position || ""}</p>
                </div>
              </TableCell>

              {/* Tipo contrato */}
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {EMPLOYMENT_TYPE_LABELS[emp.employmentType]}
              </TableCell>

              {/* Fecha ingreso */}
              <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                {formatDate(emp.hireDate)}
              </TableCell>

              {/* Estado */}
              <TableCell>
                <EmployeeStatusBadge status={emp.status} size="sm" showIcon />
              </TableCell>

              {/* Acciones */}
              <TableCell onClick={(e) => e.stopPropagation()}>
                <EmployeeActions
                  employee={emp}
                  onView={onView}
                  onEdit={onEdit}
                  onTerminate={onTerminate}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
