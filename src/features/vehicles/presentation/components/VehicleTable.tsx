/**
 * VehicleTable
 * Clean Architecture - Presentation Layer (Components)
 *
 * Componente de tabla para listar vehículos.
 * Homologado con TripTable y DriverTable.
 *
 * Ubicación: src/features/vehicles/presentation/components/VehicleTable.tsx
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
import type { VehicleListItem, VehicleStatusType } from "../../domain";
import { VEHICLE_TYPE_LABELS } from "../../domain";
import { VehicleStatusBadge } from "../config/vehicleStatusConfig";
import { VehicleActions } from "./VehicleActions";
import { formatBranchLabel } from "@shared/utils/branchSelectUtils";
import { vehiclesCopy } from "../copy";

const listCopy = vehiclesCopy.list.table;

// ============================================================================
// TYPES
// ============================================================================

interface VehicleTableProps {
  vehicles: VehicleListItem[];
  isLoading: boolean;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onChangeStatus?: (id: string, status: VehicleStatusType) => void;
  onMaintenance?: (id: string) => void;
  onDocuments?: (id: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TABLE_HEADERS = [
  { key: "unit", label: "Unidad" },
  { key: "brand", label: "Marca / Modelo" },
  { key: "year", label: "Año" },
  { key: "type", label: "Tipo" },
  { key: "plate", label: "Placa" },
  { key: "branch", label: listCopy.branch },
  { key: "mileage", label: "Kilometraje", className: "text-right" },
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
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20 ml-auto" />
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
          No se encontraron vehículos.
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VehicleTable({
  vehicles,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onChangeStatus,
  onMaintenance,
  onDocuments,
}: VehicleTableProps) {
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
  if (vehicles.length === 0) {
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
          {vehicles.map((vehicle) => (
            <TableRow
              key={vehicle.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onView(vehicle.id)}
            >
              {/* Unidad */}
              <TableCell className="font-medium">
                {vehicle.unitNumber}
              </TableCell>

              {/* Marca / Modelo */}
              <TableCell>
                {vehicle.brand} {vehicle.model}
              </TableCell>

              {/* Año */}
              <TableCell>{vehicle.year}</TableCell>

              {/* Tipo */}
              <TableCell>{VEHICLE_TYPE_LABELS[vehicle.type]}</TableCell>

              {/* Placa */}
              <TableCell className="font-mono">
                {vehicle.licensePlate}
              </TableCell>

              <TableCell className="text-muted-foreground">
                {formatBranchLabel(vehicle.branchName, vehicle.branchCode) ?? "—"}
              </TableCell>

              {/* Kilometraje */}
              <TableCell className="text-right">
                {vehicle.currentMileage} km
              </TableCell>

              {/* Estado */}
              <TableCell>
                <VehicleStatusBadge
                  status={vehicle.status}
                  size="sm"
                  showIcon
                />
              </TableCell>

              {/* Acciones */}
              <TableCell onClick={(e) => e.stopPropagation()}>
                <VehicleActions
                  vehicle={vehicle}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onChangeStatus={onChangeStatus}
                  onMaintenance={onMaintenance}
                  onDocuments={onDocuments}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
