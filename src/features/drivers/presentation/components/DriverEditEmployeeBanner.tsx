import { Link } from "react-router-dom";
import { ExternalLink, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import type { Driver } from "../../domain";
import { formatDriverName } from "../config/driverStatusConfig";
import { driversCopy } from "../copy";
import { employeePrimaryContactDisplay } from "../helpers/employeePrimaryContactDisplay";

const copy = driversCopy.form.edit.employeeBanner;

interface Props {
  driver: Driver;
}

export function DriverEditEmployeeBanner({ driver }: Props) {
  const employee = driver.employee;
  if (!employee) return null;

  const name = formatDriverName(employee);
  const contact = employeePrimaryContactDisplay(employee);

  return (
    <Alert>
      <User className="h-4 w-4" />
      <AlertTitle>{copy.title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{copy.description}</p>
        <dl className="grid gap-1 text-sm">
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted-foreground">Nombre</dt>
            <dd className="font-medium">{name}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted-foreground">No. empleado</dt>
            <dd className="font-mono">{employee.employeeNumber}</dd>
          </div>
          {employee.email ? (
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-muted-foreground">Correo</dt>
              <dd>{employee.email}</dd>
            </div>
          ) : null}
          {contact ? (
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-muted-foreground">Teléfono</dt>
              <dd>{contact}</dd>
            </div>
          ) : null}
        </dl>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/employees/${driver.employeeId}`}>
            {copy.viewProfile}
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
