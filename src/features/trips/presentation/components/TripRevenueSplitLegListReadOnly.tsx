/**
 * Lista read-only de porciones del prorrateo (ADR-0081 sheet).
 */
import { Link } from "react-router-dom";
import { Button } from "@shared/ui/button";
import type { Trip, TripRevenueSplit } from "@features/trips/domain";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";

const splitCopy = tripFiscalCopy.revenueSplit;

export interface TripRevenueSplitLegListReadOnlyProps {
  split: TripRevenueSplit;
  trip: Trip;
  /**
   * C7 post-cancel: piernas sin factura usan «Sin factura · no emitir»
   * (no «Pendiente de facturar»).
   */
  pendingLegMode?: "default" | "doNotIssue";
}

export function TripRevenueSplitLegListReadOnly({
  split,
  trip,
  pendingLegMode = "default",
}: TripRevenueSplitLegListReadOnlyProps) {
  const pendingLabel =
    pendingLegMode === "doNotIssue"
      ? splitCopy.statusNoInvoiceDoNotIssue
      : splitCopy.statusPending;

  return (
    <ul className="space-y-2">
      {split.legs.map((leg) => {
        const label = leg.clientLegalName || leg.clientId.slice(0, 8);
        const statusLabel = leg.invoiceId
          ? splitCopy.statusInvoiced
          : pendingLabel;
        return (
          <li
            key={leg.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background/60 px-2.5 py-2 text-sm"
          >
            <div className="min-w-0 space-y-0.5">
              <div className="truncate font-medium">{label}</div>
              <div className="text-xs text-muted-foreground">
                {leg.sharePercent}% · {statusLabel}
                {leg.clientRfc
                  ? ` · ${splitCopy.legRfcSubtitle(leg.clientRfc)}`
                  : ""}
                {leg.suggestedCartaPorte
                  ? trip.invoicing.cartaPorteAttached && !leg.invoiceId
                    ? ` · ${splitCopy.cpAttachedElsewhere}`
                    : ` · ${splitCopy.cpSuggested}`
                  : ""}
              </div>
            </div>
            {leg.invoiceId ? (
              <Button asChild size="sm" variant="ghost">
                <Link to={`/invoices/${leg.invoiceId}`}>
                  {splitCopy.viewInvoice}
                </Link>
              </Button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
