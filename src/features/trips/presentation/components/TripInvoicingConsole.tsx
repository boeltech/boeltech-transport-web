/**
 * TripInvoicingConsole — banda unificada de facturación del viaje (Capa 3 D1).
 * Resumen fiscal + línea compacta de reparto cuando aplica.
 */

import type { Trip } from "@features/trips/domain";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import {
  TripFiscalSection,
  type TripFiscalSectionProps,
} from "./TripFiscalSection";
import { TripRevenueSplitSummaryLine } from "./TripRevenueSplitSummaryLine";
import { shouldShowTripInvoicingConsole } from "./shouldShowTripInvoicingConsole";

export {
  shouldShowTripInvoicingConsole,
  shouldShowTripFiscalBand,
} from "./shouldShowTripInvoicingConsole";

const sectionCopy = tripFiscalCopy.invoicesSection;

export interface TripInvoicingConsoleProps {
  trip: Trip;
  postCancelFiscal?: TripFiscalSectionProps["postCancelFiscal"];
  onViewRevenueSplit?: () => void;
}

export function TripInvoicingConsole({
  trip,
  postCancelFiscal,
  onViewRevenueSplit,
}: TripInvoicingConsoleProps) {
  if (!shouldShowTripInvoicingConsole(trip, Boolean(postCancelFiscal))) {
    return null;
  }

  const inv = trip.invoicing;
  const showCollectionHint =
    inv.hasActiveSplit ||
    inv.splitLegsInvoiced > 0 ||
    (inv.accessoryInvoices?.length ?? 0) > 1 ||
    (Boolean(inv.invoiceId) && (inv.accessoryInvoices?.length ?? 0) > 0);

  return (
    <div className="space-y-3 rounded-xl border bg-muted/20 px-3 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium">{sectionCopy.compactTitle}</h2>
        {showCollectionHint ? (
          <p className="text-xs text-muted-foreground">
            {sectionCopy.collectionByReceiver}
          </p>
        ) : null}
      </div>
      <TripFiscalSection
        trip={trip}
        postCancelFiscal={postCancelFiscal}
        embedded
      />
      <TripRevenueSplitSummaryLine
        trip={trip}
        onViewRevenueSplit={onViewRevenueSplit}
      />
    </div>
  );
}
