import { driversCopy } from "../copy/driversCopy";

const copy = driversCopy.detail;

interface Props {
  employeeNumber: string | null;
  licenseTypeLabel: string;
  licenseNumber: string;
}

export function DriverDetailHeaderSubtitle({
  employeeNumber,
  licenseTypeLabel,
  licenseNumber,
}: Props) {
  return (
    <div className="space-y-0.5">
      <p className="truncate text-sm text-muted-foreground">
        {employeeNumber
          ? copy.format.employeeLine(employeeNumber)
          : copy.state.noEmployeeNumber}
      </p>
      <p className="truncate text-sm text-muted-foreground">
        <span className="font-mono">
          {copy.format.licenseLine(licenseTypeLabel, licenseNumber)}
        </span>
      </p>
    </div>
  );
}
