/**
 * TripInvoicingConsole — banda unificada de facturación del viaje (Capa 3 D1).
 * Resumen fiscal + línea compacta de reparto cuando aplica.
 *
 * F4: en `in_progress` sin ATF arranca colapsada (secundaria) para priorizar
 * operación/seguimiento; con ATF permanece expandida.
 */

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";

import type { Trip } from "@features/trips/domain";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import {
  TripFiscalSection,
  type TripFiscalSectionProps,
} from "./TripFiscalSection";
import { TripRevenueSplitSummaryLine } from "./TripRevenueSplitSummaryLine";
import {
  shouldCollapseTripInvoicingConsoleByDefault,
  shouldShowTripInvoicingConsole,
} from "./shouldShowTripInvoicingConsole";

export {
  shouldShowTripInvoicingConsole,
  shouldShowTripFiscalBand,
  shouldCollapseTripInvoicingConsoleByDefault,
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

  const collapseByDefault = shouldCollapseTripInvoicingConsoleByDefault(trip);

  return (
    <TripInvoicingConsoleBody
      key={`${trip.id}-${collapseByDefault ? "collapsed" : "expanded"}`}
      trip={trip}
      postCancelFiscal={postCancelFiscal}
      onViewRevenueSplit={onViewRevenueSplit}
      collapseByDefault={collapseByDefault}
    />
  );
}

function TripInvoicingConsoleBody({
  trip,
  postCancelFiscal,
  onViewRevenueSplit,
  collapseByDefault,
}: TripInvoicingConsoleProps & { collapseByDefault: boolean }) {
  /** Key del padre remonta al cambiar densidad; estado inicial basta. */
  const [open, setOpen] = useState(!collapseByDefault);

  const inv = trip.invoicing;
  const showCollectionHint =
    inv.hasActiveSplit ||
    inv.splitLegsInvoiced > 0 ||
    (inv.accessoryInvoices?.length ?? 0) > 1 ||
    (Boolean(inv.invoiceId) && (inv.accessoryInvoices?.length ?? 0) > 0);

  const body = (
    <>
      <TripFiscalSection
        trip={trip}
        postCancelFiscal={postCancelFiscal}
        embedded
      />
      <TripRevenueSplitSummaryLine
        trip={trip}
        onViewRevenueSplit={onViewRevenueSplit}
      />
    </>
  );

  if (!collapseByDefault) {
    return (
      <div
        className="space-y-3 rounded-xl border bg-muted/20 px-3 py-3"
        data-testid="trip-invoicing-console"
        data-density="expanded"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium">{sectionCopy.compactTitle}</h2>
          {showCollectionHint ? (
            <p className="text-xs text-muted-foreground">
              {sectionCopy.collectionByReceiver}
            </p>
          ) : null}
        </div>
        {body}
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className="space-y-3 rounded-xl border border-border/70 bg-muted/10 px-3 py-2.5"
        data-testid="trip-invoicing-console"
        data-density="secondary"
        data-collapsed={open ? "false" : "true"}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {sectionCopy.compactTitle}
          </h2>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs text-muted-foreground"
              data-testid="trip-invoicing-console-toggle"
            >
              {open ? (
                <>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                  {sectionCopy.collapse}
                </>
              ) : (
                <>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  {sectionCopy.expand}
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        {!open && showCollectionHint ? (
          <p className="text-xs text-muted-foreground">
            {sectionCopy.collectionByReceiver}
          </p>
        ) : null}
        <CollapsibleContent className="space-y-3">{body}</CollapsibleContent>
      </div>
    </Collapsible>
  );
}
