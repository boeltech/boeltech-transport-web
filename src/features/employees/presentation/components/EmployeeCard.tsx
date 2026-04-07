/**
 * EmployeeCard
 * Clean Architecture - Presentation Layer (Components)
 *
 * Tarjeta para mostrar información resumida de un empleado.
 * Usado en la vista de cards del listado.
 *
 * Ubicación: src/features/employees/presentation/components/EmployeeCard.tsx
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
  UserX,
  Phone,
  Mail,
  Briefcase,
  Calendar,
} from "lucide-react";
import { formatDate } from "@shared/utils/dateUtils";
import type { EmployeeListItem } from "../../domain/entities";
import { EmployeeStatusBadge } from "../config/employeeStatusConfig";
import { EMPLOYMENT_TYPE_LABELS } from "../config/employeeConfig";

// ============================================================================
// TYPES
// ============================================================================

interface EmployeeCardProps {
  employee: EmployeeListItem;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onTerminate?: (id: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EmployeeCard({
  employee,
  onView,
  onEdit,
  onTerminate,
}: EmployeeCardProps) {
  const hasActions = onEdit || onTerminate;
  const isTerminated = employee.status === "terminated";

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={() => onView(employee.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* Avatar & Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold leading-none">{employee.fullName}</h3>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                {employee.employeeNumber}
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
                    onView(employee.id);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalles
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(employee.id);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onTerminate && !isTerminated && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTerminate(employee.id);
                      }}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Dar de baja
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Phone */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {employee.phone || "Sin teléfono"}
            </span>
          </div>

          {/* Email */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate">{employee.email || "Sin email"}</span>
          </div>

          {/* Department */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {employee.department || employee.position || "Sin puesto"}
            </span>
          </div>

          {/* Hire Date */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{formatDate(employee.hireDate)}</span>
          </div>
        </div>

        {/* Employment type */}
        <p className="text-xs text-muted-foreground mt-3">
          {EMPLOYMENT_TYPE_LABELS[employee.employmentType]}
        </p>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex w-full items-center justify-between">
          <EmployeeStatusBadge status={employee.status} />
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onView(employee.id);
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
