import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

import type { Trip, TripFiscalAttentionDetail } from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { formatDateTime } from "@shared/utils/dateUtils";

import { billingCopy } from "../../copy/tripDetail/billingCopy";
import { fiscalAttentionMutationTitle } from "../../helpers/fiscalAttentionMutationCopy";
import { resolveFiscalAttentionCta } from "../../helpers/resolveFiscalAttentionCta";
import type { TripBillingSubstitutionState } from "./resolveTripBillingSubstitution";

const copy = billingCopy.pendientes;

export interface TripBillingPendientesPanelProps {
  trip: Trip;
  fiscalAttention: TripFiscalAttentionDetail | null;
  canSubstitute: boolean;
  /** D27: sustituta vigente + original sin cancelar. */
  substitution?: TripBillingSubstitutionState | null;
}

export function TripBillingPendientesPanel({
  trip,
  fiscalAttention,
  canSubstitute,
  substitution = null,
}: TripBillingPendientesPanelProps) {
  const partial = Boolean(substitution?.hasPartialSubstitution);
  const hasAttention =
    trip.requiresFiscalAttention && fiscalAttention != null;

  if (!partial && !hasAttention) {
    return (
      <Card data-testid="trip-billing-pendientes">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{copy.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm font-medium text-foreground">{copy.emptyTitle}</p>
          <p className="text-xs text-muted-foreground">{copy.emptyBody}</p>
        </CardContent>
      </Card>
    );
  }

  // D27: pendiente = cancelar original; no CTA Sustituir.
  if (
    partial &&
    substitution?.originalInvoiceId &&
    substitution.originalFolio &&
    substitution.substituteFolio
  ) {
    return (
      <Card data-testid="trip-billing-pendientes">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{copy.title}</CardTitle>
            <Badge variant="warning" tone="soft">
              {copy.cancelOriginalBadge}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-2 rounded-md border border-warning/40 bg-warning-soft px-3 py-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div className="min-w-0 space-y-2">
              <p className="font-medium text-warning-soft-foreground">
                {copy.cancelOriginalTitle(substitution.originalFolio)}
              </p>
              <p className="text-xs text-muted-foreground">
                {copy.cancelOriginalBody(
                  substitution.originalFolio,
                  substitution.substituteFolio,
                )}
              </p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link
              to={`/invoices/${substitution.originalInvoiceId}`}
              state={{ from: `/trips/${trip.id}` }}
            >
              {copy.cancelOriginalCta}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const detail = fiscalAttention!;
  const whatChanged = fiscalAttentionMutationTitle(detail.mutationKind);
  const actionBody = trip.invoicing.hasActiveSplit
    ? copy.actionBodySplit
    : copy.actionBody;
  const cta = resolveFiscalAttentionCta({
    requiresFiscalAttention: true,
    hasActiveSplit: trip.invoicing.hasActiveSplit,
    principalInvoiceId: trip.invoicing.invoiceId,
    splitLegsReady: true,
    splitLegs: [],
  });

  const invoiceHref =
    cta.kind === "primary" && cta.invoiceId
      ? `/invoices/${cta.invoiceId}`
      : trip.invoicing.invoiceId
        ? `/invoices/${trip.invoicing.invoiceId}`
        : null;

  return (
    <Card data-testid="trip-billing-pendientes">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{copy.title}</CardTitle>
          <Badge variant="warning" tone="soft">
            {copy.attentionTitle}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex gap-2 rounded-md border border-warning/40 bg-warning-soft px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div className="min-w-0 space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">{copy.whatLabel}</p>
              <p className="font-medium text-warning-soft-foreground">
                {whatChanged}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{actionBody}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">{copy.whenLabel}</p>
                <p>{formatDateTime(detail.flaggedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{copy.whoLabel}</p>
                <p>
                  {detail.flaggedByName?.trim() || copy.whoUnknown}
                </p>
              </div>
            </div>
          </div>
        </div>

        {invoiceHref ? (
          <Button asChild variant="outline" size="sm">
            <Link to={invoiceHref} state={{ from: `/trips/${trip.id}` }}>
              {canSubstitute ? copy.substituteCta : copy.openInvoiceCta}
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
