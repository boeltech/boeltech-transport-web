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
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import type { TripListItem } from "../../domain";
import { TripStatusBadge } from "../config/tripStatusConfig";
import {
  getTripInvoicingBadgeConfig,
} from "../uiHelpers";
import { TripActions } from "./TripActions";
import { TripListRouteLabel } from "./TripListRouteLabel";
import { TripOverdueBadge } from "./TripOverdueBadge";
import { formatDate, formatTime } from "@shared/utils/dateUtils";

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
  { key: "invoicing", label: "Facturación" },
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
            <Skeleton className="h-6 w-24" />
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
          {trips.map((trip) => {
            const invoicingConfig = getTripInvoicingBadgeConfig(trip);

            return (
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
                <TripListRouteLabel
                  trip={trip}
                  className="font-medium leading-snug"
                />
              </TableCell>

              {/* Vehículo */}
              <TableCell>{trip.vehicle?.unitNumber || "—"}</TableCell>

              {/* Conductor */}
              <TableCell>{trip.driver?.fullName || "—"}</TableCell>

              {/* Salida */}
              <TableCell>
                <div className="space-y-0.5">
                  <p>
                    {formatDate(
                      trip.scheduledDeparture.toISOString().split("T")[0],
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(trip.scheduledDeparture.toISOString())}
                  </p>
                </div>
              </TableCell>

              {/* Estado */}
              <TableCell>
                <div className="flex flex-wrap items-center gap-1.5">
                  <TripStatusBadge status={trip.status} size="sm" showIcon />
                  <TripOverdueBadge trip={trip} />
                </div>
              </TableCell>

              {/* Facturación */}
              <TableCell>
                <div className="space-y-1">
                  {trip.requiresFiscalAttention ? (
                    <Badge variant="destructive" className="mr-1">
                      Fiscal
                    </Badge>
                  ) : null}
                  <Badge variant={invoicingConfig.variant}>
                    {invoicingConfig.label}
                  </Badge>
                </div>
              </TableCell>

              {/* Acciones */}
              <TableCell onClick={(e) => e.stopPropagation()}>
                <TripActions
                  trip={trip}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSchedule={onSchedule}
                  onCancel={onCancel}
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
