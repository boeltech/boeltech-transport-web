import type { useNavigate } from "react-router-dom";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrencyWhole } from "@shared/utils/formatMxCurrency";
import { getTodayString } from "@shared/utils/dateUtils";
import { parseMonthPeriod } from "@shared/utils/monthPeriod";
import { DASHBOARD_PATH } from "@shared/utils/reportsWayfinding";
import {
  buildFinanceAnalysisHref,
  FINANCE_HUB_PATH,
} from "@features/finance/application";
import type { useFinanceSummary } from "@features/finance";

/** Q27 — mismos tokens CSS que Cartera (`--chart-channel-*`). */
const CHANNEL_CSS = {
  with: "var(--chart-channel-with)",
  without: "var(--chart-channel-without)",
  overdueWith: "var(--chart-channel-overdue-with)",
  overdueWithout: "var(--chart-channel-overdue-without)",
} as const;
import type { useDashboard } from "../../application/hooks/useDashboard";
import type { FinancialTrendData } from "../../domain/types";
import { dashboardCopy } from "../copy/dashboardCopy";
import {
  buildMarginBarSeries,
  formatMonthTitle,
  formatPercentDeltaLabel,
  formatPeriodMonthTitle,
  getPreviousClosedMargin,
  marginShareOfRevenue,
  resolveMarginComparison,
  type MarginComparison,
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
  /** From `useFinancialTrend` — barras 6m + comparación. */
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

function ScorecardComparison({
  comparison,
}: {
  comparison: MarginComparison;
}) {
  const copy = dashboardCopy.scorecard.margin;

  if (comparison.kind === "first_month") {
    return (
      <p className="text-xs text-muted-foreground">{copy.firstMonth}</p>
    );
  }

  if (comparison.kind === "closed_fallback") {
    return (
      <p className="text-xs text-muted-foreground">
        {copy.closedIn(
          comparison.previousMonthTitle,
          formatMxCurrencyWhole(comparison.previousAmount),
        )}
      </p>
    );
  }

  const delta: PercentDelta = comparison.delta;
  return (
    <div className="flex min-h-5 flex-wrap items-center gap-1.5">
      {delta.kind === "percent" ? (
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
      ) : null}
      <span className="text-xs text-muted-foreground">
        {copy.vsPeriod(
          comparison.day,
          comparison.previousMonthAbbr,
          formatMxCurrencyWhole(comparison.previousAmount),
        )}
      </span>
    </div>
  );
}

function ChannelBar({
  withInvoice,
  withoutInvoice,
  tone = "default",
  ariaLabel,
}: {
  withInvoice: number;
  withoutInvoice: number;
  tone?: "default" | "warning";
  ariaLabel: string;
}) {
  const total = withInvoice + withoutInvoice;
  if (total <= 0) return null;
  const withPct = (withInvoice / total) * 100;
  const withoutPct = (withoutInvoice / total) * 100;
  return (
    <div
      className="flex h-2 w-full gap-0.5 overflow-hidden rounded-sm bg-muted"
      role="img"
      aria-label={ariaLabel}
    >
      {withPct > 0 ? (
        <span
          className="h-full rounded-sm"
          style={{
            width: `${withPct}%`,
            background:
              tone === "warning" ? CHANNEL_CSS.overdueWith : CHANNEL_CSS.with,
          }}
        />
      ) : null}
      {withoutPct > 0 ? (
        <span
          className="h-full rounded-sm"
          style={{
            width: `${withoutPct}%`,
            background:
              tone === "warning"
                ? CHANNEL_CSS.overdueWithout
                : CHANNEL_CSS.without,
          }}
        />
      ) : null}
    </div>
  );
}

function MarginTrendBars({
  bars,
  monthLower,
}: {
  bars: NonNullable<ReturnType<typeof buildMarginBarSeries>>;
  monthLower: string;
}) {
  const max = Math.max(1, ...bars.map((b) => Math.abs(b.value)));
  return (
    <div
      className="flex min-w-0 flex-col gap-1"
      data-testid="margin-trend-bars"
      role="img"
      aria-label={dashboardCopy.scorecard.margin.chartCap(monthLower)}
    >
      <p className="text-[11px] font-medium text-muted-foreground">
        {dashboardCopy.scorecard.margin.chartCap(monthLower)}
      </p>
      <div className="grid h-[76px] grid-cols-6 items-end gap-2">
        {bars.map((bar) => {
          const heightPct = Math.max(4, (Math.abs(bar.value) / max) * 100);
          return (
            <div
              key={bar.period}
              className="flex h-full flex-col items-center justify-end gap-0.5"
            >
              <span className="font-mono text-[10px] leading-3 text-muted-foreground tabular-nums">
                {formatMxCurrencyWhole(bar.value).replace(/\s/g, "")}
              </span>
              <i
                className={cn(
                  "scorecard-trend-bar",
                  bar.isCurrent && "scorecard-trend-bar--current",
                  bar.isReference && !bar.isCurrent && "scorecard-trend-bar--ref",
                )}
                style={{ height: `${heightPct}%` }}
                aria-hidden
              />
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-6 gap-2 text-center text-[11px] text-muted-foreground">
        {bars.map((bar) => (
          <span
            key={`${bar.period}-lbl`}
            className={cn(bar.isCurrent && "font-semibold text-foreground")}
          >
            {bar.monthAbbr}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Resumen del mes v2 (F5): Margen operativo 7/5 + Cobranza unificada.
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
  const pendingCount =
    financialMonth?.pending_expenses_count ??
    financialMonth?.trips_with_pending_expenses ??
    0;
  const pendingAmount =
    financialMonth?.pending_expenses_amount != null
      ? formatMxCurrencyWhole(financialMonth.pending_expenses_amount)
      : null;
  const isProvisional = pendingCount > 0;
  const navState = { from: fromHref };

  const today = getTodayString();
  const todayParts = parseMonthPeriod(today);
  const civilDay = Number(today.slice(8, 10)) || 1;
  const periodDay = financialTrend?.periodToDate?.day ?? civilDay;
  const monthTitle = todayParts
    ? formatMonthTitle(todayParts.month)
    : formatPeriodMonthTitle(today.slice(0, 7));
  const monthLower = monthTitle.toLocaleLowerCase("es-MX");

  const bars = buildMarginBarSeries(financialTrend);
  const comparison = resolveMarginComparison(financialTrend);
  const prevClosed = getPreviousClosedMargin(financialTrend);

  const tripCount = financialMonth?.trip_count ?? 0;
  const isEmptyMonth = !isLoading && tripCount <= 0;

  const marginValue = financialMonth
    ? formatMxCurrencyWhole(financialMonth.actual_margin)
    : "—";
  const revenueValue = financialMonth
    ? formatMxCurrencyWhole(financialMonth.actual_revenue)
    : "—";
  const costValue = financialMonth
    ? formatMxCurrencyWhole(financialMonth.actual_cost)
    : "—";
  const marginPct =
    financialMonth != null
      ? marginShareOfRevenue(
          financialMonth.actual_margin,
          financialMonth.actual_revenue,
        )
      : null;
  const revenuePerTripValue = formatRevenuePerTrip(
    financialMonth?.actual_revenue,
    financialMonth?.trip_count,
  );

  const arLoading = isLoading || financeLoading;
  const byChannel = financeSummary?.byChannel;
  const goToCartera = () => navigate(FINANCE_HUB_PATH, { state: navState });
  const goToMargin = () =>
    navigate(buildFinanceAnalysisHref("margin"), { state: navState });
  const goToExpenses = () =>
    navigate(buildFinanceAnalysisHref("expenses"), { state: navState });
  const goToApprovals = () =>
    navigate(APPROVALS_PENDING_HREF, { state: navState });

  const copy = dashboardCopy.scorecard;
  const cobranza = copy.cobranza;

  return (
    <section
      aria-labelledby="scorecard-zone-title"
      className="flex min-w-0 flex-col gap-2"
    >
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2
          id="scorecard-zone-title"
          className="text-base font-semibold leading-6 text-foreground"
        >
          {copy.title}
        </h2>
        <p className="text-[13px] text-muted-foreground">
          {copy.zoneSubtitle(monthTitle, periodDay)}
        </p>
      </div>

      <div
        className="grid min-w-0 gap-4 lg:grid-cols-12 lg:items-start"
        aria-label={copy.ariaLabel}
      >
        {/* Margen operativo */}
        <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm lg:col-span-7">
          <div className="flex flex-wrap items-baseline gap-2 px-5 pt-4 sm:px-6">
            <p className="text-sm font-semibold text-card-foreground">
              {copy.margin.title}
            </p>
            <span className="text-xs text-muted-foreground">
              {copy.margin.periodHeader(monthTitle, periodDay)}
            </span>
            {isProvisional && !isLoading ? (
              <Badge variant="warning" tone="soft" className="text-xs">
                {copy.margin.provisionalChip}
              </Badge>
            ) : null}
            <button
              type="button"
              className="ml-auto text-[13px] font-medium text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={goToMargin}
            >
              {copy.margin.openAnalysis}
            </button>
          </div>

          {isEmptyMonth ? (
            <div className="space-y-1 px-5 py-5 sm:px-6">
              <p className="text-sm font-medium text-card-foreground">
                {copy.margin.emptyTitle(monthLower)}
              </p>
              <p className="text-[13px] text-muted-foreground">
                {copy.margin.emptyBody(
                  prevClosed
                    ? copy.margin.closedIn(
                        prevClosed.monthTitle,
                        formatMxCurrencyWhole(prevClosed.amount),
                      )
                    : null,
                )}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-5 px-5 py-3 sm:grid-cols-[1fr_minmax(12rem,16.5rem)] sm:items-end sm:px-6">
                <div className="min-w-0 space-y-1.5">
                  {isLoading ? (
                    <Skeleton className="h-10 w-36" />
                  ) : (
                    <p className="truncate font-mono text-3xl font-bold tabular-nums tracking-tight text-card-foreground sm:text-[2rem] sm:leading-10">
                      {marginValue}
                      {marginPct != null ? (
                        <span className="ml-1.5 font-sans text-sm font-medium text-muted-foreground">
                          {marginPct}%
                        </span>
                      ) : null}
                    </p>
                  )}
                  {!isLoading && comparison ? (
                    <ScorecardComparison comparison={comparison} />
                  ) : null}
                </div>
                {bars ? (
                  <MarginTrendBars bars={bars} monthLower={monthLower} />
                ) : null}
              </div>

              <div
                className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center border-t border-border"
                role="group"
                aria-label="Ingreso menos costos aprobados igual margen"
              >
                <button
                  type="button"
                  className="flex flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
                  onClick={goToMargin}
                >
                  <span className="text-xs text-muted-foreground">
                    {copy.margin.formula.revenue}
                  </span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <span className="font-mono text-base font-semibold tabular-nums text-card-foreground">
                      {revenueValue}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {copy.margin.formula.revenueHint}
                  </span>
                </button>
                <span className="font-mono text-base text-muted-foreground" aria-hidden>
                  −
                </span>
                <button
                  type="button"
                  className="flex flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
                  onClick={goToExpenses}
                >
                  <span className="text-xs text-muted-foreground">
                    {copy.margin.formula.costs}
                  </span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <span className="font-mono text-base font-semibold tabular-nums text-card-foreground">
                      {costValue}
                    </span>
                  )}
                  {isProvisional && !isLoading ? (
                    <span className="text-[11px] font-medium text-warning-soft-foreground">
                      {copy.margin.formula.pendingCosts(pendingCount, pendingAmount)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      {copy.margin.formula.costsHint}
                    </span>
                  )}
                </button>
                <span className="font-mono text-base text-muted-foreground" aria-hidden>
                  =
                </span>
                <div className="flex flex-col gap-0.5 px-4 py-3 sm:px-5">
                  <span className="text-xs text-muted-foreground">
                    {copy.margin.formula.margin}
                  </span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <span className="font-mono text-base font-semibold tabular-nums text-card-foreground">
                      {marginValue}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {marginPct != null
                      ? copy.margin.formula.marginShare(marginPct)
                      : "—"}
                  </span>
                </div>
              </div>
            </>
          )}

          {isProvisional && !isLoading && !isEmptyMonth ? (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-border bg-warning-soft px-5 py-2.5 text-xs text-warning-soft-foreground sm:px-6">
              <span>{copy.margin.provisionalFooter(pendingCount)}</span>
              <button
                type="button"
                className="font-medium underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={goToApprovals}
              >
                {copy.margin.provisionalReview}
              </button>
            </div>
          ) : !isEmptyMonth ? (
            <div className="border-t border-border bg-muted px-5 py-2.5 text-xs text-muted-foreground sm:px-6">
              {isLoading ? (
                <Skeleton className="h-4 w-64" />
              ) : (
                <span>
                  {copy.margin.footerTrips(tripCount, revenuePerTripValue)}
                </span>
              )}
            </div>
          ) : null}
        </div>

        {/* Cobranza */}
        <div
          className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm lg:col-span-5"
          role="group"
          aria-label={cobranza.ariaLabel}
        >
          <div className="flex flex-wrap items-baseline gap-2 px-5 pt-4 sm:px-5">
            <p className="text-sm font-semibold">{cobranza.title}</p>
            <span className="ml-auto inline-flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ background: CHANNEL_CSS.with }}
                  aria-hidden
                />
                {cobranza.withInvoice}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ background: CHANNEL_CSS.without }}
                  aria-hidden
                />
                {cobranza.withoutInvoice}
              </span>
            </span>
          </div>

          <CobranzaRow
            title={cobranza.collected(monthLower)}
            value={
              financeSummary
                ? formatMxCurrencyWhole(financeSummary.collectedThisMonth)
                : "—"
            }
            isLoading={arLoading}
            onClick={goToCartera}
            ariaLabel={cobranza.collectedAria}
            withInvoice={byChannel?.withInvoice.collectedThisMonth}
            withoutInvoice={byChannel?.withoutInvoice.collectedThisMonth}
            withLabel={cobranza.withInvoice}
            withoutLabel={cobranza.withoutInvoice}
          />
          <CobranzaRow
            title={cobranza.receivable}
            value={
              financeSummary
                ? formatMxCurrencyWhole(financeSummary.totalReceivable)
                : "—"
            }
            isLoading={arLoading}
            onClick={goToCartera}
            ariaLabel={cobranza.receivableAria}
            withInvoice={byChannel?.withInvoice.receivable}
            withoutInvoice={byChannel?.withoutInvoice.receivable}
            withLabel={cobranza.withInvoice}
            withoutLabel={cobranza.withoutInvoice}
          />
          <CobranzaRow
            title={cobranza.overdue}
            value={financeSummary ? formatMxCurrencyWhole(overdue) : "—"}
            isLoading={arLoading}
            onClick={goToCartera}
            tone={hasOverdue ? "warning" : "default"}
            ariaLabel={cobranza.overdueAria}
            withInvoice={byChannel?.withInvoice.overdue}
            withoutInvoice={byChannel?.withoutInvoice.overdue}
            withLabel={cobranza.withInvoice}
            withoutLabel={cobranza.withoutInvoice}
            nothingOverdueLabel={
              !arLoading && financeSummary && !hasOverdue
                ? cobranza.nothingOverdue
                : undefined
            }
          />

          <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-2.5 text-xs text-muted-foreground">
            <span>{cobranza.footer}</span>
            <button
              type="button"
              className="ml-auto font-medium text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={goToCartera}
            >
              {cobranza.openCartera}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CobranzaRow({
  title,
  value,
  isLoading,
  onClick,
  tone = "default",
  ariaLabel,
  withInvoice,
  withoutInvoice,
  withLabel,
  withoutLabel,
  nothingOverdueLabel,
}: {
  title: string;
  value: string;
  isLoading?: boolean;
  onClick: () => void;
  tone?: "default" | "warning";
  ariaLabel: string;
  withInvoice?: number;
  withoutInvoice?: number;
  withLabel: string;
  withoutLabel: string;
  nothingOverdueLabel?: string;
}) {
  const showChannels =
    withInvoice != null &&
    withoutInvoice != null &&
    (withInvoice > 0 || withoutInvoice > 0);
  const valueClass =
    tone === "warning" && !isLoading ? "text-warning" : "text-card-foreground";

  return (
    <button
      type="button"
      className="flex flex-col gap-1.5 border-t border-border px-5 py-3.5 text-left text-card-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <div className="flex min-w-0 items-baseline gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
        {isLoading ? (
          <Skeleton className="ml-auto h-7 w-24 shrink-0" />
        ) : (
          <p
            className={cn(
              "ml-auto shrink-0 font-mono text-xl font-bold tabular-nums tracking-tight",
              valueClass,
            )}
          >
            {value}
          </p>
        )}
      </div>
      {nothingOverdueLabel ? (
        <span className="text-xs font-medium text-success">
          {nothingOverdueLabel}
        </span>
      ) : showChannels && !isLoading ? (
        <>
          <ChannelBar
            withInvoice={withInvoice!}
            withoutInvoice={withoutInvoice!}
            tone={tone}
            ariaLabel={`${withLabel} / ${withoutLabel}`}
          />
          <div className="flex justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {withLabel}{" "}
              <b className="font-mono font-semibold tabular-nums text-card-foreground">
                {formatMxCurrencyWhole(withInvoice!)}
              </b>
            </span>
            <span>
              {withoutLabel}{" "}
              <b className="font-mono font-semibold tabular-nums text-card-foreground">
                {formatMxCurrencyWhole(withoutInvoice!)}
              </b>
            </span>
          </div>
        </>
      ) : null}
    </button>
  );
}
