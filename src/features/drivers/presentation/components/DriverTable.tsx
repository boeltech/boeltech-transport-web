/**
 * DriverTable
 * Clean Architecture - Presentation Layer (Components)
 *
 * Componente de tabla para listar conductores.
 * Homologado con TripTable y VehicleTable.
 *
 * Ubicación: src/features/drivers/presentation/components/DriverTable.tsx
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
import { AlertTriangle } from "lucide-react";
import type { DriverListItem, DriverStatusType } from "../../domain";
import { DriverStatusBadge } from "../config/driverStatusConfig";
import { DriverActions } from "./DriverActions";
import { formatDate, isExpired, isExpiringSoon } from "@shared/utils/dateUtils";

// ============================================================================
// TYPES
// ============================================================================

interface DriverTableProps {
  drivers: DriverListItem[];
  isLoading: boolean;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onChangeStatus?: (id: string, status: DriverStatusType) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TABLE_HEADERS = [
  { key: "name", label: "Nombre" },
  { key: "phone", label: "Teléfono" },
  { key: "license", label: "Licencia" },
  { key: "expiration", label: "Vencimiento" },
  { key: "trips", label: "Viajes", className: "text-right" },
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
        {TABLE_HEADERS.map((header) => (
          <TableHead key={header.key} className={header.className}>
            {header.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

function LoadingSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12 ml-auto" />
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
          No se encontraron conductores.
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DriverTable({
  drivers,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onChangeStatus,
}: DriverTableProps) {
  // Loading state
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

  // Empty state
  if (drivers.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeaderRow />
          <EmptyState />
        </Table>
      </div>
    );
  }

  // Data table
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeaderRow />
        <TableBody>
          {drivers.map((driver) => {
            const expiringSoon = isExpiringSoon(driver.licenseExpiry);
            const expired = isExpired(driver.licenseExpiry);

            return (
              <TableRow
                key={driver.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onView(driver.id)}
              >
                {/* Nombre */}
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="font-medium">
                      {`${driver.employee.firstName} ${driver.employee.lastName}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {driver.employee.email}
                    </p>
                  </div>
                </TableCell>

                {/* Teléfono */}
                <TableCell>{driver.employee.phone || "—"}</TableCell>

                {/* Licencia */}
                <TableCell className="font-mono">
                  {driver.licenseNumber}
                </TableCell>

                {/* Vencimiento */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        expired
                          ? "text-destructive"
                          : expiringSoon
                            ? "text-amber-600 dark:text-amber-500"
                            : ""
                      }
                    >
                      {formatDate(driver.licenseExpiry)}
                    </span>
                    {(expiringSoon || expired) && (
                      <AlertTriangle
                        className={`h-4 w-4 ${
                          expired
                            ? "text-destructive"
                            : "text-amber-600 dark:text-amber-500"
                        }`}
                      />
                    )}
                  </div>
                </TableCell>

                {/* Viajes */}
                <TableCell className="text-right">
                  {driver.totalTrips ?? 0}
                </TableCell>

                {/* Estado */}
                <TableCell>
                  <DriverStatusBadge
                    status={driver.status}
                    size="sm"
                    showIcon
                  />
                </TableCell>

                {/* Acciones */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DriverActions
                    driver={driver}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onChangeStatus={onChangeStatus}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
