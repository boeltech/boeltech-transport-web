import { vehiclesCopy } from "../copy/vehiclesCopy";

const copy = vehiclesCopy.detail;

interface Props {
  typeLabel: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  isActive: boolean;
}

export function VehicleDetailHeaderSubtitle({
  typeLabel,
  licensePlate,
  brand,
  model,
  year,
  isActive,
}: Props) {
  return (
    <div className="space-y-0.5">
      <p className="truncate text-sm text-muted-foreground">
        {copy.format.headerSubtitle(typeLabel, licensePlate)}
      </p>
      <p className="truncate text-sm text-muted-foreground">
        {copy.format.vehicleLine(brand, model, year)}
        {!isActive ? (
          <span className="text-destructive"> · {copy.state.inactiveRegistration}</span>
        ) : null}
      </p>
    </div>
  );
}
