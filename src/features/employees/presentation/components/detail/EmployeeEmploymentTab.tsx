import { memo } from "react";
import { Briefcase, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { TabsContent } from "@shared/ui/tabs";
import type { Employee } from "../../../domain/entities";
import { EMPLOYMENT_TYPE_LABELS } from "../../config/employeeConfig";
import { formatDate, formatDateTime } from "@shared/utils/dateUtils";
import { DetailInfoRow } from "./DetailInfoRow";

export const EmployeeEmploymentTab = memo(function EmployeeEmploymentTab({
  employee,
}: {
  employee: Employee;
}) {
  return (
    <TabsContent value="employment" className="mt-4 space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4" /> Información laboral
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DetailInfoRow
              label="Tipo de contrato"
              value={EMPLOYMENT_TYPE_LABELS[employee.employmentType]}
            />
            <DetailInfoRow label="Departamento" value={employee.department} />
            <DetailInfoRow label="Puesto" value={employee.position} />
            <DetailInfoRow label="Título del trabajo" value={employee.jobTitle} />
            <DetailInfoRow label="Ubicación" value={employee.workLocation} />
            <DetailInfoRow label="Fecha de ingreso" value={formatDate(employee.hireDate)} />
            {employee.terminationDate && (
              <DetailInfoRow
                label="Fecha de baja"
                value={formatDate(employee.terminationDate)}
              />
            )}
            {employee.terminationReason && (
              <DetailInfoRow
                label="Motivo de baja"
                value={employee.terminationReason}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" /> Auditoría
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DetailInfoRow label="Registrado" value={formatDateTime(employee.createdAt)} />
            <DetailInfoRow
              label="Última modificación"
              value={formatDateTime(employee.updatedAt)}
            />
          </CardContent>
        </Card>
      </div>

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
    </TabsContent>
  );
});

