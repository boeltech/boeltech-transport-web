import { memo } from "react";
import { Building2, CreditCard } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import type { Employee } from "../../../domain/entities";
import { PAYMENT_METHOD_LABELS, SALARY_TYPE_LABELS } from "../../config/employeeConfig";
import { formatMxCurrency } from "../../helpers/employeeDetailFormatters";
import { employeesCopy } from "../../copy";

const copy = employeesCopy.detail;

export const EmployeeCompensationTab = memo(function EmployeeCompensationTab({
  employee,
}: {
  employee: Employee;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 shrink-0 text-primary" />
            {copy.section.compensation.title}
          </CardTitle>
          <CardDescription>{copy.section.compensation.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <InfoRow
            variant="inline"
            label={copy.label.baseSalary}
            value={formatMxCurrency(employee.baseSalary)}
          />
          <InfoRow
            variant="inline"
            label={copy.label.salaryType}
            value={
              employee.salaryType ? SALARY_TYPE_LABELS[employee.salaryType] : null
            }
          />
          <InfoRow
            variant="inline"
            label={copy.label.paymentMethod}
            value={
              employee.paymentMethod
                ? PAYMENT_METHOD_LABELS[employee.paymentMethod]
                : null
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 shrink-0 text-primary" />
            {copy.section.banking.title}
          </CardTitle>
          <CardDescription>{copy.section.banking.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <InfoRow variant="inline" label={copy.label.bankName} value={employee.bankName} />
          <InfoRow
            variant="inline"
            label={copy.label.bankAccount}
            value={employee.bankAccountNumber}
            mono
            copyable
          />
          <InfoRow
            variant="inline"
            label={copy.label.bankClabe}
            value={employee.bankClabe}
            mono
            copyable
          />
        </CardContent>
      </Card>
    </div>
  );
});
