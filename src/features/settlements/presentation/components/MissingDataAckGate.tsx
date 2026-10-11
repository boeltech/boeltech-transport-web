import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import { FieldInlineError, getFieldErrorAriaProps } from "@shared/ui/form";
import { settlementsCopy } from "../copy/settlementsCopy";
import type { MissingDataGapTrip } from "../utils/missingDataGapsFromItems";

const gateCopy = settlementsCopy.createPage.missingDataGate;
const MISSING_DATA_TRIPS_LISTED = 5;

export interface MissingDataAckGateProps {
  gaps: readonly MissingDataGapTrip[];
  acknowledged: boolean;
  onAcknowledgedChange: (value: boolean) => void;
  errorMessage?: string | null;
  checkboxId?: string;
}

/** Aviso + un checkbox (km y flete) antes de enviar a autorización — paridad create E11.2. */
export function MissingDataAckGate({
  gaps,
  acknowledged,
  onAcknowledgedChange,
  errorMessage,
  checkboxId = "acknowledge-missing-data-submit",
}: MissingDataAckGateProps) {
  if (gaps.length === 0) return null;

  return (
    <div
      className="rounded-lg border border-warning/30 bg-warning-soft/40 p-3 space-y-2"
      data-testid="missing-data-gate"
    >
      <p className="text-xs font-medium text-foreground">{gateCopy.alertTitle}</p>
      <p className="text-[11px] text-muted-foreground leading-snug">
        {gateCopy.alertDescription(gaps.length)}
      </p>
      <ul
        className="text-[11px] text-foreground leading-snug space-y-0.5"
        aria-label={gateCopy.tripsListAriaLabel}
      >
        {gaps.slice(0, MISSING_DATA_TRIPS_LISTED).map((trip) => (
          <li key={trip.tripId ?? trip.tripCode}>
            <span className="font-mono font-medium">{trip.tripCode}</span>{" "}
            <span className="text-muted-foreground">
              {trip.gap === "zero_km" ? gateCopy.missingKm : gateCopy.missingFreight}
            </span>
          </li>
        ))}
        {gaps.length > MISSING_DATA_TRIPS_LISTED ? (
          <li className="text-muted-foreground">
            {gateCopy.moreTrips(gaps.length - MISSING_DATA_TRIPS_LISTED)}
          </li>
        ) : null}
      </ul>
      <div className="flex items-start gap-2 pt-1">
        <Checkbox
          id={checkboxId}
          checked={acknowledged}
          onCheckedChange={(checked) => onAcknowledgedChange(checked === true)}
          {...getFieldErrorAriaProps(checkboxId, errorMessage ?? undefined)}
        />
        <Label
          htmlFor={checkboxId}
          className="text-xs font-normal leading-snug cursor-pointer"
        >
          {gateCopy.ackLabel(gaps.length)}
        </Label>
      </div>
      <FieldInlineError fieldId={checkboxId} message={errorMessage ?? undefined} />
    </div>
  );
}
