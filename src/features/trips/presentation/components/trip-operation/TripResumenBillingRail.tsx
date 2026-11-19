import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import type { Trip } from "@features/trips/domain";
import { resolveOperationalCashSummary } from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";

import { cfdiEmissionIntentCopy } from "../../copy/cfdiEmissionIntentCopy";
import { tripDetailCopy } from "../../copy";
import { tripFiscalCopy } from "../../copy/tripFiscalCopy";
import { formatMxCurrency } from "../trip-financial";
import {
  operationalCashStatusBadgeVariant,
  operationalCashStatusLabel,
} from "../../utils/operationalCashUi";
import { getTripInvoiceStatusLabel } from "../../utils/tripListFilterUtils";

const copy = tripDetailCopy.operation;
const cashCopy = cfdiEmissionIntentCopy.cash;

export interface TripResumenBillingRailProps {
  trip: Trip;
  onOpenBillingTab: () => void;
}

function invoiceStatusBadgeVariant(
  status: string | null | undefined,
): "success" | "warning" | "neutral" | "destructive" {
  if (status === "stamped") return "success";
  if (status === "cancellation_pending") return "warning";
  if (status === "cancelled") return "destructive";
  return "neutral";
}

function Kv({
  label,
  value,
}: {
  label: ReactNode;
  value: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="min-w-0 text-sm text-muted-foreground">{label}</span>
      <span className="shrink-0 text-sm">{value}</span>
    </div>
  );
}

export function TripResumenBillingRail({
  trip,
  onOpenBillingTab,
}: TripResumenBillingRailProps) {
  const isSinCfdi = trip.cfdiEmissionIntent === "sin_cfdi_efectivo";

  if (isSinCfdi) {
    const summary = resolveOperationalCashSummary(
      {
        operationalCash: trip.operationalCash,
        operationalCashCollectedAt: trip.operationalCashCollectedAt,
        operationalCashAmount: trip.operationalCashAmount,
        baseRate: trip.costs.baseRate,
      },
      trip.costs.baseRate,
    );
    const rate = summary.baseRate;
    const collected = summary.collectedTotal;
    const pending = summary.pendingAmount;
    const pct =
      rate > 0 ? Math.min(100, Math.round((collected / rate) * 100)) : 0;
    const statusLabel = operationalCashStatusLabel(summary.status);

    return (
      <Card data-testid="trip-resumen-billing-rail">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
          <CardTitle className="text-base">{cashCopy.sectionTitle}</CardTitle>
          <Badge
            variant={operationalCashStatusBadgeVariant(summary.status)}
            tone="soft"
            className="text-xs font-medium"
            data-testid="trip-resumen-cobro-status-badge"
          >
            {statusLabel}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <Kv label={copy.rail.rate} value={formatMxCurrency(rate)} />
          <Kv
            label={cashCopy.scorecardAccumulatedLabel}
            value={formatMxCurrency(collected)}
          />
          <Kv
            label={cashCopy.scorecardPendingLabel}
            value={formatMxCurrency(pending)}
          />
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            aria-hidden
          >
            <div
              className={cn(
                "h-full rounded-full",
                summary.status === "collected" ? "bg-success" : "bg-warning",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            onClick={onOpenBillingTab}
          >
            {copy.action.viewCash}
          </button>
        </CardContent>
      </Card>
    );
  }

  const invoicing = trip.invoicing;
  const hasInvoice = Boolean(invoicing.invoiceId || invoicing.invoiceFolio);
  const status = invoicing.invoiceStatus;
  const statusLabel = status
    ? getTripInvoiceStatusLabel(status)
    : "Por facturar";

  const invoiced = invoicing.splitLegsInvoiced ?? 0;
  const total = invoicing.splitLegsTotal ?? 0;
  const splitPartial =
    invoicing.hasActiveSplit &&
    total > 0 &&
    invoiced > 0 &&
    invoiced < total;
  const splitPending = Math.max(0, total - invoiced);

  const primaryLabel = splitPartial
    ? copy.rail.billingInProgress
    : hasInvoice && invoicing.invoiceFolio
      ? copy.rail.freightInvoice(invoicing.invoiceFolio)
      : copy.rail.freightPending;

  const primaryBadge = splitPartial
    ? tripFiscalCopy.detailBadge.splitPartial
    : statusLabel;

  let pendingLine: string | null = null;
  if (trip.requiresFiscalAttention) {
    pendingLine = copy.rail.billingPendingCount(
      1,
      tripDetailCopy.shell.alert.fiscalAttentionChip,
    );
  } else if (splitPartial && splitPending > 0) {
    pendingLine = copy.rail.billingPendingCount(
      splitPending,
      `${splitPending} de ${total} porciones`,
    );
  } else if (status === "stamped" || status === "cancellation_pending") {
    pendingLine = copy.rail.noBillingPending;
  } else if (!hasInvoice) {
    pendingLine = copy.rail.billingPendingCount(1, "flete");
  }

  return (
    <Card data-testid="trip-resumen-billing-rail">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{copy.rail.billing}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <Kv
          label={
            hasInvoice && invoicing.invoiceId && !splitPartial ? (
              <Link
                to={`/invoices/${invoicing.invoiceId}`}
                className="text-foreground hover:text-primary hover:underline"
              >
                {primaryLabel}
              </Link>
            ) : (
              primaryLabel
            )
          }
          value={
            <Badge
              variant={
                splitPartial
                  ? "warning"
                  : invoiceStatusBadgeVariant(status)
              }
              tone="soft"
              className="text-[10px] font-normal"
            >
              {primaryBadge}
            </Badge>
          }
        />

        {trip.facturadoVigente != null ? (
          <Kv
            label={copy.label.facturadoVigente}
            value={
              <span className="font-mono tabular-nums">
                {formatMxCurrency(trip.facturadoVigente)}
              </span>
            }
          />
        ) : null}
        {trip.cobradoViaje != null ? (
          <Kv
            label={copy.label.cobradoViaje}
            value={
              <span className="font-mono tabular-nums">
                {formatMxCurrency(trip.cobradoViaje)}
              </span>
            }
          />
        ) : null}

        <p className="pt-1 text-xs text-muted-foreground">
          {pendingLine ? `${pendingLine} · ` : null}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={onOpenBillingTab}
          >
            {copy.action.viewBilling}
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
