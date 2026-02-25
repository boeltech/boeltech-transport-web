/**
 * TripTable
 * Clean Architecture - Presentation Layer (Components)
 *
 * Componente de tabla para listar viajes.
 * Homologado con DriverTable y VehicleTable.
 *
 * Ubicación: src/features/trips/presentation/components/TripTable.tsx
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
import type { TripListItem } from "../../domain";
import { TripStatusBadge } from "../config/tripStatusConfig";
import { TripActions } from "./TripActions";

// ============================================================================
// TYPES
// ============================================================================

interface TripTableProps {
  trips: TripListItem[];
  isLoading: boolean;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSchedule?: (id: string) => void;
  onStart?: (id: string) => void;
  onFinish?: (id: string) => void;
  onCancel?: (id: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TABLE_HEADERS = [
  { key: "code", label: "Código" },
  { key: "route", label: "Ruta" },
  { key: "vehicle", label: "Vehículo" },
  { key: "driver", label: "Conductor" },
  { key: "departure", label: "Salida" },
  { key: "status", label: "Estado" },
  { key: "actions", label: "", className: "w-12" },
];

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-20" />
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
          No se encontraron viajes.
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TripTable({
  trips,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onSchedule,
  onStart,
  onFinish,
  onCancel,
}: TripTableProps) {
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
  if (trips.length === 0) {
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
          {trips.map((trip) => (
            <TableRow
              key={trip.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onView(trip.id)}
            >
              {/* Código */}
              <TableCell className="font-medium font-mono">
                {trip.tripCode}
              </TableCell>

              {/* Ruta */}
              <TableCell>
                <div className="space-y-0.5">
                  <p className="font-medium">{trip.originCity}</p>
                  <p className="text-sm text-muted-foreground">
                    → {trip.destinationCity}
                  </p>
                </div>
              </TableCell>

              {/* Vehículo */}
              <TableCell>{trip.vehicle?.unitNumber || "—"}</TableCell>

              {/* Conductor */}
              <TableCell>{trip.driver?.fullName || "—"}</TableCell>

              {/* Salida */}
              <TableCell>
                <div className="space-y-0.5">
                  <p>{formatDate(trip.scheduledDeparture)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(trip.scheduledDeparture)}
                  </p>
                </div>
              </TableCell>

              {/* Estado */}
              <TableCell>
                <TripStatusBadge status={trip.status} size="sm" showIcon />
              </TableCell>

              {/* Acciones */}
              <TableCell onClick={(e) => e.stopPropagation()}>
                <TripActions
                  trip={trip}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSchedule={onSchedule}
                  onStart={onStart}
                  onFinish={onFinish}
                  onCancel={onCancel}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
