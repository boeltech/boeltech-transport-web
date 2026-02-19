/**
 * DriverCard Component
 * Clean Architecture - Presentation Layer
 *
 * Tarjeta que muestra información resumida de un conductor.
 */

import { Card, CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import {
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Award,
} from "lucide-react";
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

interface DriverCardProps {
  driver: DriverListItem;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
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
  const daysUntilExpiration = getDaysUntilLicenseExpiration(
    driver.licenseExpiration,
  );
  const licenseVariant = getLicenseExpirationVariant(daysUntilExpiration);
  const isLicenseExpiringSoon =
    daysUntilExpiration <= 30 && daysUntilExpiration > 0;
  const isLicenseExpired = daysUntilExpiration <= 0;

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg leading-none">
              {formatDriverName(driver.employee)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {driver.employee.employeeNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DriverStatusBadge status={driver.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
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
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Licencia */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Award className="h-4 w-4" />
            <span>Licencia {driver.licenseType}</span>
          </div>
          <span className="font-mono text-xs">{driver.licenseNumber}</span>
        </div>

        {/* Vencimiento de licencia */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Vencimiento</span>
          </div>
          <div className="flex items-center gap-2">
            {(isLicenseExpiringSoon || isLicenseExpired) && (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <Badge variant={licenseVariant}>
              {isLicenseExpired
                ? "Vencida"
                : isLicenseExpiringSoon
                  ? `${daysUntilExpiration} días`
                  : formatDate(driver.licenseExpiration)}
            </Badge>
          </div>
        </div>

        {/* Contacto */}
        {driver.employee.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{driver.employee.phone}</span>
          </div>
        )}

        {driver.employee.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{driver.employee.email}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 border-t">
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
          <span>
            {driver.yearsOfExperience} año
            {driver.yearsOfExperience !== 1 ? "s" : ""} de experiencia
          </span>
          <span>
            {driver.totalTrips} viaje{driver.totalTrips !== 1 ? "s" : ""}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

export function DriverCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-6 w-20 bg-muted animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
      </CardContent>
      <CardFooter className="pt-2 border-t">
        <div className="flex justify-between w-full">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
        </div>
      </CardFooter>
    </Card>
  );
}
