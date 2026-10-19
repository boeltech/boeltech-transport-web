import type { useNavigate } from "react-router-dom";
import { Badge } from "@shared/ui/badge";
import { Sparkline } from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrencyWhole } from "@shared/utils/formatMxCurrency";
import { DASHBOARD_PATH } from "@shared/utils/reportsWayfinding";
import {
  buildFinanceAnalysisHref,
  FINANCE_COBROS_PATH,
} from "@features/finance/application";
import type { useFinanceSummary } from "@features/finance";
import type { useDashboard } from "../../application/hooks/useDashboard";
import type { FinancialTrendData } from "../../domain/types";
import { dashboardCopy } from "../copy/dashboardCopy";
import {
  buildMarginSparkSeries,
  formatPercentDeltaLabel,
  getMarginMonthOverMonthDelta,
  type PercentDelta,
} from "../utils/scorecardTrendHelpers";
import { formatRevenuePerTrip } from "../utils/revenuePerTrip";

interface DashboardMetricTrendCardsProps {
  data: ReturnType<typeof useDashboard>["data"];
  isLoading: boolean;
  navigate: ReturnType<typeof useNavigate>;
  fromHref?: string;
  financeLoading: boolean;
  financeSummary?: ReturnType<typeof useFinanceSummary>["data"];
  /** From `useFinancialTrend` — enriches Margen when ≥2 periods exist. */
  financialTrend?: FinancialTrendData;
}

const APPROVALS_PENDING_HREF =
  "/finance/approvals?status=pending&type=trip_expense";

function deltaBadgeVariant(
  direction: "up" | "down" | "flat",
): "success" | "warning" | "neutral" {
  if (direction === "up") return "success";
  if (direction === "down") return "warning";
  return "neutral";
}

function deltaDirectionMark(direction: "up" | "down" | "flat"): string {
  if (direction === "up") return "▲";
  if (direction === "down") return "▼";
  return "●";
}

function ScorecardDelta({ delta }: { delta: PercentDelta }) {
  if (delta.kind !== "percent") return null;

  return (
    <div className="flex min-h-5 flex-wrap items-center gap-1.5">
      <Badge
        variant={deltaBadgeVariant(delta.direction)}
        tone="soft"
        className="shrink-0 text-xs font-semibold tabular-nums"
      >
        <span aria-hidden className="mr-1">
          {deltaDirectionMark(delta.direction)}
        </span>
        {formatPercentDeltaLabel(delta.percent)}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {dashboardCopy.scorecard.vsPreviousMonth}
      </span>
    </div>
  );
}

