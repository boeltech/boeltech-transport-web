import { vehiclesCopy } from "../copy/vehiclesCopy";

const copy = vehiclesCopy.detail;

interface Props {
  typeLabel: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
}

export function VehicleDetailHeaderSubtitle({
  typeLabel,
  licensePlate,
  brand,
  model,
  year,
}: Props) {
  return (
    <div className="space-y-0.5">
      <p className="truncate text-sm text-muted-foreground">
        {copy.format.headerSubtitle(typeLabel, licensePlate)}
      </p>
      <p className="truncate text-xs text-muted-foreground">
        {copy.format.vehicleLine(brand, model, year)}
      </p>
    </div>
  );
}
