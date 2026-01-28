/**
 * TripTable Component
 * Clean Architecture - Presentation Layer
 */

import { memo } from "react";
import { Link } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Checkbox } from "@shared/ui/checkbox";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { Skeleton } from "@shared/ui/skeleton";
import { TripStatusBadge } from "./TripStatusBadge";
import {
  type Trip,
  type SortOptions,
  TripStatus,
} from "@features/trips/domain";
import { canDeleteTrip, canEditTrip } from "../../domain/rules";
import { formatDisplayDate } from "../uiHelpers";
import {
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Pencil,
  Play,
  CheckCircle,
  XCircle,
  Trash2,
} from "lucide-react";

interface TripTableProps {
  trips: Trip[];
  isLoading?: boolean;
  sort?: SortOptions;
  onSort?: (field: SortOptions["field"]) => void;
  selectedIds?: string[];
  onSelectAll?: () => void;
  onSelectOne?: (id: string) => void;
  isAllSelected?: boolean;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStart?: (id: string) => void;
  onFinish?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const COLUMNS = [
  { key: "tripCode", label: "Código", sortable: true },
  { key: "status", label: "Estado", sortable: true },
  { key: "client", label: "Cliente", sortable: false },
  { key: "vehicle", label: "Unidad", sortable: false },
  { key: "driver", label: "Conductor", sortable: false },
  { key: "departureDate", label: "Salida", sortable: true },
  { key: "createdAt", label: "Creado", sortable: true },
  { key: "actions", label: "", sortable: false },
];

export const TripTable = memo(function TripTable({
  trips,
  isLoading,
  sort,
  onSort,
  selectedIds = [],
  onSelectAll,
  onSelectOne,
  isAllSelected,
  onView,
  onEdit,
  onDelete,
  onStart,
  onFinish,
  onCancel,
}: TripTableProps) {
  if (isLoading) return <TripTableSkeleton />;

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"
            />
          </svg>
        </div>
        <h3 className="font-medium text-lg mb-1">No hay viajes</h3>
        <p className="text-sm text-muted-foreground">
          No se encontraron viajes con los filtros actuales.
        </p>
      </div>
    );
  }

  const renderSortIcon = (field: string, sortable: boolean) => {
    if (!sortable) return null;
    if (sort?.field !== field)
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
    return sort.direction === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {onSelectAll && (
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
            )}
            {COLUMNS.map((col) => (
              <TableHead
                key={col.key}
                className={cn(col.sortable && "cursor-pointer select-none")}
                onClick={() =>
                  col.sortable && onSort?.(col.key as SortOptions["field"])
                }
              >
                <div className="flex items-center">
                  {col.label}
                  {renderSortIcon(col.key, col.sortable)}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => (
            <TripTableRow
              key={trip.id}
              trip={trip}
              isSelected={selectedIds.includes(trip.id)}
              onSelect={onSelectOne}
              showCheckbox={!!onSelectAll}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onStart={onStart}
              onFinish={onFinish}
              onCancel={onCancel}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

interface TripTableRowProps {
  trip: Trip;
  isSelected: boolean;
  onSelect?: (id: string) => void;
  showCheckbox: boolean;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStart?: (id: string) => void;
  onFinish?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const TripTableRow = memo(function TripTableRow({
  trip,
  isSelected,
  onSelect,
  showCheckbox,
  onView,
  onEdit,
  onDelete,
  onStart,
  onFinish,
  onCancel,
}: TripTableRowProps) {
  const canEdit = canEditTrip(trip.status);
  const canDelete = canDeleteTrip(trip.status);
  const canStart = trip.status === TripStatus.SCHEDULED;
  const canFinish = trip.status === TripStatus.IN_PROGRESS;
  const canCancel =
    trip.status === TripStatus.SCHEDULED ||
    trip.status === TripStatus.IN_PROGRESS;

  return (
    <TableRow className={cn(isSelected && "bg-muted/50")}>
      {showCheckbox && (
        <TableCell>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect?.(trip.id)}
          />
        </TableCell>
      )}
      <TableCell className="font-medium">
        <Link
          to={`/trips/${trip.id}`}
          className="hover:text-primary hover:underline"
        >
          {trip.tripCode}
        </Link>
      </TableCell>
      <TableCell>
        <TripStatusBadge status={trip.status} size="sm" />
      </TableCell>
      <TableCell className="max-w-[200px] truncate">
        {trip.client?.legalName || "-"}
      </TableCell>
      <TableCell>{trip.vehicle?.licensePlate || "-"}</TableCell>
      <TableCell className="max-w-[150px] truncate">
        {trip.driver?.fullName || "-"}
      </TableCell>
      <TableCell>{formatDisplayDate(trip.scheduledDeparture)}</TableCell>
      <TableCell className="text-muted-foreground">
        {formatDisplayDate(trip.createdAt)}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView?.(trip.id)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver
            </DropdownMenuItem>
            {canEdit && onEdit && (
              <DropdownMenuItem onClick={() => onEdit(trip.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {canStart && onStart && (
              <DropdownMenuItem onClick={() => onStart(trip.id)}>
                <Play className="mr-2 h-4 w-4 text-amber-500" />
                Iniciar
              </DropdownMenuItem>
            )}
            {canFinish && onFinish && (
              <DropdownMenuItem onClick={() => onFinish(trip.id)}>
                <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                Finalizar
              </DropdownMenuItem>
            )}
            {canCancel && onCancel && (
              <DropdownMenuItem onClick={() => onCancel(trip.id)}>
                <XCircle className="mr-2 h-4 w-4 text-amber-600" />
                Cancelar
              </DropdownMenuItem>
            )}
            {canDelete && onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(trip.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

function TripTableSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableHead key={col.key}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {COLUMNS.map((col) => (
                <TableCell key={col.key}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
