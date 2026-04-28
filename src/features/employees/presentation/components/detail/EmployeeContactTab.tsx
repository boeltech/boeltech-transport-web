import { memo } from "react";
import { AlertCircle, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { TabsContent } from "@shared/ui/tabs";
import type { Employee } from "../../../domain/entities";
import { DetailInfoRow } from "./DetailInfoRow";
import {
  formatEmployeeCityStateLine,
  formatEmployeeStreetLine,
} from "../../helpers/employeeDetailFormatters";

export const EmployeeContactTab = memo(function EmployeeContactTab({
  employee,
}: {
  employee: Employee;
}) {
  return (
    <TabsContent value="contact" className="mt-4 space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4" /> Datos de contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DetailInfoRow label="Email" value={employee.email} />
            <DetailInfoRow label="Teléfono" value={employee.phone} />
            <DetailInfoRow label="Celular" value={employee.mobilePhone} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" /> Domicilio
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DetailInfoRow label="Calle" value={formatEmployeeStreetLine(employee)} />
            <DetailInfoRow
              label="Colonia"
              value={
                employee.personalAddress?.neighborhoodName ??
                employee.personalAddress?.satNeighborhoodCode ??
                employee.neighborhood
              }
            />
            <DetailInfoRow
              label="Ciudad / Estado"
              value={formatEmployeeCityStateLine(employee)}
            />
            <DetailInfoRow
              label="C.P."
              value={employee.personalAddress?.postalCode ?? employee.postalCode}
              mono
            />
            <DetailInfoRow
              label="País"
              value={
                employee.personalAddress?.satCountryCode === "MEX"
                  ? "México"
                  : (employee.personalAddress?.country ?? employee.country)
              }
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4" /> Contacto de emergencia
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DetailInfoRow label="Nombre" value={employee.emergencyContactName} />
            <DetailInfoRow label="Teléfono" value={employee.emergencyContactPhone} />
            <DetailInfoRow
              label="Parentesco"
              value={employee.emergencyContactRelationship}
            />
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
});