function ArStackCard({
  title,
  subtitle,
  value,
  isLoading,
  onClick,
  tone = "default",
  ariaLabel,
}: {
  title: string;
  subtitle?: string;
  value: string;
  isLoading?: boolean;
  onClick: () => void;
  tone?: "default" | "warning";
  ariaLabel: string;
}) {
  // En bg-card usar text-card-foreground / text-warning — nunca *-foreground sólido.
  const valueClass =
    tone === "warning" && !isLoading ? "text-warning" : "text-card-foreground";

  return (
    <button
      type="button"
      className="flex min-h-0 min-w-0 flex-1 flex-col justify-between gap-2 rounded-2xl border border-border bg-card p-4 text-left text-card-foreground shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-5"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {subtitle ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {isLoading ? (
        <Skeleton className="h-7 w-24 shrink-0" />
      ) : (
        <p
          className={cn(
            "shrink-0 pb-0.5 text-xl font-semibold leading-snug tabular-nums tracking-tight sm:text-2xl",
            valueClass,
          )}
        >
          {value}
        </p>
      )}
    </button>
  );
}

/**
 * Cluster Aurora: hero Margen (+ ingreso/viaje en footer) | stack AR vertical.
 * Mounted for showFinance roles.
 */
export function DashboardMetricTrendCards({
  data,
  isLoading,
  navigate,
  fromHref = DASHBOARD_PATH,
  financeLoading,
  financeSummary,
  financialTrend,
}: DashboardMetricTrendCardsProps) {
  const financialMonth = data?.stats.financial_month;
  const overdue = financeSummary?.totalOverdue ?? 0;
  const hasOverdue = overdue > 0;
  const isProvisional =
    (financialMonth?.trips_with_pending_expenses ?? 0) > 0;
  const navState = { from: fromHref };

  const marginSpark = buildMarginSparkSeries(financialTrend);
  const marginDelta = getMarginMonthOverMonthDelta(financialTrend);
  const showSpark = Boolean(marginSpark && marginSpark.length >= 2 && !isLoading);
  const showDelta = marginDelta?.kind === "percent" && !isLoading;

  const marginValue = financialMonth
    ? formatMxCurrencyWhole(financialMonth.actual_margin)
    : "—";
  const revenuePerTripValue = formatRevenuePerTrip(
    financialMonth?.actual_revenue,
    financialMonth?.trip_count,
  );

  const arLoading = isLoading || financeLoading;

  const marginValueClass =
    isProvisional && !isLoading ? "text-warning" : "text-card-foreground";

  return (
    <section
      aria-label={dashboardCopy.scorecard.ariaLabel}
      className="min-w-0"
    >
      <div className="grid min-w-0 gap-4 lg:grid-cols-12 lg:items-stretch">
        {/* Hero: Margen + ingreso/viaje (footer) */}
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm lg:col-span-7 xl:col-span-8">
          <button
            type="button"
            className="flex min-h-0 flex-1 flex-col gap-4 p-5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:p-6"
            onClick={() =>
              navigate(
                isProvisional
                  ? APPROVALS_PENDING_HREF
                  : buildFinanceAnalysisHref("margin"),
                { state: navState },
              )
            }
            aria-label={
              isProvisional
                ? dashboardCopy.scorecard.margin.provisionalAriaLabel
                : dashboardCopy.scorecard.margin.title
            }
          >
            <div className="min-w-0 space-y-1">
              <div className="flex min-h-5 flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {dashboardCopy.scorecard.margin.title}
                </p>
                {isProvisional && !isLoading ? (
                  <Badge variant="warning" tone="soft" className="text-xs">
                    {dashboardCopy.scorecard.margin.provisionalChip}
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardCopy.scorecard.margin.subtitle}
              </p>
            </div>

            <div className="flex flex-1 items-end justify-between gap-3 sm:gap-4">
              <div className="min-w-0 space-y-1.5">
                {isLoading ? (
                  <Skeleton className="h-10 w-36" />
                ) : (
                  <p
                    className={cn(
                      "truncate text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl",
                      marginValueClass,
                    )}
                  >
                    {marginValue}
                  </p>
                )}
                {showDelta && marginDelta ? (
                  <ScorecardDelta delta={marginDelta} />
                ) : null}
                {isProvisional && !isLoading ? (
                  <p className="text-xs text-warning">
                    {dashboardCopy.scorecard.margin.provisionalHint}
                  </p>
                ) : null}
              </div>
              {showSpark && marginSpark ? (
                <div
                  className="hidden w-20 shrink-0 sm:block md:w-[120px]"
                  aria-hidden
                  data-testid="margin-sparkline"
                >
                  <Sparkline
                    data={marginSpark}
                    token="chart-1"
                    height={40}
                    variant="line"
                  />
                </div>
              ) : null}
            </div>
          </button>

          <div
            className="border-t border-border px-5 py-4 sm:px-6"
            role="group"
            aria-label={dashboardCopy.scorecard.revenuePerTrip.ariaLabel}
          >
            <div className="flex min-w-0 items-end justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium text-muted-foreground">
                  {dashboardCopy.scorecard.revenuePerTrip.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dashboardCopy.scorecard.revenuePerTrip.subtitle}
                </p>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-24 shrink-0" />
              ) : (
                <p className="shrink-0 text-xl font-semibold tabular-nums tracking-tight text-card-foreground">
                  {revenuePerTripValue}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stack AR vertical */}
        <div
          className="flex min-h-0 min-w-0 flex-col gap-3 lg:col-span-5 xl:col-span-4"
          aria-label={dashboardCopy.scorecard.arStrip.ariaLabel}
        >
          <ArStackCard
            title={dashboardCopy.scorecard.collected.title}
            subtitle={dashboardCopy.scorecard.collected.subtitle}
            value={
              financeSummary
                ? formatMxCurrencyWhole(financeSummary.collectedThisMonth)
                : "—"
            }
            isLoading={arLoading}
            onClick={() => navigate(FINANCE_COBROS_PATH, { state: navState })}
            ariaLabel={dashboardCopy.scorecard.collected.ariaLabel}
          />
          <ArStackCard
            title={dashboardCopy.scorecard.receivable.title}
            subtitle={dashboardCopy.scorecard.receivable.subtitle}
            value={
              financeSummary
                ? formatMxCurrencyWhole(financeSummary.totalReceivable)
                : "—"
            }
            isLoading={arLoading}
            onClick={() => navigate(FINANCE_COBROS_PATH, { state: navState })}
            ariaLabel={dashboardCopy.scorecard.receivable.ariaLabel}
          />
          <ArStackCard
            title={dashboardCopy.scorecard.overdue.title}
            subtitle={dashboardCopy.scorecard.overdue.subtitle}
            value={financeSummary ? formatMxCurrencyWhole(overdue) : "—"}
            isLoading={arLoading}
            onClick={() => navigate(FINANCE_COBROS_PATH, { state: navState })}
            tone={hasOverdue ? "warning" : "default"}
            ariaLabel={dashboardCopy.scorecard.overdue.ariaLabel}
          />
        </div>
      </div>
    </section>
  );
}
