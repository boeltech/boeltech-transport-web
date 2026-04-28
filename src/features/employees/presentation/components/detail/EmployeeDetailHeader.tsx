import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Pencil, User, UserX } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import type { Employee } from "../../../domain/entities";
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_VARIANTS } from "../../config/employeeConfig";
import { formatDate } from "@shared/utils/dateUtils";

interface EmployeeDetailHeaderProps {
  employee: Employee;
  employeeId: string;
  canUpdate: boolean;
  canDelete: boolean;
  onTerminateClick: () => void;
}

export const EmployeeDetailHeader = memo(function EmployeeDetailHeader({
  employee,
  employeeId,
  canUpdate,
  canDelete,
  onTerminateClick,
}: EmployeeDetailHeaderProps) {
  const navigate = useNavigate();
  const isTerminated = employee.status === "terminated";

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/employees")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-14 sm:w-14">
            <User className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {employee.fullName}
              </h1>
              <Badge variant={EMPLOYEE_STATUS_VARIANTS[employee.status]}>
                {EMPLOYEE_STATUS_LABELS[employee.status]}
              </Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {employee.employeeNumber}
              {employee.position && ` · ${employee.position}`}
              {employee.department && ` · ${employee.department}`}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Ingreso: {formatDate(employee.hireDate)}
            </p>
          </div>
        </div>
      </div>

      {!isTerminated && (
        <div className="flex w-full items-center justify-end gap-2 lg:w-auto lg:self-start">
          {canUpdate && (
            <Button variant="outline" onClick={() => navigate(`/employees/${employeeId}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={onTerminateClick}>
              <UserX className="mr-2 h-4 w-4" />
              Dar de baja
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

