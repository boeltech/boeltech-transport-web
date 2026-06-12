import { useMemo } from "react";
import {
  BoeltechBarChart,
  BoeltechLineChart,
  ChartCard,
} from "@shared/ui/data-display";
import type {
  IncomeByMonth,
  InvoicesByStatusMonth,
} from "@features/finance/domain";
import {
  buildInvoiceStatusMonthChartSeries,
  FINANCE_INCOME_SERIES,
  FINANCE_INVOICE_STATUS_CHART_CONFIG,
} from "../config/financeChartConfig";
import { financeCopy } from "../copy";
import {
  financeCurrencyValueFormatter,
  formatFinancePeriodLabel,
} from "../utils/financeChartHelpers";

interface FinanceSummaryTimeSeriesChartsProps {
  incomeByMonth?: IncomeByMonth;
  invoicesByStatusMonth?: InvoicesByStatusMonth;
  isLoading?: boolean;
}

export function FinanceSummaryTimeSeriesCharts({
  incomeByMonth,
  invoicesByStatusMonth,
  isLoading = false,
}: FinanceSummaryTimeSeriesChartsProps) {
  const incomeData = useMemo(
    () =>
      incomeByMonth
        ? incomeByMonth.periods.map((period, index) => ({
            label: formatFinancePeriodLabel(period),
            collected: incomeByMonth.collected[index] ?? 0,
          }))
        : [],
    [incomeByMonth],
  );

  const invoicesByStatusData = useMemo(
    () =>
      invoicesByStatusMonth
        ? invoicesByStatusMonth.periods.map((period, index) => ({
            label: formatFinancePeriodLabel(period),
            draft: invoicesByStatusMonth.series.draft[index] ?? 0,
            stamped: invoicesByStatusMonth.series.stamped[index] ?? 0,
            cancellationPending:
              invoicesByStatusMonth.series.cancellationPending[index] ?? 0,
            cancelled: invoicesByStatusMonth.series.cancelled[index] ?? 0,
          }))
        : [],
    [invoicesByStatusMonth],
  );

  const invoiceStatusSeries = useMemo(
    () => buildInvoiceStatusMonthChartSeries(),
    [],
  );

  const latestCollected = incomeData.at(-1)?.collected ?? 0;

  return (
    <div className="grid gap-6">
      <ChartCard
        title={financeCopy.summary.charts.incomeByMonth.title}
        description={financeCopy.summary.charts.incomeByMonth.description}
        isLoading={isLoading}
        aria-label="Gráfico de línea: ingresos cobrados por mes"
        footer={
          incomeData.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {financeCopy.summary.charts.incomeByMonth.footer(
                financeCurrencyValueFormatter(latestCollected),
              )}
            </p>
          ) : undefined
        }
      >
        <BoeltechLineChart
          data={incomeData}
          series={FINANCE_INCOME_SERIES}
          valueFormatter={financeCurrencyValueFormatter}
        />
      </ChartCard>

      <ChartCard
        title={financeCopy.summary.charts.invoicesByStatusMonth.title}
        description={financeCopy.summary.charts.invoicesByStatusMonth.description}
        isLoading={isLoading}
        aria-label="Gráfico de barras apiladas: facturas por estado y mes"
        footer={
          <p className="text-xs text-muted-foreground">
            {financeCopy.summary.charts.invoicesByStatusMonth.footer(
              FINANCE_INVOICE_STATUS_CHART_CONFIG.map(
                ({ copyKey }) => financeCopy.invoices.statusLabels[copyKey],
              ).join(" · "),
            )}
          </p>
        }
      >
        <BoeltechBarChart
          data={invoicesByStatusData}
          series={invoiceStatusSeries}
          stacked
        />
      </ChartCard>
    </div>
  );
}
