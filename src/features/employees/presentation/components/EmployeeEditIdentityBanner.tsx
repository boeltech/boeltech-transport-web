import { Link } from "react-router-dom";
import { ExternalLink, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import type { Employee } from "../../domain/entities";
import { employeesCopy } from "../copy";

const copy = employeesCopy.form.edit.identityBanner;
const labels = employeesCopy.detail.label;

interface Props {
  employee: Employee;
}

export function EmployeeEditIdentityBanner({ employee }: Props) {
  return (
    <Alert>
      <User className="h-4 w-4" />
      <AlertTitle>{copy.title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{copy.description}</p>
        <dl className="grid gap-1 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{labels.employeeNumber}</dt>
            <dd className="font-mono font-medium">{employee.employeeNumber}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{labels.fullName}</dt>
            <dd className="font-medium">{employee.fullName}</dd>
          </div>
          {employee.position ? (
            <div>
              <dt className="text-muted-foreground">{labels.position}</dt>
              <dd>{employee.position}</dd>
            </div>
          ) : null}
          {employee.department ? (
            <div>
              <dt className="text-muted-foreground">{labels.department}</dt>
              <dd>{employee.department}</dd>
            </div>
          ) : null}
        </dl>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/employees/${employee.id}`}>
            {copy.viewDetail}
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
