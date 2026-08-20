import { Fuel } from "lucide-react";
import type { RouteEstimate } from "@features/trips/domain";
import { formatCurrency } from "../../uiHelpers";
import { canvasCopy } from "../../copy/canvasCopy";

const copy = canvasCopy.estimate;

export interface RouteEstimateCardProps {
  estimate: RouteEstimate | null | undefined;
}

export function RouteEstimateCard({ estimate }: RouteEstimateCardProps) {
  if (estimate == null) {
    return null;
  }

  const total = formatCurrency(estimate.totalEstimate, estimate.currency);

  return (
    <p className="flex items-start gap-2 text-xs text-muted-foreground">
      <Fuel className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        <span className="font-medium text-foreground">{copy.title}: </span>
        {copy.compactLine(total)}
        {estimate.basedOnTrips > 0 ? ` ${copy.basedOn(estimate.basedOnTrips)}.` : null}
      </span>
    </p>
  );
}
