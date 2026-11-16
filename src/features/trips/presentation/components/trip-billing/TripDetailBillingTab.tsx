/**
 * Tab Facturación / Cobro (F5) — hogar fiscal único (D7).
 * Sin factura → Cobro (D15 / Q11). Con factura → facturas + CP + pendientes.
 */

import { Link } from "react-router-dom";
import { AlertCircle, AlertTriangle } from "lucide-react";

import type { Trip, TripRevenueSplit } from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailAlertCard, InfoRow } from "@shared/ui/data-display";
import { formatDateTime } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

import { billingCopy } from "../../copy/tripDetail/billingCopy";
import { TripFleetSnapshotCard } from "../trip-fleet-snapshot";
import { TripBillingInvoicesPanel } from "./TripBillingInvoicesPanel";
import { TripBillingPendientesPanel } from "./TripBillingPendientesPanel";
import { TripSinCfdiCobroPanel } from "./TripSinCfdiCobroPanel";

const copy = billingCopy;

export interface TripDetailBillingTabProps {
  trip: Trip;
  canSubstituteInvoice: boolean;
  revenueSplit?: TripRevenueSplit | null;
  onOpenRevenueSplit?: () => void;
  onOpenHistory?: () => void;
  onCorrectStop?: (stopId: string) => void;
}

export function TripDetailBillingTab({
  trip,
  canSubstituteInvoice,
  revenueSplit,
  onOpenRevenueSplit,
  onOpenHistory,
  onCorrectStop,
}: TripDetailBillingTabProps) {
  const isSinCfdi = trip.cfdiEmissionIntent === "sin_cfdi_efectivo";
  const isTraslado = trip.cfdiDocumentIntent === "traslado";
  const lastStampError = trip.invoicing.lastStampError ?? null;
  const facturado = trip.facturadoVigente ?? 0;
  const cobrado = trip.cobradoViaje ?? 0;
  const porCobrar = Math.max(0, facturado - cobrado);
  const folio = trip.invoicing.invoiceFolio;

  if (isSinCfdi) {
    return (
      <TripSinCfdiCobroPanel
        tripId={trip.id}
        baseRate={trip.costs.baseRate}
        operationalCash={trip.operationalCash}
        operationalCashAmount={trip.operationalCashAmount}
        settlementException={trip.settlementException ?? null}
      />
    );
  }

  if (isTraslado) {
    return (
      <div className="space-y-4" data-testid="trip-billing-traslado">
        <DetailAlertCard severity="info" title={copy.traslado.title}>
          <p className="text-sm text-muted-foreground">{copy.traslado.body}</p>
        </DetailAlertCard>
      </div>
    );
  }

  return (
    <div
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"
      data-testid="trip-billing-tab"
    >
      <div className="space-y-4">
        {lastStampError ? (
          <DetailAlertCard
            severity="warning"
            icon={<AlertCircle className="h-4 w-4" />}
            title={copy.stampError.title}
            action={
              lastStampError.stopId && onCorrectStop ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onCorrectStop(lastStampError.stopId!)}
                >
                  {copy.stampError.fixStopCta}
                </Button>
              ) : null
            }
          >
            <div className="space-y-1 text-sm">
              <Badge variant="warning" tone="soft">
                {copy.stampError.chip}
              </Badge>
              <p>{lastStampError.message}</p>
              {lastStampError.hint ? (
                <p className="text-muted-foreground">{lastStampError.hint}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {copy.stampError.whenWho(
                  formatDateTime(lastStampError.at),
                  lastStampError.byName,
                )}
              </p>
            </div>
          </DetailAlertCard>
        ) : null}

        {trip.operationalOutcome === "false_trip" ? (
          <Card data-testid="trip-billing-false-trip">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">
                  {copy.falseTrip.cardTitle}
                </CardTitle>
                <Badge variant="warning" tone="soft">
                  {copy.falseTrip.cardTitle}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {trip.falseTripDeclaredAt
                ? formatDateTime(trip.falseTripDeclaredAt.toISOString())
                : copy.falseTrip.reasonMissing}
            </CardContent>
          </Card>
        ) : null}

        {revenueSplit?.status === "draft" ? (
          <DetailAlertCard
            severity="info"
            icon={<AlertTriangle className="h-4 w-4" />}
            title={copy.split.draftChip}
          >
            <p className="text-sm text-muted-foreground">
              {copy.split.previewConfirm}
            </p>
          </DetailAlertCard>
        ) : null}

        {/* F5b P1-A: Pendientes above-the-fold (columna principal), antes de Facturas. */}
        <TripBillingPendientesPanel
          trip={trip}
          fiscalAttention={trip.fiscalAttention ?? null}
          canSubstitute={canSubstituteInvoice}
        />

        <TripBillingInvoicesPanel
          trip={trip}
          revenueSplit={revenueSplit}
          onOpenRevenueSplit={onOpenRevenueSplit}
          onOpenHistory={onOpenHistory}
        />

        <TripFleetSnapshotCard
          trip={trip}
          canSubstituteInvoice={canSubstituteInvoice}
        />
      </div>

      <aside className="space-y-4">
        <Card data-testid="trip-billing-cobro-rail">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{copy.cobroRail.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow
              variant="inline"
              label={copy.cobroRail.facturado}
              value={formatMxCurrency(facturado)}
            />
            <InfoRow
              variant="inline"
              label={copy.cobroRail.cobrado}
              value={formatMxCurrency(cobrado)}
            />
            <div>
              <p className="text-xs text-muted-foreground">
                {copy.cobroRail.porCobrar}
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {formatMxCurrency(porCobrar)}
              </p>
            </div>
            {folio && trip.invoicing.invoiceId ? (
              <p className="text-xs text-muted-foreground">
                Los pagos se registran en la factura ·{" "}
                <Link
                  className="text-primary underline-offset-2 hover:underline"
                  to={`/invoices/${trip.invoicing.invoiceId}`}
                  state={{ from: `/trips/${trip.id}` }}
                >
                  Abrir {folio}
                </Link>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {copy.cobroRail.paymentsOnInvoiceGeneric}
              </p>
            )}
            {/* Q10 sustituta: copy permitido; prohibido migración. */}
            {trip.requiresFiscalAttention ? (
              <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {copy.cobroRail.substituteHint}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
