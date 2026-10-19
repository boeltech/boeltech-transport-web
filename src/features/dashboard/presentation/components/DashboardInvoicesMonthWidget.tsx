import { FileText } from "lucide-react";
import { Button } from "@shared/ui/button";
import { ChartCard } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { cn } from "@shared/lib/utils/cn";
import type { FinanceSummary } from "@features/finance/domain";
import { dashboardCopy } from "../copy/dashboardCopy";
import {
  buildInvoicesStatusBreakdown,
  isInvoicesBreakdownEmpty,
} from "../utils/invoicesMonthHelpers";

interface DashboardInvoicesMonthWidgetProps {
  financeSummary?: FinanceSummary;
  isLoading: boolean;
  onOpenInvoices: () => void;
}

function StatusStat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "default" | "success" | "warning";
}) {
  const valueClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : "text-foreground";

  return (
    <div className="min-w-0 space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-2xl font-semibold tabular-nums tracking-tight",
          valueClass,
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Facturación — desglose actual por estado desde FinanceSummary.
 * Gate: showFinance (widget registry). Click → /finance/invoices.
 */
export function DashboardInvoicesMonthWidget({
  financeSummary,
  isLoading,
  onOpenInvoices,
}: DashboardInvoicesMonthWidgetProps) {
  const copy = dashboardCopy.invoicesMonth;
  const breakdown = buildInvoicesStatusBreakdown(financeSummary);
  const empty = isInvoicesBreakdownEmpty(breakdown);

  return (
    <ChartCard
      title={copy.title}
      description={copy.description}
      isLoading={isLoading}
      aria-label={copy.ariaLabel}
      tools={
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={onOpenInvoices}
          aria-label={copy.openAriaLabel}
        >
          {copy.viewInvoices}
        </Button>
      }
    >
      {empty ? (
        <EmptyState
          size="sm"
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <StatusStat
              label={copy.stamped}
              value={breakdown!.stamped}
              tone="success"
            />
            <StatusStat
              label={copy.pending}
              value={breakdown!.pending}
              hint={copy.pendingHint}
              tone={breakdown!.pending > 0 ? "warning" : "default"}
            />
          </div>
          {(breakdown!.cancellationPending > 0 || breakdown!.cancelled > 0) && (
            <p className="text-xs text-muted-foreground">
              {breakdown!.cancellationPending > 0
                ? `${copy.cancellationPending}: ${breakdown!.cancellationPending}`
                : null}
              {breakdown!.cancellationPending > 0 && breakdown!.cancelled > 0
                ? " · "
                : null}
              {breakdown!.cancelled > 0
                ? `${copy.cancelled}: ${breakdown!.cancelled}`
                : null}
            </p>
          )}
        </div>
      )}
    </ChartCard>
  );
}
