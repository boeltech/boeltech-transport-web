import { useMemo } from "react";
import { PieChart } from "lucide-react";
import {
  BoeltechDonutChart,
  ChartCard,
} from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { FinanceSummary } from "@features/finance/domain";
import {
  buildInvoiceStatusChartSeries,
  FINANCE_INVOICE_STATUS_CHART_CONFIG,
  FINANCE_RECEIVABLE_AMOUNT_SERIES,
} from "../config/financeChartConfig";
import { financeCopy } from "../copy";
import {
  filterNonZeroChartSlices,
  financeCountValueFormatter,
  financeCurrencyValueFormatter,
} from "../utils/financeChartHelpers";

interface FinanceSummaryChartsProps {
  summary?: FinanceSummary;
  isLoading?: boolean;
}

function ChartEmptyState({ description }: { description: string }) {
  return (
    <EmptyState
      size="sm"
      icon={<PieChart className="h-8 w-8 text-muted-foreground" />}
      title={financeCopy.summary.charts.empty.title}
      description={description}
    />
  );
}

export function FinanceSummaryCharts({
  summary,
  isLoading = false,
}: FinanceSummaryChartsProps) {
  const amountSlices = useMemo(() => {
    if (!summary) return { data: [], series: FINANCE_RECEIVABLE_AMOUNT_SERIES };

    const data = [
      {
        label: financeCopy.summary.charts.amounts.receivable,
        value: summary.totalReceivable,
      },
      {
        label: financeCopy.summary.charts.amounts.collected,
        value: summary.collectedThisMonth,
      },
      {
        label: financeCopy.summary.charts.amounts.overdue,
        value: summary.totalOverdue,
      },
    ];

    return filterNonZeroChartSlices(data, FINANCE_RECEIVABLE_AMOUNT_SERIES);
  }, [summary]);

  const invoiceStatusSlices = useMemo(() => {
    if (!summary) {
      return { data: [], series: buildInvoiceStatusChartSeries() };
    }

    const series = buildInvoiceStatusChartSeries();
    const data = FINANCE_INVOICE_STATUS_CHART_CONFIG.map(({ key, copyKey }) => ({
      label: financeCopy.invoices.statusLabels[copyKey],
      value: summary.invoicesByStatus[key],
    }));

    return filterNonZeroChartSlices(data, series);
  }, [summary]);

  const invoiceTotal = useMemo(
    () =>
      summary
        ? Object.values(summary.invoicesByStatus).reduce(
            (sum, count) => sum + count,
            0,
          )
        : 0,
    [summary],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard
        title={financeCopy.summary.charts.amounts.title}
        description={financeCopy.summary.charts.amounts.description}
        isLoading={isLoading}
        aria-label="Gráfico de dona: cartera por cobrar"
        footer={
          summary ? (
            <p className="text-xs text-muted-foreground">
              {financeCopy.summary.charts.amounts.footer(
                formatMxCurrency(summary.totalReceivable),
                formatMxCurrency(summary.totalOverdue),
              )}
            </p>
          ) : undefined
        }
      >
        {!isLoading && amountSlices.data.length === 0 ? (
          <ChartEmptyState
            description={financeCopy.summary.charts.amounts.emptyDescription}
          />
        ) : (
          <BoeltechDonutChart
            data={amountSlices.data}
            series={amountSlices.series}
            valueFormatter={financeCurrencyValueFormatter}
            centerLabel={
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {summary ? formatMxCurrency(summary.totalReceivable) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {financeCopy.summary.charts.amounts.centerLabel}
                </p>
              </div>
            }
          />
        )}
      </ChartCard>

      <ChartCard
        title={financeCopy.summary.charts.invoiceStatus.title}
        description={financeCopy.summary.charts.invoiceStatus.description}
        isLoading={isLoading}
        aria-label="Gráfico de dona: facturas por estado"
        footer={
          summary ? (
            <p className="text-xs text-muted-foreground">
              {financeCopy.summary.invoicesCountLabel(invoiceTotal)}
            </p>
          ) : undefined
        }
      >
        {!isLoading && invoiceStatusSlices.data.length === 0 ? (
          <ChartEmptyState
            description={financeCopy.summary.charts.invoiceStatus.emptyDescription}
          />
        ) : (
          <BoeltechDonutChart
            data={invoiceStatusSlices.data}
            series={invoiceStatusSlices.series}
            valueFormatter={financeCountValueFormatter}
            centerLabel={
              <div>
                <p className="text-2xl font-bold tabular-nums">{invoiceTotal}</p>
                <p className="text-xs text-muted-foreground">
                  {financeCopy.summary.charts.invoiceStatus.centerLabel}
                </p>
              </div>
            }
          />
        )}
      </ChartCard>
    </div>
  );
}
