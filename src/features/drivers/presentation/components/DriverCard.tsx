/**
 * DriverCard
 * Clean Architecture - Presentation Layer (Components)
 *
 * Tarjeta para mostrar información resumida de un conductor.
 * Usado en la vista de cards del listado.
 *
 * Ubicación: src/features/drivers/presentation/components/DriverCard.tsx
 */

import { Card, CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import {
  User,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Phone,
  CreditCard,
  Calendar,
  Truck,
  AlertTriangle,
} from "lucide-react";
import type { DriverListItem, DriverStatusType } from "../../domain";
import { DriverStatusBadge } from "../config/driverStatusConfig";
import {
  getDaysUntilLicenseExpiration,
  formatDriverName,
} from "../config/driverStatusConfig";

// ============================================================================
// TYPES
// ============================================================================

interface DriverCardProps {
  driver: DriverListItem;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onChangeStatus?: (id: string, status: DriverStatusType) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DriverCard({
  driver,
  onView,
  onEdit,
  onDelete,
}: DriverCardProps) {
  const hasActions = onEdit || onDelete;
  const fullName = formatDriverName(driver.employee);

  const daysUntilExpiration = getDaysUntilLicenseExpiration(
    driver.licenseExpiry,
  );
  const isExpired = daysUntilExpiration <= 0;
  const isExpiringSoon = daysUntilExpiration > 0 && daysUntilExpiration <= 30;

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={() => onView(driver.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* Avatar & Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-none">{fullName}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {driver.employee.employeeNumber}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          {hasActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Acciones</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(driver.id);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalles
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(driver.id);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(driver.id);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Driver Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Phone */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {driver.employee.phone || "Sin teléfono"}
            </span>
          </div>

          {/* License Number */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-4 w-4 shrink-0" />
            <span className="font-mono truncate">{driver.licenseNumber}</span>
          </div>

          {/* License Expiration */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span
              className={
                isExpired
                  ? "text-destructive"
                  : isExpiringSoon
                    ? "text-amber-600 dark:text-amber-500"
                    : ""
              }
            >
              {formatDate(driver.licenseExpiry)}
            </span>
            {(isExpired || isExpiringSoon) && (
              <AlertTriangle
                className={`h-3 w-3 ${
                  isExpired
                    ? "text-destructive"
                    : "text-amber-600 dark:text-amber-500"
                }`}
              />
            )}
          </div>

          {/* Total Trips */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Truck className="h-4 w-4 shrink-0" />
            <span>{driver.totalTrips} viajes</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex w-full items-center justify-between">
          <DriverStatusBadge status={driver.status} />
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onView(driver.id);
            }}
          >
            Ver más
            <Eye className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
