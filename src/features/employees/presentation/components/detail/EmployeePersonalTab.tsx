import { memo } from "react";
import { Hash, Heart, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import type { Employee } from "../../../domain/entities";
import { GENDER_LABELS, MARITAL_STATUS_LABELS } from "../../config/employeeConfig";
import { formatDate } from "@shared/utils/dateUtils";
import { employeesCopy } from "../../copy";

const copy = employeesCopy.detail;

function fmtOptional(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const EmployeePersonalTab = memo(function EmployeePersonalTab({
  employee,
}: {
  employee: Employee;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 shrink-0 text-primary" />
              {copy.section.personal.title}
            </CardTitle>
            <CardDescription>{copy.section.personal.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow
              variant="inline"
              label={copy.label.fullName}
              value={employee.fullName}
            />
            <InfoRow
              variant="inline"
              label={copy.label.birthDate}
              value={
                employee.birthDate ? formatDate(employee.birthDate) : null
              }
            />
            <InfoRow
              variant="inline"
              label={copy.label.gender}
              value={
                employee.gender ? GENDER_LABELS[employee.gender] : null
              }
            />
            <InfoRow
              variant="inline"
              label={copy.label.maritalStatus}
              value={
                employee.maritalStatus
                  ? MARITAL_STATUS_LABELS[employee.maritalStatus]
                  : null
              }
            />
            <InfoRow
              variant="inline"
              label={copy.label.nationality}
              value={fmtOptional(employee.nationality)}
            />
            <InfoRow
              variant="inline"
              label={copy.label.birthPlace}
              value={fmtOptional(employee.birthPlace)}
            />
            <InfoRow
              variant="inline"
              label={copy.label.bloodType}
              value={fmtOptional(employee.bloodType)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Hash className="h-4 w-4 shrink-0 text-primary" />
              {copy.section.fiscal.title}
            </CardTitle>
            <CardDescription>{copy.section.fiscal.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow
              variant="inline"
              label={copy.label.curp}
              value={fmtOptional(employee.curp)}
              mono
              copyable
            />
            <InfoRow
              variant="inline"
              label={copy.label.rfc}
              value={fmtOptional(employee.rfc)}
              mono
              copyable
            />
            <InfoRow
              variant="inline"
              label={copy.label.nss}
              value={fmtOptional(employee.nss)}
              mono
              copyable
            />
            <InfoRow
              variant="inline"
              label={copy.label.infonavit}
              value={fmtOptional(employee.infonavitNumber)}
              mono
            />
          </CardContent>
        </Card>
      </div>

      {employee.medicalNotes?.trim() ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-4 w-4 shrink-0 text-primary" />
              {copy.section.medicalNotes.title}
            </CardTitle>
            <CardDescription>
              {copy.section.medicalNotes.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              {employee.medicalNotes}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
});
