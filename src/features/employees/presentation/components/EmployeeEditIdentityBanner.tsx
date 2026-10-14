import { Link } from "react-router-dom";
import { ExternalLink, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import type { Employee } from "../../domain/entities";
import { employeesCopy } from "../copy";

const copy = employeesCopy.form.edit.identityBanner;

interface Props {
  employee: Employee;
}

/** Banner de nº fijo en edit (D11). Sin dl — el shell ya muestra nombre/número/puesto. */
export function EmployeeEditIdentityBanner({ employee }: Props) {
  return (
    <Alert>
      <User className="h-4 w-4" />
      <AlertTitle>{copy.title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{copy.description}</p>
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
