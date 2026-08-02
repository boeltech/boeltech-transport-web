import { Link } from "react-router-dom";
import { ExternalLink, Route } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { TripListRouteLabel } from "@features/trips";
import type { Invoice } from "@features/invoicing/domain";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { invoicingCopy } from "../copy/invoicingCopy";
import { InvoiceBillingScopeBadge } from "./InvoiceBillingScopeBadge";

const detailCopy = invoicingCopy.detail;

export interface InvoiceDetailContextStripProps {
  invoice: Invoice;
  fromPath: string;
}

/**
 * Banda «Qué se cobró»: solo viajes vinculados.
 * Emisor/receptor viven en Situación (cliente) y Expediente fiscal.
 */
export function InvoiceDetailContextStrip({
  invoice,
  fromPath,
}: InvoiceDetailContextStripProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Route className="h-4 w-4 text-muted-foreground" aria-hidden />
          {detailCopy.section.linkedTrips(invoice.trips.length)}
        </CardTitle>
        {invoice.status === "draft" ? (
          <CardDescription>{invoicingCopy.hint.tripEdit}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        {invoice.trips.length > 0 ? (
          <div className="space-y-2">
            {invoice.trips.map((trip) => (
              <div
                key={trip.tripId}
                className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
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
                      <InvoiceBillingScopeBadge scope={trip.billingScope} />
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
          <p className="text-sm text-muted-foreground">
            {detailCopy.hint.noLinkedTrips}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
