/**
 * EmployeeCard
 *
 * Tarjeta de empleado para vista en grid.
 * Menú ⋯ vía EntityListCard (usable sin hover — D2).
 */

import { CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import {
  EntityListCard,
  entityListCardMenuTriggerClassName,
} from "@shared/ui/listing";
import {
  User,
  Phone,
  Mail,
  Briefcase,
  Calendar,
} from "lucide-react";
import { formatDate } from "@shared/utils/dateUtils";
import { cn } from "@shared/lib/utils/cn";

import type { EmployeeListItem } from "../../domain/entities";
import { EmployeeStatusBadge } from "../config/employeeStatusConfig";
import { EMPLOYMENT_TYPE_LABELS } from "../config/employeeConfig";
import { employeesCopy } from "../copy/employeesCopy";
import { EmployeeActions } from "./EmployeeActions";

interface EmployeeCardProps {
  employee: EmployeeListItem;
  onView: (id: string) => void;
  className?: string;
}

export function EmployeeCard({
  employee,
  onView,
  className,
}: EmployeeCardProps) {
  const isTerminated = employee.status === "terminated";

  return (
    <EntityListCard
      className={cn(isTerminated && "opacity-60", className)}
      onClick={() => onView(employee.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold leading-none">
                {employee.fullName}
              </h3>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {employee.employeeNumber}
              </p>
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <EmployeeActions
              employee={employee}
              variant="dropdown"
              menuTriggerClassName={entityListCardMenuTriggerClassName}
              menuAriaLabel={employeesCopy.list.card.actionsAria}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {employee.phone || "Sin teléfono"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate">{employee.email || "Sin email"}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {employee.department || employee.position || "Sin puesto"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{formatDate(employee.hireDate)}</span>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {EMPLOYMENT_TYPE_LABELS[employee.employmentType]}
        </p>
      </CardContent>

      <CardFooter className="border-t pt-3">
        <EmployeeStatusBadge status={employee.status} />
      </CardFooter>
    </EntityListCard>
  );
}
