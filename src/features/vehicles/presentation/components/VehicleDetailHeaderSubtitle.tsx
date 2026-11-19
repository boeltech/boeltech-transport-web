import { formatDetailContext } from "@shared/ui/page-shells/formatDetailContext";
import { vehiclesCopy } from "../copy/vehiclesCopy";

const copy = vehiclesCopy.detail;

interface Props {
  typeLabel: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
}

/** P2 VIS V4: identidad en una sola línea muted con «·». */
export function VehicleDetailHeaderSubtitle({
  typeLabel,
  licensePlate,
  brand,
  model,
  year,
}: Props) {
  const line = formatDetailContext([
    typeLabel,
    licensePlate,
    copy.format.vehicleLine(brand, model, year),
  ]);

  return (
    <p className="truncate text-sm text-muted-foreground" title={line}>
      {line}
    </p>
  );
}
