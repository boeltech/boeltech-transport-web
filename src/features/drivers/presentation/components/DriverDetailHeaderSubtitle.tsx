import { Badge } from "@shared/ui/badge";
import type { DriverLicenseJurisdiction } from "../../domain";
import { driversCopy } from "../copy/driversCopy";

const copy = driversCopy.detail;

interface Props {
  employeeNumber: string | null;
  licenseTypeLabel: string;
  licenseNumber: string;
  jurisdiction: DriverLicenseJurisdiction;
}

export function DriverDetailHeaderSubtitle({
  employeeNumber,
  licenseTypeLabel,
  licenseNumber,
  jurisdiction,
}: Props) {
  const jurisdictionLabel =
    jurisdiction === "federal"
      ? copy.jurisdiction.federal
      : jurisdiction === "state"
        ? copy.jurisdiction.stateOnly
        : jurisdiction === "both"
          ? copy.jurisdiction.both
          : null;

  const licenseLine =
    licenseNumber.trim().length > 0
      ? copy.format.licenseLine(licenseTypeLabel, licenseNumber)
      : copy.hint.empty;

  return (
    <div className="space-y-1">
      <p className="truncate text-sm text-muted-foreground">
        {employeeNumber
          ? copy.format.employeeLine(employeeNumber)
          : copy.state.noEmployeeNumber}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <p className="truncate text-sm text-muted-foreground">
          <span className="font-mono">{licenseLine}</span>
        </p>
        {jurisdictionLabel ? (
          <Badge
            variant={jurisdiction === "state" ? "secondary" : "outline"}
            className="text-[10px] font-normal"
          >
            {jurisdictionLabel}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
