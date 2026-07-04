import { Link } from "react-router-dom";
import { ExternalLink, Truck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import type { Vehicle } from "../../domain";
import { VEHICLE_TYPE_LABELS, type VehicleTypeValue } from "../../domain";
import { vehiclesCopy } from "../copy";

const copy = vehiclesCopy.form.edit.identityBanner;
const labels = vehiclesCopy.form.label;
const format = vehiclesCopy.detail.format;

interface Props {
  vehicle: Vehicle;
}

export function VehicleEditIdentityBanner({ vehicle }: Props) {
  const typeLabel =
    VEHICLE_TYPE_LABELS[vehicle.type as VehicleTypeValue] || vehicle.type;

  return (
    <Alert>
      <Truck className="h-4 w-4" />
      <AlertTitle>{copy.title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{copy.description}</p>
        <dl className="grid gap-1 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{labels.unitNumber}</dt>
            <dd className="font-mono font-medium">{vehicle.unitNumber}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{labels.licensePlate}</dt>
            <dd className="font-mono">{vehicle.licensePlate}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{labels.type}</dt>
            <dd>{typeLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{labels.line}</dt>
            <dd>
              {format.vehicleLine(vehicle.brand, vehicle.model, vehicle.year)}
            </dd>
          </div>
        </dl>
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
