import { memo } from "react";
import { Building2, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import type { Employee } from "../../../domain/entities";
import { PAYMENT_METHOD_LABELS, SALARY_TYPE_LABELS } from "../../config/employeeConfig";
import { formatMxCurrency } from "../../helpers/employeeDetailFormatters";

export const EmployeeCompensationTab = memo(function EmployeeCompensationTab({
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
              <CreditCard className="h-4 w-4" /> Compensación
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow variant="inline" label="Salario base" value={formatMxCurrency(employee.baseSalary)} />
            <InfoRow
              variant="inline"
              label="Frecuencia de pago"
              value={employee.salaryType ? SALARY_TYPE_LABELS[employee.salaryType] : null}
            />
            <InfoRow
              variant="inline"
              label="Método de pago"
              value={
                employee.paymentMethod ? PAYMENT_METHOD_LABELS[employee.paymentMethod] : null
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" /> Datos bancarios
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow variant="inline" label="Banco" value={employee.bankName} />
            <InfoRow
              variant="inline"
              label="No. de cuenta"
              value={employee.bankAccountNumber}
              mono
              copyable
            />
            <InfoRow variant="inline" label="CLABE" value={employee.bankClabe} mono copyable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

