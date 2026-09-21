/**
 * TripRevenueSplitSummaryLine — resumen compacto del reparto en la consola (Capa 3 D5/D8).
 */

import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { usePermissions } from "@shared/permissions";
import { TripStatus, type Trip } from "@features/trips/domain";
import { useTripRevenueSplit } from "@features/trips/application";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";

const splitCopy = tripFiscalCopy.revenueSplit;

export interface TripRevenueSplitSummaryLineProps {
  trip: Trip;
  onViewRevenueSplit?: () => void;
}

export function TripRevenueSplitSummaryLine({
  trip,
  onViewRevenueSplit,
}: TripRevenueSplitSummaryLineProps) {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("trips", "read");
  const isFalseTrip = trip.operationalOutcome === "false_trip";
  const isTripCancelled = trip.status === TripStatus.CANCELLED;

  const { data: split } = useTripRevenueSplit(trip.id, {
    enabled:
      canRead &&
      !isFalseTrip &&
      (trip.invoicing.hasActiveSplit ||
        trip.invoicing.canGenerateInvoice ||
        trip.invoicing.splitLegsTotal > 0),
  });

  if (isFalseTrip || !canRead) return null;

  const isActive = trip.invoicing.hasActiveSplit;
  const isDraft = split?.status === "draft";

  if (!isActive && !isDraft) return null;

  if (isDraft) {
    return (
      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-2">
        <Badge variant="outline">{splitCopy.draftChip}</Badge>
        {onViewRevenueSplit ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={onViewRevenueSplit}
          >
            {splitCopy.viewRevenueSplitLink}
          </Button>
        ) : null}
      </div>
    );
  }

  const clients = trip.invoicing.splitLegsTotal;
  const invoiced = trip.invoicing.splitLegsInvoiced;
  const summaryLine = isTripCancelled
    ? splitCopy.summaryPostCancel(clients)
    : invoiced >= clients && clients > 0
      ? splitCopy.summaryComplete(clients)
      : invoiced > 0
        ? splitCopy.summaryInProgress(clients)
        : splitCopy.summaryPending(clients);

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-2">
      <span className="text-xs text-muted-foreground">{summaryLine}</span>
      {onViewRevenueSplit ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          onClick={onViewRevenueSplit}
        >
          {splitCopy.viewRevenueSplitLink}
        </Button>
      ) : null}
    </div>
  );
}
