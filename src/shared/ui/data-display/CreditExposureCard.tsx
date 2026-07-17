/**
 * CreditExposureCard — semáforo de exposición de crédito (ADR-0049 Capa 3 Arranque).
 */

import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";

import type { ClientCreditSummary } from "@features/clients/domain/entities";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Progress } from "@shared/ui/progress";
import { InfoRow } from "@shared/ui/data-display/InfoRow";
import { EmptyState } from "@shared/ui/feedback-states";
import { cn } from "@shared/lib/utils/cn";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency, formatMxCurrencyWhole } from "@shared/utils/formatMxCurrency";

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

function formatUtilizationPct(utilizationPct: number | null): string {
  if (utilizationPct == null) return "—";
  return `${Math.round(utilizationPct * 100)}%`;
}

function formatBreakdownShare(amount: number, totalExposure: number): string {
  if (totalExposure <= 0) return "0%";
  return `${Math.round((amount / totalExposure) * 100)}%`;
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
        {!isCompact ? (
          <CardDescription>Utilización del límite y desglose de exposición.</CardDescription>
        ) : null}
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
      return <p className="text-sm text-muted-foreground">{copy.loading}</p>;
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
            <p className="text-sm">
              Exposición estimada:{" "}
              <span className="font-medium tabular-nums">
                {formatMxCurrency(summary.totalExposure)}
              </span>
            </p>
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

    return (
      <div className="space-y-4">
        <div
          className={cn(
            "space-y-3 rounded-lg border bg-muted/30",
            isCompact ? "p-3" : "p-4",
          )}
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p
                className={cn(
                  "font-semibold tabular-nums",
                  isCompact ? "text-lg" : "text-2xl",
                )}
              >
                {summary.availableCredit != null
                  ? formatMxCurrencyWhole(summary.availableCredit)
                  : "—"}
              </p>
              <p className="text-sm text-muted-foreground">{copy.available}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium tabular-nums">
                {formatUtilizationPct(summary.utilizationPct)}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.creditLimit != null
                  ? `de ${formatMxCurrencyWhole(summary.creditLimit)}`
                  : copy.utilization}
              </p>
            </div>
          </div>
          <Progress value={utilizationPercent} />
        </div>

        {showBreakdown ? (
          <div className="space-y-1">
            <InfoRow
              variant="inline"
              label={copy.breakdown.invoiced}
              value={
                <span className="tabular-nums">
                  {formatMxCurrency(summary.breakdown.invoiced)}{" "}
                  <span className="text-muted-foreground">
                    ({formatBreakdownShare(summary.breakdown.invoiced, summary.totalExposure)})
                  </span>
                </span>
              }
            />
            <InfoRow
              variant="inline"
              label={copy.breakdown.unbilled}
              value={
                <span className="tabular-nums">
                  {formatMxCurrency(summary.breakdown.unbilled)}{" "}
                  <span className="text-muted-foreground">
                    ({formatBreakdownShare(summary.breakdown.unbilled, summary.totalExposure)})
                  </span>
                </span>
              }
            />
            <InfoRow
              variant="inline"
              label={copy.breakdown.pendingDraft}
              value={
                <span className="tabular-nums">
                  {formatMxCurrency(summary.breakdown.pendingDraft)}{" "}
                  <span className="text-muted-foreground">
                    (
                    {formatBreakdownShare(
                      summary.breakdown.pendingDraft,
                      summary.totalExposure,
                    )}
                    )
                  </span>
                </span>
              }
            />
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
