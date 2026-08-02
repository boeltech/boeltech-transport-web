import { Link } from "react-router-dom";
import { Cpu, User, Users } from "lucide-react";
import { Card, CardContent } from "@shared/ui/card";
import { DetailSection, InfoRow } from "@shared/ui/data-display";
import { formatBranchLabel } from "@shared/utils/branchSelectUtils";
import type { Driver } from "../../domain";
import { employeePrimaryContactDisplay } from "../helpers/employeePrimaryContactDisplay";
import { driversCopy } from "../copy";

const copy = driversCopy.detail;

interface DriverDetailDriverTabProps {
  driver: Driver;
}

export function DriverDetailDriverTab({ driver }: DriverDetailDriverTabProps) {
  const branchId = driver.branchId ?? driver.employee?.branchId ?? null;
  const branchLabel =
    formatBranchLabel(
      driver.branchName ?? driver.employee?.branchName,
      driver.branchCode ?? driver.employee?.branchCode,
    ) ?? null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        <DetailSection
          className="flex h-full min-h-0 flex-col"
          icon={<User className="h-4 w-4" />}
          title={copy.section.contact.title}
          description={copy.section.contact.description}
        >
          <Card className="flex flex-1 flex-col">
            <CardContent className="flex flex-1 flex-col space-y-0 pt-6">
              <InfoRow
                variant="inline"
                label={copy.label.employee}
                value={
                  <Link
                    to={`/employees/${driver.employeeId}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {copy.label.viewEmployee}
                  </Link>
                }
              />
              <InfoRow
                variant="inline"
                label={copy.label.employeeNumber}
                value={driver.employee?.employeeNumber ?? copy.hint.empty}
                copyable={Boolean(driver.employee?.employeeNumber)}
                copyValue={driver.employee?.employeeNumber}
              />
              <InfoRow
                variant="inline"
                label={copy.label.email}
                value={driver.employee?.email ?? copy.hint.empty}
              />
              <InfoRow
                variant="inline"
                label={copy.label.phone}
                value={
                  employeePrimaryContactDisplay(driver.employee) ??
                  copy.hint.empty
                }
              />
              <InfoRow
                variant="inline"
                label={copy.label.branch}
                value={
                  branchId && branchLabel ? (
                    <Link
                      to={`/branches/${branchId}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {branchLabel}
                    </Link>
                  ) : (
                    (branchLabel ?? copy.hint.empty)
                  )
                }
              />
            </CardContent>
          </Card>
        </DetailSection>

        <DetailSection
          className="flex h-full min-h-0 flex-col"
          icon={<Cpu className="h-4 w-4" />}
          title={copy.section.operation.title}
          description={copy.section.operation.description}
        >
          <Card className="flex flex-1 flex-col">
            <CardContent className="flex flex-1 flex-col pt-6">
              <InfoRow
                variant="inline"
                label={copy.label.gpsDevice}
                value={
                  driver.assignedDeviceId ? (
                    <span className="font-mono">{driver.assignedDeviceId}</span>
                  ) : (
                    <span className="text-muted-foreground">
                      {copy.hint.noDevice}
                    </span>
                  )
                }
                copyable={Boolean(driver.assignedDeviceId)}
                copyValue={driver.assignedDeviceId ?? undefined}
                mono={Boolean(driver.assignedDeviceId)}
              />
              <InfoRow
                variant="inline"
                label={copy.label.notes}
                value={
                  driver.notes?.trim() ? (
                    <span className="whitespace-pre-wrap text-sm">
                      {driver.notes}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {copy.hint.noNotes}
                    </span>
                  )
                }
              />
            </CardContent>
          </Card>
        </DetailSection>
      </div>

      <DetailSection
        icon={<Users className="h-4 w-4" />}
        title={copy.section.emergency.title}
        description={copy.section.emergency.description}
      >
        <Card>
          <CardContent className="pt-6">
            {driver.emergencyContactName ? (
              <>
                <InfoRow
                  variant="inline"
                  label={copy.label.emergencyName}
                  value={driver.emergencyContactName}
                />
                <InfoRow
                  variant="inline"
                  label={copy.label.emergencyPhone}
                  value={
                    driver.emergencyContactPhone ? (
                      <a
                        href={`tel:${driver.emergencyContactPhone}`}
                        className="text-primary hover:underline"
                      >
                        {driver.emergencyContactPhone}
                      </a>
                    ) : (
                      copy.hint.empty
                    )
                  }
                />
                <InfoRow
                  variant="inline"
                  label={copy.label.emergencyRelationship}
                  value={
                    driver.emergencyContactRelationship ?? copy.hint.empty
                  }
                />
              </>
            ) : (
              <div className="py-8 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {copy.hint.noEmergencyContact}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {copy.hint.emergencyFromEmployee}{" "}
                  <Link
                    to={`/employees/${driver.employeeId}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {copy.label.viewEmployee}
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </DetailSection>
    </div>
  );
}
