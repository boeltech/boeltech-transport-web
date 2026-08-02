import type { useNavigate } from "react-router-dom";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrencyWhole } from "@shared/utils/formatMxCurrency";
import type { useDashboard } from "../../application/hooks/useDashboard";
import type { useFinanceSummary } from "@features/finance";
import { dashboardCopy } from "../copy/dashboardCopy";

interface DashboardMetricTrendCardsProps {
  data: ReturnType<typeof useDashboard>["data"];
  isLoading: boolean;
  navigate: ReturnType<typeof useNavigate>;
  financeLoading: boolean;
  financeSummary?: ReturnType<typeof useFinanceSummary>["data"];
}

function ScorecardCell({
  title,
  subtitle,
  value,
  isLoading,
  onClick,
  tone = "default",
  className,
}: {
  title: string;
  subtitle?: string;
  value: string;
  isLoading?: boolean;
  onClick?: () => void;
  tone?: "default" | "warning";
  className?: string;
}) {
  const valueClass =
    tone === "warning" && !isLoading
      ? "text-warning-foreground"
      : "text-foreground";

  const body = (
    <div className={cn("flex h-full flex-col gap-1 p-5 sm:p-6", className)}>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {subtitle ? (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      ) : null}
      {isLoading ? (
        <Skeleton className="mt-1 h-8 w-28" />
      ) : (
        <p
          className={cn(
            "text-2xl font-semibold tabular-nums tracking-tight",
            valueClass,
          )}
        >
          {value}
        </p>
      )}
    </div>
  );

  if (!onClick) return body;

  return (
    <button
      type="button"
      className="w-full rounded-none text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      onClick={onClick}
    >
      {body}
    </button>
  );
}

/**
 * Month scorecard (PD1): Margen · Cobrado · Por cobrar · Vencido.
 * Only mounted for roles with showFinance (widget gate).
 */
export function DashboardMetricTrendCards({
  data,
  isLoading,
  navigate,
  financeLoading,
  financeSummary,
}: DashboardMetricTrendCardsProps) {
  const financialMonth = data?.stats.financial_month;
  const overdue = financeSummary?.totalOverdue ?? 0;
  const hasOverdue = overdue > 0;

  const cells: {
    key: string;
    title: string;
    subtitle: string;
    value: string;
    loading: boolean;
    onClick: () => void;
    tone?: "default" | "warning";
  }[] = [
    {
      key: "margin",
      title: dashboardCopy.scorecard.margin.title,
      subtitle: dashboardCopy.scorecard.margin.subtitle,
      value: financialMonth
        ? formatMxCurrencyWhole(financialMonth.actual_margin)
        : "—",
      loading: isLoading,
      onClick: () => navigate("/finance?tab=analysis&view=margin"),
    },
    {
      key: "collected",
      title: dashboardCopy.scorecard.collected.title,
      subtitle: dashboardCopy.scorecard.collected.subtitle,
      value: financeSummary
        ? formatMxCurrencyWhole(financeSummary.collectedThisMonth)
        : "—",
      loading: isLoading || financeLoading,
      onClick: () => navigate("/finance?tab=cobros"),
    },
    {
      key: "receivable",
      title: dashboardCopy.scorecard.receivable.title,
      subtitle: dashboardCopy.scorecard.receivable.subtitle,
      value: financeSummary
        ? formatMxCurrencyWhole(financeSummary.totalReceivable)
        : "—",
      loading: isLoading || financeLoading,
      onClick: () => navigate("/finance?tab=cobros"),
    },
    {
      key: "overdue",
      title: dashboardCopy.scorecard.overdue.title,
      subtitle: dashboardCopy.scorecard.overdue.subtitle,
      value: financeSummary ? formatMxCurrencyWhole(overdue) : "—",
      loading: isLoading || financeLoading,
      onClick: () => navigate("/finance?tab=cobros"),
      tone: hasOverdue ? "warning" : "default",
    },
  ];

  return (
    <section
      className="overflow-hidden rounded-2xl border bg-card shadow-sm"
      aria-label={dashboardCopy.scorecard.ariaLabel}
    >
      <div className="border-b px-5 py-3 sm:px-6">
        <h2 className="text-base font-medium tracking-tight">
          {dashboardCopy.scorecard.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {dashboardCopy.scorecard.description}
        </p>
      </div>
      <div className="grid divide-y sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
        {cells.map((cell, index) => (
          <ScorecardCell
            key={cell.key}
            title={cell.title}
            subtitle={cell.subtitle}
            value={cell.value}
            isLoading={cell.loading}
            onClick={cell.onClick}
            tone={cell.tone}
            className={cn(
              index % 2 === 0 && "sm:border-r sm:border-border",
              index < 2 && "sm:border-b sm:border-border lg:border-b-0",
              index < 3 && "lg:border-r lg:border-border",
            )}
          />
        ))}
      </div>
    </section>
  );
}
