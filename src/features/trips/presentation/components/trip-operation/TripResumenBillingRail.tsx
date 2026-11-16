import { Link } from "react-router-dom";
import { Receipt } from "lucide-react";

import type { Trip } from "@features/trips/domain";
import { resolveOperationalCashSummary } from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { cn } from "@shared/lib/utils/cn";

import { cfdiEmissionIntentCopy } from "../../copy/cfdiEmissionIntentCopy";
import { tripDetailCopy } from "../../copy";
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
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 shrink-0 text-primary" />
            {cashCopy.sectionTitle}
          </CardTitle>
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
          <InfoRow
            variant="inline"
            label={copy.rail.rate}
            value={formatMxCurrency(rate)}
          />
          <InfoRow
            variant="inline"
            label={cashCopy.scorecardAccumulatedLabel}
            value={formatMxCurrency(collected)}
          />
          <InfoRow
            variant="inline"
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

  return (
    <Card data-testid="trip-resumen-billing-rail">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4 shrink-0 text-primary" />
          {copy.rail.billing}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {hasInvoice && invoicing.invoiceFolio
                ? copy.rail.freightInvoice(invoicing.invoiceFolio)
                : copy.rail.freightPending}
            </p>
            {hasInvoice && invoicing.invoiceId ? (
              <Link
                to={`/invoices/${invoicing.invoiceId}`}
                className="text-xs text-primary hover:underline"
              >
                {invoicing.invoiceFolio ?? invoicing.invoiceId}
              </Link>
            ) : null}
          </div>
          <Badge
            variant={invoiceStatusBadgeVariant(status)}
            tone="soft"
            className="shrink-0 text-[10px] font-normal"
          >
            {statusLabel}
          </Badge>
        </div>

        {trip.facturadoVigente != null ? (
          <InfoRow
            variant="inline"
            label={copy.label.facturadoVigente}
            value={formatMxCurrency(trip.facturadoVigente)}
          />
        ) : null}
        {trip.cobradoViaje != null ? (
          <InfoRow
            variant="inline"
            label={copy.label.cobradoViaje}
            value={formatMxCurrency(trip.cobradoViaje)}
          />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-xs text-muted-foreground">
            {status === "stamped" || status === "cancellation_pending"
              ? copy.rail.noBillingPending
              : null}
          </p>
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            onClick={onOpenBillingTab}
          >
            {copy.action.viewBilling}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
