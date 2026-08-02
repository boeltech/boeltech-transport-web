/**
 * CreditExposureCard — semáforo de exposición de crédito (ADR-0049 Capa 3 Arranque).
 *
 * Importes siempre exactos (2 decimales): el disponible es un saldo que el
 * usuario compara contra facturas, por lo que no se redondea a pesos.
 */

import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";

import type { ClientCreditSummary } from "@features/clients/domain/entities";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Progress } from "@shared/ui/progress";
import { Skeleton } from "@shared/ui/skeleton";
import { InfoRow } from "@shared/ui/data-display/InfoRow";
import { EmptyState } from "@shared/ui/feedback-states";
import { cn } from "@shared/lib/utils/cn";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

import { creditExposureCopy } from "./creditExposureCopy";

type CreditBadgeVariant = "success" | "warning" | "destructive" | "neutral";

function getStatusBadgeVariant(status: ClientCreditSummary["status"]): CreditBadgeVariant {
  switch (status) {
    case "ok":
      return "success";
    case "warn":
      return "warning";
    case "exceeded":
      return "destructive";
    case "no_credit_terms":
    case "no_limit":
    default:
      return "neutral";
  }
}

function getProgressIndicatorClass(status: ClientCreditSummary["status"]): string | undefined {
  switch (status) {
    case "warn":
      return "bg-warning";
    case "exceeded":
      return "bg-destructive";
    default:
      return undefined;
  }
}

function formatUtilizationPct(utilizationPct: number | null): string {
  if (utilizationPct == null) return "—";
  return `${Math.round(utilizationPct * 100)}%`;
}

export interface CreditExposureCardProps {
  summary?: ClientCreditSummary;
  isLoading?: boolean;
  isError?: boolean;
  variant?: "full" | "compact";
  showBreakdown?: boolean;
  className?: string;
}

export function CreditExposureCard({
  summary,
  isLoading = false,
  isError = false,
  variant = "full",
  showBreakdown = false,
  className,
}: CreditExposureCardProps) {
  const copy = creditExposureCopy;
  const isCompact = variant === "compact";
  const amountClass = cn(
    "font-semibold tabular-nums tracking-tight",
    isCompact ? "text-xl" : "text-3xl",
  );
  const microLabelClass =
    "text-xs font-medium uppercase tracking-wide text-muted-foreground";

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="space-y-1">
        <CardTitle
          className={cn(
            "flex items-center gap-2",
            isCompact ? "text-sm font-medium" : "text-base",
          )}
        >
          <Wallet className={cn("shrink-0 text-primary", isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} />
          {copy.title}
        </CardTitle>
        {!isCompact ? <CardDescription>{copy.description}</CardDescription> : null}
      </div>
      {summary ? (
        <Badge variant={getStatusBadgeVariant(summary.status)} tone="soft">
          {copy.statusLabel[summary.status]}
        </Badge>
      ) : null}
    </div>
  );

  const body = (() => {
    if (isLoading) {
      return (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className={isCompact ? "h-6 w-28" : "h-8 w-44"} />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <span className="sr-only">{copy.loading}</span>
        </div>
      );
    }
    if (isError || !summary) {
      return (
        <EmptyState
          icon={<Wallet className="h-8 w-8" />}
          title={copy.unavailable}
          size="sm"
        />
      );
    }

    if (summary.status === "no_credit_terms") {
      return <p className="text-sm text-muted-foreground">{copy.noCreditTerms}</p>;
    }

    if (summary.status === "no_limit") {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{copy.noLimit}</p>
          {summary.totalExposure > 0 ? (
            <div className="space-y-0.5">
              <p className={microLabelClass}>{copy.used}</p>
              <p className={amountClass}>{formatMxCurrency(summary.totalExposure)}</p>
            </div>
          ) : null}
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to={`/clients/${summary.clientId}/edit`}>{copy.configureLimit}</Link>
          </Button>
        </div>
      );
    }

    const utilizationPercent = Math.min(
      100,
      Math.round((summary.utilizationPct ?? 0) * 100),
    );
    const overLimitAmount =
      summary.creditLimit != null
        ? Math.max(0, summary.totalExposure - summary.creditLimit)
        : 0;
    const showsOverLimit = summary.status === "exceeded" && overLimitAmount > 0;
    const heroAmount = showsOverLimit ? overLimitAmount : summary.availableCredit;

    const breakdownRows = [
      { key: "invoiced", label: copy.breakdown.invoiced, amount: summary.breakdown.invoiced },
      { key: "unbilled", label: copy.breakdown.unbilled, amount: summary.breakdown.unbilled },
      {
        key: "pendingDraft",
        label: copy.breakdown.pendingDraft,
        amount: summary.breakdown.pendingDraft,
      },
    ];

    return (
      <div className="space-y-4">
        <div
          className={cn(
            "space-y-3 rounded-lg border bg-muted/30",
            isCompact ? "p-3" : "p-4",
          )}
        >
          <div className="space-y-0.5">
            {showsOverLimit ? <p className={microLabelClass}>{copy.overLimit}</p> : null}
            <p className={cn(amountClass, showsOverLimit && "text-destructive")}>
              {heroAmount != null ? formatMxCurrency(heroAmount) : "—"}
            </p>
          </div>

          <Progress
            value={utilizationPercent}
            aria-label={copy.utilization}
            indicatorClassName={getProgressIndicatorClass(summary.status)}
          />

          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {summary.creditLimit != null
                ? copy.usedOfLimit(
                    formatMxCurrency(summary.totalExposure),
                    formatMxCurrency(summary.creditLimit),
                  )
                : `${copy.used} ${formatMxCurrency(summary.totalExposure)}`}
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {formatUtilizationPct(summary.utilizationPct)}
            </span>
          </div>
        </div>

        {showBreakdown ? (
          <div className="space-y-1">
            <p className={microLabelClass}>{copy.breakdownTitle}</p>
            {breakdownRows.map((row) => (
              <InfoRow
                key={row.key}
                variant="inline"
                label={row.label}
                value={
                  <span className="tabular-nums">{formatMxCurrency(row.amount)}</span>
                }
              />
            ))}
          </div>
        ) : null}

        {summary.nextInvoiceDueAt ? (
          <p className="text-xs text-muted-foreground">
            {copy.nextDue(formatDate(summary.nextInvoiceDueAt))}
          </p>
        ) : null}
      </div>
    );
  })();

  if (isCompact) {
    return (
      <div className={cn("rounded-lg border bg-card p-4 shadow-sm", className)}>
        {header}
        <div className="mt-3">{body}</div>
      </div>
    );
  }

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader className="pb-3">{header}</CardHeader>
      <CardContent className="flex-1 pt-0">{body}</CardContent>
    </Card>
  );
}
