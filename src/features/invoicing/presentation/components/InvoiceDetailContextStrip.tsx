import { Link } from "react-router-dom";
import { Building2, ExternalLink, Route, UserRound } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { useRegimenFiscalLabel } from "@features/catalogs";
import { TripListRouteLabel } from "@features/trips";
import type { Invoice } from "@features/invoicing/domain";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { invoicingCopy } from "../copy/invoicingCopy";

const copy = invoicingCopy;
const detailCopy = invoicingCopy.detail;

export interface InvoiceDetailContextStripProps {
  invoice: Invoice;
  fromPath: string;
}

export function InvoiceDetailContextStrip({
  invoice,
  fromPath,
}: InvoiceDetailContextStripProps) {
  const { label: issuerTaxRegimeLabel } = useRegimenFiscalLabel(
    invoice.issuerTaxRegime,
  );

  return (
    <section className="rounded-lg border border-border bg-muted/30 p-4 md:p-5">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)] xl:items-start">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            {detailCopy.section.issuer}
          </div>
          <p className="truncate text-sm font-semibold">{invoice.issuerName || "—"}</p>
          <p className="text-xs text-muted-foreground">
            {invoice.issuerRfc || "—"} ·{" "}
            {issuerTaxRegimeLabel ?? invoice.issuerTaxRegime ?? "—"} ·{" "}
            {invoice.issueLocation ? `C.P. ${invoice.issueLocation}` : "—"}
          </p>
        </div>

        <div className="min-w-0 space-y-1 md:border-l md:border-border md:pl-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            {detailCopy.section.receiver}
          </div>
          <p className="truncate text-sm font-semibold">
            {invoice.receiverName || "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {invoice.receiverRfc || "—"} · {invoice.receiverPostalCode || "—"}
          </p>
          {invoice.cfdiUuid ? (
            <p className="truncate font-mono text-xs text-muted-foreground" title={invoice.cfdiUuid}>
              {detailCopy.label.cfdiUuid}: {invoice.cfdiUuid}
            </p>
          ) : null}
        </div>

        <div className="min-w-0 space-y-3 md:col-span-2 md:border-t md:border-border md:pt-4 xl:col-span-1 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Route className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            {detailCopy.section.linkedTrips(invoice.trips.length)}
          </div>
          {invoice.trips.length > 0 ? (
            <div className="space-y-2">
              {invoice.trips.map((trip) => (
                <div
                  key={trip.tripId}
                  className="rounded-md border bg-background/70 px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button variant="link" className="h-auto min-w-0 p-0" asChild>
                      <Link
                        to={`/trips/${trip.tripId}`}
                        state={{ from: fromPath }}
                        className="inline-flex min-w-0 items-center gap-2"
                      >
                        <Badge variant="secondary" className="shrink-0">
                          {trip.tripCode}
                        </Badge>
                        <span className="truncate font-medium">{trip.clientName}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      </Link>
                    </Button>
                    <span className="font-medium tabular-nums">
                      {formatMxCurrency(trip.baseRate)}
                    </span>
                  </div>
                  <TripListRouteLabel
                    trip={{
                      originCity: trip.originCity,
                      originState: trip.originState,
                      destinationCity: trip.destinationCity,
                      destinationState: trip.destinationState,
                    }}
                    className="mt-1 text-xs text-muted-foreground"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {detailCopy.hint.noLinkedTrips}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{copy.hint.tripEdit}</p>
        </div>
      </div>
    </section>
  );
}
