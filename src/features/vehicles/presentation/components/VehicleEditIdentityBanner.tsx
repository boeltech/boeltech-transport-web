import { Link } from "react-router-dom";
import { ExternalLink, Truck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import type { Vehicle } from "../../domain";
import { vehiclesCopy } from "../copy";

const copy = vehiclesCopy.form.edit.identityBanner;

interface Props {
  vehicle: Vehicle;
}

export function VehicleEditIdentityBanner({ vehicle }: Props) {
  return (
    <Alert>
      <Truck className="h-4 w-4" />
      <AlertTitle>{copy.title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{copy.description}</p>
        <p className="font-mono text-sm font-medium">{vehicle.unitNumber}</p>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/vehicles/${vehicle.id}`}>
            {copy.viewDetail}
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
