import { Link } from "react-router-dom";
import { Building2, Route } from "lucide-react";

import type { Invoice, InvoicePrefill } from "@features/invoicing/domain";
import { useRegimenFiscalLabel } from "@features/catalogs";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { Button } from "@shared/ui/button";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

import { invoicingCopy } from "../copy/invoicingCopy";

const copy = invoicingCopy;

type IssuerSnapshot = {
  rfc: string;
  name: string;
  taxRegime: string;
  issueLocation: string;
};

function IssuerContextCard({ issuer }: { issuer: IssuerSnapshot }) {
  const { label: regimeLabel } = useRegimenFiscalLabel(issuer.taxRegime);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          <Building2 className="h-4 w-4 shrink-0" />
          {copy.section.issuer}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <InfoRow variant="inline" label={copy.label.issuerRfc} value={issuer.rfc || "—"} />
        <InfoRow variant="inline" label={copy.label.issuerName} value={issuer.name || "—"} />
        <InfoRow
          variant="inline"
          label={copy.label.issuerRegime}
          value={regimeLabel || issuer.taxRegime || "—"}
        />
        <InfoRow
          variant="inline"
          label={copy.label.issueLocation}
          value={issuer.issueLocation ? `C.P. ${issuer.issueLocation}` : "—"}
        />
        <p className="pt-2 text-xs text-muted-foreground">{copy.hint.issuer}</p>
      </CardContent>
    </Card>
  );
}

type TripContextCardProps = {
  mode: "create" | "edit";
  prefill?: InvoicePrefill | null;
  tripId?: string;
  invoice?: Invoice | null;
};

function TripContextCard({ mode, prefill, tripId, invoice }: TripContextCardProps) {
  const linkedTrip = mode === "edit" ? invoice?.trips?.[0] : null;
  const tripRef = linkedTrip
    ? linkedTrip
    : prefill
      ? {
          tripId: prefill.tripId,
          tripCode: prefill.tripCode,
          clientName: prefill.receiverName,
        }
      : null;

  if (!tripRef) return null;

  const tripAmount = linkedTrip?.baseRate ?? prefill?.subtotal ?? 0;
  const resolvedTripId = tripRef.tripId || tripId;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          <Route className="h-4 w-4 shrink-0" />
          {copy.section.trip}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <InfoRow variant="inline" label={copy.label.tripCode} value={tripRef.tripCode} />
        {"clientName" in tripRef && tripRef.clientName ? (
          <InfoRow variant="inline" label={copy.label.tripClient} value={tripRef.clientName} />
        ) : null}
        <InfoRow
          variant="inline"
          label={copy.label.tripSubtotal}
          value={formatMxCurrency(tripAmount)}
        />
        {resolvedTripId ? (
          <div className="pt-2">
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link to={`/trips/${resolvedTripId}`}>{copy.label.viewTrip}</Link>
            </Button>
          </div>
        ) : null}
        <p className="pt-1 text-xs text-muted-foreground">
          {mode === "create" ? copy.hint.tripCreate : copy.hint.tripEdit}
        </p>
      </CardContent>
    </Card>
  );
}

export type InvoiceCreateContextCardsProps = {
  mode: "create" | "edit";
  prefill?: InvoicePrefill | null;
  tripId?: string;
  invoice?: Invoice | null;
};

export function InvoiceCreateContextCards({
  mode,
  prefill,
  tripId,
  invoice,
}: InvoiceCreateContextCardsProps) {
  const issuer: IssuerSnapshot | null =
    mode === "edit" && invoice
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

  if (!issuer && !prefill && !(invoice?.trips?.length)) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {issuer ? <IssuerContextCard issuer={issuer} /> : null}
      <TripContextCard mode={mode} prefill={prefill} tripId={tripId} invoice={invoice} />
    </div>
  );
}
