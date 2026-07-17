import { memo } from "react";
import { Briefcase } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import type { Employee } from "../../../domain/entities";
import { EMPLOYMENT_TYPE_LABELS } from "../../config/employeeConfig";
import { formatDate } from "@shared/utils/dateUtils";
import { employeesCopy } from "../../copy";
import { formatEmployeeBranchLabel } from "../../utils/branchSelectUtils";

const copy = employeesCopy.detail;

export const EmployeeEmploymentTab = memo(function EmployeeEmploymentTab({
  employee,
}: {
  employee: Employee;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4 shrink-0 text-primary" />
            {copy.section.employment.title}
          </CardTitle>
          <CardDescription>{copy.section.employment.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <InfoRow
            variant="inline"
            label={copy.label.employmentType}
            value={EMPLOYMENT_TYPE_LABELS[employee.employmentType]}
          />
          <InfoRow
            variant="inline"
            label={copy.label.department}
            value={employee.department}
          />
          <InfoRow variant="inline" label={copy.label.position} value={employee.position} />
          <InfoRow
            variant="inline"
            label={copy.label.jobTitle}
            value={employee.jobTitle}
          />
          <InfoRow
            variant="inline"
            label={copy.label.workLocation}
            value={formatEmployeeBranchLabel(
              employee.branchName,
              employee.branchCode,
              employee.workLocation,
            )}
          />
          <InfoRow
            variant="inline"
            label={copy.label.hireDate}
            value={formatDate(employee.hireDate)}
          />
          {employee.terminationDate ? (
            <InfoRow
              variant="inline"
              label={copy.label.terminationDate}
              value={formatDate(employee.terminationDate)}
            />
          ) : null}
          {employee.terminationReason ? (
            <InfoRow
              variant="inline"
              label={copy.label.terminationReason}
              value={employee.terminationReason}
            />
          ) : null}
        </CardContent>
      </Card>

      {employee.notes?.trim() ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{copy.section.notes.title}</CardTitle>
            <CardDescription>{copy.section.notes.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">{employee.notes}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
});
