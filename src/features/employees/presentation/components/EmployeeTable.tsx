/**
 * EmployeeTable
 * Clean Architecture - Presentation Layer (Components)
 *
 * Componente de tabla para listar empleados.
 * Homologado con DriverTable, VehicleTable y UserTable (ordenación + responsive).
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
import { cn } from "@shared/lib/utils/cn";
import type { EmployeeListItem, EmployeeSortOptions } from "../../domain/entities";
import { EmployeeStatusBadge } from "../config/employeeStatusConfig";
import { EMPLOYMENT_TYPE_LABELS } from "../config/employeeConfig";
import { EmployeeActions } from "./EmployeeActions";

export type EmployeeSortableColumn = EmployeeSortOptions["field"];

// ============================================================================
// TYPES
// ============================================================================

interface EmployeeTableProps {
  employees: EmployeeListItem[];
  isLoading: boolean;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onTerminate?: (id: string) => void;
  sortField?: EmployeeSortableColumn;
  sortDirection?: "asc" | "desc";
  onSortChange?: (field: EmployeeSortableColumn) => void;
}

// ============================================================================
// HEADER (ordenación + misma grilla responsive que las celdas)
// ============================================================================

function EmployeeTableHeaderRow({
  sortField,
  sortDirection,
  onSortChange,
}: {
  sortField?: EmployeeSortableColumn;
  sortDirection?: "asc" | "desc";
  onSortChange?: (field: EmployeeSortableColumn) => void;
}) {
  const renderSortableHead = (
    field: EmployeeSortableColumn,
    label: string,
    className?: string,
  ) => {
    const active = sortField === field;
    const asc = sortDirection === "asc";
    return (
      <TableHead
        className={cn(
          onSortChange ? "cursor-pointer select-none hover:bg-muted/50" : undefined,
          className,
        )}
        onClick={onSortChange ? () => onSortChange(field) : undefined}
      >
        <div className="flex items-center gap-1">
          {label}
          {active && onSortChange ? (
            <span className="text-xs tabular-nums">{asc ? "↑" : "↓"}</span>
          ) : null}
        </div>
      </TableHead>
    );
  };

  /** Columnas sin `sort_by` en API (`employeeQuerySchema`): contacto y tipo de contrato. */
  const renderPlainHead = (label: string, className?: string) => (
    <TableHead className={className}>{label}</TableHead>
  );

  return (
    <TableHeader>
      <TableRow>
        {renderSortableHead("first_name", "Empleado")}
        {renderPlainHead("Contacto", "hidden md:table-cell")}
        {renderSortableHead(
          "department",
          "Departamento / Puesto",
          "hidden lg:table-cell",
        )}
        {renderPlainHead("Contrato", "hidden lg:table-cell")}
        {renderSortableHead("hire_date", "Ingreso", "hidden xl:table-cell")}
        {renderSortableHead("status", "Estado")}
        <TableHead className="w-12" />
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
        <TableCell colSpan={7} className="h-24 text-center">
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
  sortField,
  sortDirection,
  onSortChange,
}: EmployeeTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <EmployeeTableHeaderRow
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
          />
          <LoadingSkeleton />
        </Table>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <EmployeeTableHeaderRow
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
          />
          <EmptyState />
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <EmployeeTableHeaderRow
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={onSortChange}
        />
        <TableBody>
          {employees.map((emp) => (
            <TableRow
              key={emp.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onView(emp.id)}
            >
              <TableCell>
                <div className="space-y-0.5">
                  <p className="font-medium">{emp.fullName}</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {emp.employeeNumber}
                  </p>
                </div>
              </TableCell>

              <TableCell className="hidden md:table-cell">
                <div className="space-y-0.5 text-sm">
                  <p>{emp.email || "—"}</p>
                  <p className="text-muted-foreground">{emp.phone || ""}</p>
                </div>
              </TableCell>

              <TableCell className="hidden lg:table-cell">
                <div className="space-y-0.5 text-sm">
                  <p>{emp.department || "—"}</p>
                  <p className="text-muted-foreground">{emp.position || ""}</p>
                </div>
              </TableCell>

              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {EMPLOYMENT_TYPE_LABELS[emp.employmentType]}
              </TableCell>

              <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                {formatDate(emp.hireDate)}
              </TableCell>

              <TableCell>
                <EmployeeStatusBadge status={emp.status} size="sm" showIcon />
              </TableCell>

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
