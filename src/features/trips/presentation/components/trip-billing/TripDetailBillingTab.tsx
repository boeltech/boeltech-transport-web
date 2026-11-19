/**
 * Tab Facturación / Cobro (F5) — hogar fiscal único (D7).
 * Sin factura → Cobro (D15 / Q11). Con factura → facturas + CP + pendientes.
 * Riel Cobro: Σ total CFDI vigentes (con IVA) vía linked invoices — no facturadoVigente API.
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, AlertTriangle } from "lucide-react";

import { useTripLinkedInvoices } from "@features/trips/application";
import type { Trip, TripRevenueSplit } from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailAlertCard, InfoRow } from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";
import { formatDateTime } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

import { billingCopy } from "../../copy/tripDetail/billingCopy";
import { TripFleetSnapshotCard } from "../trip-fleet-snapshot";
import { buildTripBillingCobroSummary } from "./buildTripBillingCobroSummary";
import { buildTripBillingInvoiceRows } from "./buildTripBillingInvoiceRows";
import { resolveTripBillingSubstitution } from "./resolveTripBillingSubstitution";
import { TripBillingFalseTripDeclarationCard } from "./TripBillingFalseTripDeclarationCard";
import { TripBillingInvoicesPanel } from "./TripBillingInvoicesPanel";
import { TripBillingPendientesPanel } from "./TripBillingPendientesPanel";
import { TripBillingSubstitutionHistoryCard } from "./TripBillingSubstitutionHistoryCard";
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
  const needsLinkedCobro = !isSinCfdi && !isTraslado;
  const lastStampError = trip.invoicing.lastStampError ?? null;
  const folio = trip.invoicing.invoiceFolio;

  const { data: linkedInvoices = [], isLoading: cobroLoading } =
    useTripLinkedInvoices(trip.id, { enabled: needsLinkedCobro });

  const cobroRows = useMemo(
    () =>
      needsLinkedCobro
        ? buildTripBillingInvoiceRows({
            trip,
            linkedInvoices,
            revenueSplit,
            // Solo totales vigentes; slots pendientes no cuentan en summarizeVigente.
            canCreate: false,
          })
        : [],
    [linkedInvoices, needsLinkedCobro, revenueSplit, trip],
  );

  const cobro = useMemo(
    () => buildTripBillingCobroSummary(cobroRows),
    [cobroRows],
  );

  const substitution = useMemo(
    () =>
      needsLinkedCobro
        ? resolveTripBillingSubstitution(linkedInvoices)
        : null,
    [linkedInvoices, needsLinkedCobro],
  );

  const cobroActiveFolio =
    substitution?.hasPartialSubstitution && substitution.substituteFolio
      ? substitution.substituteFolio
      : folio;
  const cobroActiveInvoiceId =
    substitution?.hasPartialSubstitution && substitution.substituteInvoiceId
      ? substitution.substituteInvoiceId
      : trip.invoicing.invoiceId;

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
          <TripBillingFalseTripDeclarationCard trip={trip} />
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
          substitution={substitution}
        />

        <TripBillingInvoicesPanel
          trip={trip}
          revenueSplit={revenueSplit}
          onOpenRevenueSplit={onOpenRevenueSplit}
          onOpenHistory={
            onOpenHistory ??
            (substitution && substitution.history.length > 0
              ? () => {
                  document
                    .querySelector(
                      '[data-testid="trip-billing-substitution-history"]',
                    )
                    ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
              : undefined)
          }
          hasPartialSubstitution={Boolean(
            substitution?.hasPartialSubstitution,
          )}
        />

        {substitution && substitution.history.length > 0 ? (
          <TripBillingSubstitutionHistoryCard items={substitution.history} />
        ) : null}

        <TripFleetSnapshotCard
          trip={trip}
          canSubstituteInvoice={
            // D27: no empujar Sustituir/flota cuando el pendiente es cancelar original.
            canSubstituteInvoice &&
            !substitution?.hasPartialSubstitution
          }
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
              value={
                cobroLoading ? (
                  <Skeleton className="ml-auto h-4 w-24" />
                ) : (
                  formatMxCurrency(cobro.facturado)
                )
              }
            />
            <InfoRow
              variant="inline"
              label={copy.cobroRail.cobrado}
              value={
                cobroLoading ? (
                  <Skeleton className="ml-auto h-4 w-24" />
                ) : (
                  formatMxCurrency(cobro.cobrado)
                )
              }
            />
            <div>
              <p className="text-xs text-muted-foreground">
                {copy.cobroRail.porCobrar}
              </p>
              {cobroLoading ? (
                <Skeleton className="mt-1 h-7 w-28" />
              ) : (
                <p className="text-lg font-semibold tabular-nums">
                  {formatMxCurrency(cobro.porCobrar)}
                </p>
              )}
            </div>
            {cobroActiveFolio && cobroActiveInvoiceId ? (
              <p className="text-xs text-muted-foreground">
                {substitution?.hasPartialSubstitution
                  ? copy.cobroRail.paymentsOnSubstitute(cobroActiveFolio)
                  : copy.cobroRail.paymentsOnInvoice(cobroActiveFolio)}{" "}
                <Link
                  className="text-primary underline-offset-2 hover:underline"
                  to={`/invoices/${cobroActiveInvoiceId}`}
                  state={{ from: `/trips/${trip.id}` }}
                >
                  Abrir {cobroActiveFolio}
                </Link>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {copy.cobroRail.paymentsOnInvoiceGeneric}
              </p>
            )}
            {/* Q10 sustituta: copy permitido; prohibido migración. */}
            {substitution?.hasPartialSubstitution ? (
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
