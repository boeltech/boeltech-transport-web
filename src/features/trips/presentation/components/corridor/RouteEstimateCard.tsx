import { useState } from "react";
import { ChevronDown, Fuel } from "lucide-react";
import type { RouteEstimate } from "@features/trips/domain";
import { cn } from "@shared/lib/utils/cn";
import { formatCurrency } from "../../uiHelpers";
import { canvasCopy } from "../../copy/canvasCopy";

const copy = canvasCopy.estimate;

export interface RouteEstimateCardProps {
  estimate: RouteEstimate | null | undefined;
}

export function RouteEstimateCard({ estimate }: RouteEstimateCardProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  if (estimate == null) {
    return null;
  }

  const total = formatCurrency(estimate.totalEstimate, estimate.currency);
  const fuel = formatCurrency(estimate.fuelEstimate, estimate.currency);
  const tolls = formatCurrency(estimate.tollEstimate, estimate.currency);

  return (
    <div className="space-y-1.5 text-xs text-muted-foreground">
      <p className="flex items-start gap-2">
        <Fuel className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          <span className="font-medium text-foreground">{copy.title}: </span>
          {copy.compactLine(total)}
        </span>
      </p>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
        aria-expanded={breakdownOpen}
        onClick={() => setBreakdownOpen((open) => !open)}
      >
        {breakdownOpen ? copy.hideBreakdown : copy.showBreakdown}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            breakdownOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {breakdownOpen ? (
        <ul className="space-y-0.5 pl-5 text-xs text-muted-foreground">
          <li>
            {copy.fuel}: {fuel}
          </li>
          <li>
            {copy.tolls}: {tolls}
          </li>
          {estimate.estimatedDistanceKm != null ? (
            <li>{copy.distance(estimate.estimatedDistanceKm)}</li>
          ) : null}
          {estimate.basedOnTrips > 0 ? (
            <li>{copy.basedOn(estimate.basedOnTrips)}.</li>
          ) : null}
          {estimate.adjusted ? <li>{copy.adjusted}.</li> : null}
          <li>{copy.disclaimer}</li>
        </ul>
      ) : null}
    </div>
  );
}
