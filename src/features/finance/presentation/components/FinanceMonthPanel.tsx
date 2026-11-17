import { Link } from "react-router-dom";
import type { PeriodFinancials } from "@features/finance/domain";
import { computeMarginPct } from "@features/finance/application";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { financeCopy } from "../copy";
import { formatPct } from "../utils/monthlyPerformanceFormat";
import { pulseOperationalTotals } from "../utils/financePulse";

interface FinanceMonthPanelProps {
  pulseMonth?: PeriodFinancials | null;
  isLoading?: boolean;
  periodLabel?: string | null;
  analysisHref: string;
  /** Gasto de viaje del summary (approved). */
  expensesThisMonth?: number;
}

/**
 * Panel del mes (K2–K3) — Ingreso / Margen / Gasto; base operativa sin IVA.
 */
export function FinanceMonthPanel({
  pulseMonth,
  isLoading = false,
  periodLabel,
  analysisHref,
  expensesThisMonth,
}: FinanceMonthPanelProps) {
  const hub = financeCopy.page.hub;
  const { revenue, operationalMargin, hasOperationalMargin } =
    pulseOperationalTotals(pulseMonth);
  const marginPct = hasOperationalMargin
    ? computeMarginPct(operationalMargin, revenue)
    : null;
  const title = periodLabel
    ? hub.monthPanelTitle(periodLabel)
    : hub.monthPanelTitle("Mes en curso");

  const rows = [
    {
      key: "revenue",
      label: hub.monthPanelRevenue,
      hint: hub.monthPanelRevenueHint,
      value:
        pulseMonth && !isLoading ? formatMxCurrency(revenue) : "—",
    },
    {
      key: "margin",
      label: hub.monthPanelMargin,
      hint:
        marginPct != null
          ? hub.monthPanelMarginHint(formatPct(marginPct))
          : hub.monthPanelMarginHint("—"),
      value:
        pulseMonth && hasOperationalMargin && !isLoading
          ? formatMxCurrency(operationalMargin)
          : "—",
    },
    {
      key: "expense",
      label: hub.monthPanelExpense,
      hint: hub.monthPanelExpenseHint,
      value:
        expensesThisMonth != null && !isLoading
          ? formatMxCurrency(expensesThisMonth)
          : "—",
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{hub.monthPanelDescription}</CardDescription>
        </div>
        <Link
          to={analysisHref}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {hub.monthPanelCta} ↗
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li
                key={row.key}
                className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {row.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{row.hint}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums">
                  {row.value}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
