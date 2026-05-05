import { memo } from "react";
import { Hash, Heart, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import type { Employee } from "../../../domain/entities";
import { GENDER_LABELS, MARITAL_STATUS_LABELS } from "../../config/employeeConfig";
import { formatDate } from "@shared/utils/dateUtils";

export const EmployeePersonalTab = memo(function EmployeePersonalTab({
  employee,
}: {
  employee: Employee;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" /> Información personal
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow variant="inline" label="Nombre completo" value={employee.fullName} />
            <InfoRow
              variant="inline"
              label="Fecha de nacimiento"
              value={employee.birthDate ? formatDate(employee.birthDate) : null}
            />
            <InfoRow
              variant="inline"
              label="Género"
              value={employee.gender ? GENDER_LABELS[employee.gender] : null}
            />
            <InfoRow
              variant="inline"
              label="Estado civil"
              value={employee.maritalStatus ? MARITAL_STATUS_LABELS[employee.maritalStatus] : null}
            />
            <InfoRow variant="inline" label="Nacionalidad" value={employee.nationality} />
            <InfoRow variant="inline" label="Lugar de nacimiento" value={employee.birthPlace} />
            <InfoRow variant="inline" label="Tipo de sangre" value={employee.bloodType} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Hash className="h-4 w-4" /> Datos fiscales / gobierno
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow variant="inline" label="CURP" value={employee.curp} mono copyable />
            <InfoRow variant="inline" label="RFC" value={employee.rfc} mono copyable />
            <InfoRow variant="inline" label="NSS" value={employee.nss} mono copyable />
            <InfoRow variant="inline" label="Infonavit" value={employee.infonavitNumber} mono />
          </CardContent>
        </Card>
      </div>

      {employee.medicalNotes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-4 w-4" /> Notas médicas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">{employee.medicalNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

