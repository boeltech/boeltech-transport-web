import type { useNavigate } from "react-router-dom";
import { Badge } from "@shared/ui/badge";
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

const APPROVALS_PENDING_HREF =
  "/finance/approvals?status=pending&type=trip_expense";

function ScorecardCell({
  title,
  subtitle,
  value,
  isLoading,
  onClick,
  tone = "default",
  chip,
  hint,
  ariaLabel,
  className,
}: {
  title: string;
  subtitle?: string;
  value: string;
  isLoading?: boolean;
  onClick?: () => void;
  tone?: "default" | "warning";
  chip?: string;
  hint?: string;
  ariaLabel?: string;
  className?: string;
}) {
  // Semantic fill on neutral card — same pattern as DashboardKpiStrip
  // (`text-warning`). Never use `*-foreground` here: those tokens are for
  // text *on* solid warning/success fills and fail AA on bg-card in dark.
  const valueClass =
    tone === "warning" && !isLoading ? "text-warning" : "text-foreground";

  const body = (
    <div className="flex h-full min-h-0 flex-col justify-between gap-6 p-5 sm:p-6">
      <div className="space-y-1">
        <div className="flex min-h-5 items-center gap-2">
          <p className="min-w-0 text-sm font-medium text-muted-foreground">
            {title}
          </p>
          {chip && !isLoading ? (
            <Badge
              variant="warning"
              tone="soft"
              className="shrink-0 text-xs"
            >
              {chip}
            </Badge>
          ) : null}
        </div>
        <p className="min-h-4 text-xs text-muted-foreground">
          {subtitle ?? "\u00a0"}
        </p>
      </div>
      <div className="space-y-1">
        {isLoading ? (
          <Skeleton className="h-8 w-28" />
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
        <p
          className={cn(
            "min-h-4 text-xs",
            hint && !isLoading ? "text-warning" : "text-transparent",
          )}
          aria-hidden={!hint || isLoading}
        >
          {hint && !isLoading ? hint : "\u00a0"}
        </p>
      </div>
    </div>
  );

  if (!onClick) {
    return <div className={cn("h-full min-w-0", className)}>{body}</div>;
  }

  return (
    <button
      type="button"
      className={cn(
        "block h-full min-w-0 w-full rounded-none text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        className,
      )}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {body}
    </button>
  );
}

/**
 * Month scorecard (PD-A/B): Margen operativo · Cobrado · Por cobrar · Vencido.
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
  const isProvisional =
    (financialMonth?.trips_with_pending_expenses ?? 0) > 0;

  const cells: {
    key: string;
    title: string;
    subtitle: string;
    value: string;
    loading: boolean;
    onClick: () => void;
    tone?: "default" | "warning";
    chip?: string;
    hint?: string;
    ariaLabel?: string;
  }[] = [
    {
      key: "margin",
      title: dashboardCopy.scorecard.margin.title,
      subtitle: dashboardCopy.scorecard.margin.subtitle,
      value: financialMonth
        ? formatMxCurrencyWhole(financialMonth.actual_margin)
        : "—",
      loading: isLoading,
      onClick: () =>
        navigate(
          isProvisional
            ? APPROVALS_PENDING_HREF
            : "/finance/analysis?view=margin",
        ),
      tone: isProvisional ? "warning" : "default",
      chip: isProvisional
        ? dashboardCopy.scorecard.margin.provisionalChip
        : undefined,
      hint: isProvisional
        ? dashboardCopy.scorecard.margin.provisionalHint
        : undefined,
      ariaLabel: isProvisional
        ? dashboardCopy.scorecard.margin.provisionalAriaLabel
        : undefined,
    },
    {
      key: "collected",
      title: dashboardCopy.scorecard.collected.title,
      subtitle: dashboardCopy.scorecard.collected.subtitle,
      value: financeSummary
        ? formatMxCurrencyWhole(financeSummary.collectedThisMonth)
        : "—",
      loading: isLoading || financeLoading,
      onClick: () => navigate("/finance/cobros"),
    },
    {
      key: "receivable",
      title: dashboardCopy.scorecard.receivable.title,
      subtitle: dashboardCopy.scorecard.receivable.subtitle,
      value: financeSummary
        ? formatMxCurrencyWhole(financeSummary.totalReceivable)
        : "—",
      loading: isLoading || financeLoading,
      onClick: () => navigate("/finance/cobros"),
    },
    {
      key: "overdue",
      title: dashboardCopy.scorecard.overdue.title,
      subtitle: dashboardCopy.scorecard.overdue.subtitle,
      value: financeSummary ? formatMxCurrencyWhole(overdue) : "—",
      loading: isLoading || financeLoading,
      onClick: () => navigate("/finance/cobros"),
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
            chip={cell.chip}
            hint={cell.hint}
            ariaLabel={cell.ariaLabel}
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
