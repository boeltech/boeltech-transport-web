import { Link } from "react-router-dom";
import { ExternalLink, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import type { Driver } from "../../domain";
import { driversCopy } from "../copy";

const copy = driversCopy.form.edit.employeeBanner;

interface Props {
  driver: Driver;
}

/** Banner de inmutabilidad del empleado en edit (D12). Sin dl — el shell ya muestra nombre/número. */
export function DriverEditEmployeeBanner({ driver }: Props) {
  if (!driver.employee) return null;

  return (
    <Alert>
      <User className="h-4 w-4" />
      <AlertTitle>{copy.title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{copy.description}</p>
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
