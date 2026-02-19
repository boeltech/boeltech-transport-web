/**
 * DriverTable Component
 * Clean Architecture - Presentation Layer
 *
 * Tabla para mostrar lista de conductores.
 */

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
import { Badge } from "@shared/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { Skeleton } from "@shared/ui/skeleton";
import { Eye, Edit, Trash2, MoreHorizontal, AlertTriangle } from "lucide-react";
import { type DriverListItem } from "../../domain";
import { DriverStatusBadge } from "./DriverStatusBadge";
import {
  formatDriverName,
  getDaysUntilLicenseExpiration,
  getLicenseExpirationVariant,
} from "../config";

// ============================================================================
// TYPES
// ============================================================================

interface DriverTableProps {
  drivers: DriverListItem[];
  isLoading?: boolean;
  selectedIds?: string[];
  onSelectAll?: () => void;
  onSelectOne?: (id: string) => void;
  isAllSelected?: boolean;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DriverTable({
  drivers,
  isLoading = false,
  selectedIds = [],
  onSelectAll,
  onSelectOne,
  isAllSelected = false,
  onView,
  onEdit,
  onDelete,
}: DriverTableProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));

  // Loading skeleton
  if (isLoading) {
    return <DriverTableSkeleton />;
  }

  // Empty state
  if (drivers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se encontraron conductores</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {onSelectOne && (
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Seleccionar todos"
                />
              </TableHead>
            )}
            <TableHead>Conductor</TableHead>
            <TableHead>Licencia</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-center">Experiencia</TableHead>
            <TableHead className="text-center">Viajes</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver) => {
            const isSelected = selectedIds.includes(driver.id);
            const daysUntilExpiration = getDaysUntilLicenseExpiration(
              driver.licenseExpiration,
            );
            const licenseVariant =
              getLicenseExpirationVariant(daysUntilExpiration);
            const showWarning = daysUntilExpiration <= 30;

            return (
              <TableRow
                key={driver.id}
                className={isSelected ? "bg-muted/50" : undefined}
              >
                {onSelectOne && (
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onSelectOne(driver.id)}
                      aria-label={`Seleccionar ${formatDriverName(driver.employee)}`}
                    />
                  </TableCell>
                )}

                {/* Conductor */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {formatDriverName(driver.employee)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {driver.employee.employeeNumber}
                    </span>
                  </div>
                </TableCell>

                {/* Licencia */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-mono text-sm">
                      {driver.licenseNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Tipo {driver.licenseType}
                    </span>
                  </div>
                </TableCell>

                {/* Vencimiento */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {showWarning && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    <Badge variant={licenseVariant}>
                      {daysUntilExpiration <= 0
                        ? "Vencida"
                        : daysUntilExpiration <= 30
                          ? `${daysUntilExpiration} días`
                          : formatDate(driver.licenseExpiration)}
                    </Badge>
                  </div>
                </TableCell>

                {/* Estado */}
                <TableCell>
                  <DriverStatusBadge status={driver.status} size="sm" />
                </TableCell>

                {/* Experiencia */}
                <TableCell className="text-center">
                  {driver.yearsOfExperience} año
                  {driver.yearsOfExperience !== 1 ? "s" : ""}
                </TableCell>

                {/* Viajes */}
                <TableCell className="text-center font-medium">
                  {driver.totalTrips}
                </TableCell>

                {/* Acciones */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(driver.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(driver.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(driver.id)}
                            className="text-destructive focus:text-destructive"
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
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function DriverTableSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Skeleton className="h-4 w-4" />
            </TableHead>
            <TableHead>Conductor</TableHead>
            <TableHead>Licencia</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-center">Experiencia</TableHead>
            <TableHead className="text-center">Viajes</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-4" />
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-12 mx-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8 mx-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
