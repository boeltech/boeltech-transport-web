import { Link } from "react-router-dom";
import { Building2, ExternalLink, Route } from "lucide-react";

import type { Invoice, InvoicePrefill, InvoiceTripRef } from "@features/invoicing/domain";
import { useRegimenFiscalLabel } from "@features/catalogs";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { cn } from "@shared/lib/utils/cn";

import { invoicingCopy } from "../copy/invoicingCopy";

const copy = invoicingCopy;
const ctxCopy = invoicingCopy.createContext;

type IssuerSnapshot = {
  rfc: string;
  name: string;
  taxRegime: string;
  issueLocation: string;
};

function IssuerContextColumn({ issuer }: { issuer: IssuerSnapshot }) {
  const { label: regimeLabel } = useRegimenFiscalLabel(issuer.taxRegime);
  const regimeDisplay = regimeLabel || issuer.taxRegime || "—";
  const locationDisplay = issuer.issueLocation ? `C.P. ${issuer.issueLocation}` : "—";

  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        {ctxCopy.issuerHeading}
      </div>
      <p className="truncate text-sm font-semibold">{issuer.name || "—"}</p>
      <p className="text-xs text-muted-foreground">
        {issuer.rfc || "—"} · {regimeDisplay} · {locationDisplay}
      </p>
      <p className="text-xs text-muted-foreground">{copy.hint.issuer}</p>
    </div>
  );
}

function TripLinkRow({ trip }: { trip: Pick<InvoiceTripRef, "tripId" | "tripCode"> }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="font-mono text-sm font-semibold">{trip.tripCode}</span>
      <Button variant="link" className="h-auto p-0 text-xs" asChild>
        <Link to={`/trips/${trip.tripId}`}>
          {copy.label.viewTrip}
          <ExternalLink className="ml-1 inline h-3 w-3" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}

type TripContextColumnProps = {
  trips: InvoiceTripRef[];
  tripId?: string;
  prefill?: InvoicePrefill | null;
  receiverName?: string;
};

function TripContextColumn({
  trips,
  tripId,
  prefill,
  receiverName,
}: TripContextColumnProps) {
  const singleTrip =
    trips[0] ??
    (prefill
      ? {
          tripId: prefill.tripId,
          tripCode: prefill.tripCode,
          clientName: prefill.receiverName,
          scheduledDeparture: "",
          originCity: "",
          originState: null,
          destinationCity: "",
          destinationState: null,
          baseRate: prefill.subtotal ?? 0,
        }
      : null);

  if (!singleTrip && trips.length === 0) return null;

  const tripClientName =
    "clientName" in singleTrip! ? singleTrip.clientName : prefill?.receiverName;
  const showClientHint =
    Boolean(tripClientName) &&
    Boolean(receiverName) &&
    tripClientName?.trim().toLowerCase() === receiverName?.trim().toLowerCase();

  const heading =
    trips.length > 1
      ? ctxCopy.tripHeadingPlural(trips.length)
      : ctxCopy.tripHeading;

  return (
    <div className="min-w-0 space-y-1 md:border-l md:border-border md:pl-6">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Route className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        {heading}
      </div>
      {trips.length > 1 ? (
        <ul className="space-y-2 text-sm">
          {trips.map((trip) => (
            <li key={trip.tripId}>
              <TripLinkRow trip={trip} />
            </li>
          ))}
        </ul>
      ) : singleTrip ? (
        <TripLinkRow trip={{ tripId: singleTrip.tripId || tripId || "", tripCode: singleTrip.tripCode }} />
      ) : null}
      {showClientHint ? (
        <p className="text-xs text-muted-foreground">{ctxCopy.receiverPrefilledHint}</p>
      ) : tripClientName && !showClientHint ? (
        <p className="truncate text-xs text-muted-foreground">
          {copy.label.tripClient}: {tripClientName}
        </p>
      ) : null}
    </div>
  );
}

function TripBaseRateColumn({ amount }: { amount: number }) {
  return (
    <div className="min-w-0 space-y-1 md:border-l md:border-border md:pl-6 md:text-right">
      <p className="text-xs font-medium text-muted-foreground">{ctxCopy.tripBaseRate}</p>
      <p className="text-lg font-semibold tabular-nums">{formatMxCurrency(amount)}</p>
    </div>
  );
}

