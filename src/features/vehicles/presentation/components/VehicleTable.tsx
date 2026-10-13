/**
 * VehicleTable
 * Clean Architecture - Presentation Layer (Components)
 *
 * Componente de tabla para listar vehículos.
 * Homologado con TripTable y DriverTable.
 * Empty state: solo vía ListPageShell (contrato EntityListTable / D5) —
 * este componente no renderiza empty local; con items=[] retorna null.
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
import type { VehicleListItem } from "../../domain";
import { VEHICLE_TYPE_LABELS } from "../../domain";
import {
  VehicleLifecycleBadge,
  VehicleStatusBadge,
} from "../config/vehicleStatusConfig";
import { VehicleActions } from "./VehicleActions";
import { formatBranchLabel } from "@shared/utils/branchSelectUtils";
import { vehiclesCopy } from "../copy";

const listCopy = vehiclesCopy.list.table;
const formatMileage = vehiclesCopy.detail.format.statMileage;

// ============================================================================
// TYPES
// ============================================================================

interface VehicleTableProps {
  vehicles: VehicleListItem[];
  isLoading: boolean;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onRestore?: (id: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TABLE_HEADERS: { key: string; label: string; className?: string }[] = [
  { key: "unit", label: listCopy.unit },
  { key: "brand", label: listCopy.brandModel },
  { key: "year", label: listCopy.year },
  { key: "type", label: listCopy.type },
  { key: "plate", label: listCopy.plate },
  { key: "branch", label: listCopy.branch },
  { key: "mileage", label: listCopy.mileage, className: "text-right" },
  { key: "status", label: listCopy.status },
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

// ============================================================================
// COMPONENT
// ============================================================================

export function VehicleTable({
  vehicles,
  isLoading,
  onView,
  onEdit,
  onDeactivate,
  onRestore,
}: VehicleTableProps) {
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

  // ListPageShell owns empty; avoid a second EmptyState when items=[] (D5).
  if (vehicles.length === 0) {
    return null;
  }

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
              <TableCell className="font-medium">
                {vehicle.unitNumber}
              </TableCell>

              <TableCell>
                {vehicle.brand} {vehicle.model}
              </TableCell>

              <TableCell>{vehicle.year}</TableCell>

              <TableCell>{VEHICLE_TYPE_LABELS[vehicle.type]}</TableCell>

              <TableCell className="font-mono">
                {vehicle.licensePlate}
              </TableCell>

              <TableCell className="text-muted-foreground">
                {formatBranchLabel(vehicle.branchName, vehicle.branchCode) ??
                  "—"}
              </TableCell>

              <TableCell className="text-right">
                {formatMileage(vehicle.currentMileage)}
              </TableCell>

              <TableCell>
                {vehicle.isActive === false ? (
                  <VehicleLifecycleBadge
                    status="deactivated"
                    size="sm"
                    showIcon
                  />
                ) : (
                  <VehicleStatusBadge
                    status={vehicle.status}
                    size="sm"
                    showIcon
                  />
                )}
              </TableCell>

              <TableCell onClick={(e) => e.stopPropagation()}>
                <VehicleActions
                  vehicle={vehicle}
                  onView={onView}
                  onEdit={onEdit}
                  onDeactivate={onDeactivate}
                  onRestore={onRestore}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
