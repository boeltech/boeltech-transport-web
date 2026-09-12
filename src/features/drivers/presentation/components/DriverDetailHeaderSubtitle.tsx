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

  const secondaryLine = jurisdictionLabel
    ? `${licenseLine} · ${jurisdictionLabel}`
    : licenseLine;

  return (
    <div className="space-y-0.5">
      <p className="truncate text-sm text-muted-foreground">
        {employeeNumber
          ? copy.format.employeeLine(employeeNumber)
          : copy.state.noEmployeeNumber}
      </p>
      <p className="truncate font-mono text-xs text-muted-foreground">
        {secondaryLine}
      </p>
    </div>
  );
}