type CreateContextLineProps = {
  receiverName?: string;
  receiverRfc?: string;
  tripCode?: string;
  tripId?: string;
  total: number;
  issuerName?: string;
  issuerRfc?: string;
};

/**
 * Línea de contexto del alta: a quién se factura · qué viaje · cuánto.
 * El emisor queda como pie discreto (dato propio, no editable aquí).
 */
function CreateContextLine({
  receiverName,
  receiverRfc,
  tripCode,
  tripId,
  total,
  issuerName,
  issuerRfc,
}: CreateContextLineProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 md:p-5">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:gap-6">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {ctxCopy.receiverHeading}
          </p>
          <p className="truncate text-base font-semibold">{receiverName || "—"}</p>
          {receiverRfc ? (
            <p className="font-mono text-xs text-muted-foreground">{receiverRfc}</p>
          ) : null}
        </div>

        {tripCode ? (
          <div className="min-w-0 space-y-1 md:border-l md:border-border md:pl-6">
            <p className="text-xs font-medium text-muted-foreground">
              {ctxCopy.tripLabel}
            </p>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to={`/trips/${tripId ?? ""}`} className="inline-flex items-center gap-1.5">
                <Badge variant="secondary" className="font-mono">
                  {tripCode}
                </Badge>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="sr-only">{copy.label.viewTrip}</span>
              </Link>
            </Button>
          </div>
        ) : null}

        <div className="space-y-1 md:border-l md:border-border md:pl-6 md:text-right">
          <p className="text-xs font-medium text-muted-foreground">
            {ctxCopy.totalHeading}
          </p>
          <p className="text-xl font-semibold tabular-nums">
            {formatMxCurrency(total)}{" "}
            <span className="text-xs font-medium text-muted-foreground">
              {ctxCopy.currencyCode}
            </span>
          </p>
        </div>
      </div>

      {issuerName ? (
        <p className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          {ctxCopy.issuerLine(issuerName, issuerRfc ?? "")}
        </p>
      ) : null}
    </div>
  );
}

export type InvoiceCreateContextCardsProps = {
  mode: "create" | "edit";
  prefill?: InvoicePrefill | null;
  tripId?: string;
  invoice?: Invoice | null;
  receiverName?: string;
  /** Alta: RFC del receptor en curso (viene del formulario). */
  receiverRfc?: string;
  /** Alta: total calculado en vivo desde los conceptos. */
  total?: number;
};

export function InvoiceCreateContextCards({
  mode,
  prefill,
  tripId,
  invoice,
  receiverName,
  receiverRfc,
  total = 0,
}: InvoiceCreateContextCardsProps) {
  if (mode === "create") {
    if (!prefill && !receiverName) return null;
    return (
      <CreateContextLine
        receiverName={receiverName || prefill?.receiverName}
        receiverRfc={receiverRfc || prefill?.receiverRfc}
        tripCode={prefill?.tripCode}
        tripId={prefill?.tripId || tripId}
        total={total}
        issuerName={prefill?.issuerName}
        issuerRfc={prefill?.issuerRfc}
      />
    );
  }

  const issuer: IssuerSnapshot | null = invoice
    ? {
        rfc: invoice.issuerRfc,
        name: invoice.issuerName,
        taxRegime: invoice.issuerTaxRegime,
        issueLocation: invoice.issueLocation,
      }
    : prefill
      ? {
          rfc: prefill.issuerRfc,
          name: prefill.issuerName,
          taxRegime: prefill.issuerTaxRegime,
          issueLocation: prefill.issueLocation,
        }
      : null;

  const trips: InvoiceTripRef[] = invoice?.trips?.length ? invoice.trips : [];

  const tripAmount =
    trips[0]?.baseRate ?? prefill?.subtotal ?? 0;

  if (!issuer && trips.length === 0 && !prefill) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-muted/30 p-4 md:p-5",
      )}
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] md:items-start md:gap-6">
        {issuer ? <IssuerContextColumn issuer={issuer} /> : null}
        <TripContextColumn
          trips={trips}
          tripId={tripId}
          prefill={prefill}
          receiverName={receiverName}
        />
        {(tripAmount > 0 || prefill || trips.length > 0) ? (
          <TripBaseRateColumn amount={tripAmount} />
        ) : null}
      </div>
      <p className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        {ctxCopy.contextFooterEdit}
      </p>
    </div>
  );
}
