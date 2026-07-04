import { employeesCopy } from "../copy";

const copy = employeesCopy.detail;

interface Props {
  employeeNumber: string;
  position: string | null;
  department: string | null;
  isTerminated: boolean;
}

export function EmployeeDetailHeaderSubtitle({
  employeeNumber,
  position,
  department,
  isTerminated,
}: Props) {
  return (
    <div className="space-y-0.5">
      <p className="truncate text-sm text-muted-foreground">
        {copy.format.headerLine(employeeNumber, position, department)}
      </p>
      {isTerminated ? (
        <p className="text-sm text-destructive">
          {copy.state.terminatedRegistration}
        </p>
      ) : null}
    </div>
  );
}
