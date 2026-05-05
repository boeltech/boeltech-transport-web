import { memo } from "react";
import { Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import type { Employee } from "../../../domain/entities";
import { EMPLOYMENT_TYPE_LABELS } from "../../config/employeeConfig";
import { formatDate } from "@shared/utils/dateUtils";

export const EmployeeEmploymentTab = memo(function EmployeeEmploymentTab({
  employee,
}: {
  employee: Employee;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4" /> Información laboral
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <InfoRow
            variant="inline"
            label="Tipo de contrato"
            value={EMPLOYMENT_TYPE_LABELS[employee.employmentType]}
          />
          <InfoRow variant="inline" label="Departamento" value={employee.department} />
          <InfoRow variant="inline" label="Puesto" value={employee.position} />
          <InfoRow variant="inline" label="Título del trabajo" value={employee.jobTitle} />
          <InfoRow variant="inline" label="Ubicación" value={employee.workLocation} />
          <InfoRow variant="inline" label="Fecha de ingreso" value={formatDate(employee.hireDate)} />
          {employee.terminationDate && (
            <InfoRow
              variant="inline"
              label="Fecha de baja"
              value={formatDate(employee.terminationDate)}
            />
          )}
          {employee.terminationReason && (
            <InfoRow variant="inline" label="Motivo de baja" value={employee.terminationReason} />
          )}
        </CardContent>
      </Card>

      {employee.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">{employee.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

