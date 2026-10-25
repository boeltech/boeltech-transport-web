import type {
  AlignedPerformanceMonth,
  MarginAnalysisDimension,
} from "@features/finance/application";
import type {
  AgingByClientItem,
  ExpensesByDimensionItem,
  ProfitabilityAggregateItem,
  ProfitabilityScope,
  ProfitabilityTripItem,
} from "@features/finance/domain";
import { getTodayString } from "@shared/utils/dateUtils";
import { downloadCsv } from "@shared/utils/exportCsv";
import { financeCopy } from "../copy";
import { buildMonthlyPerformanceCsv } from "./monthlyPerformanceFormat";

function nowDateKey(): string {
  return getTodayString();
}

export interface ProfitabilityAggregateCsvContext {
  dimension: MarginAnalysisDimension;
  scope: ProfitabilityScope;
  from?: string;
  to?: string;
}

/** Tabla agrupada visible (dimensión + periodo), completa y en el orden de pantalla. */
export function buildProfitabilityAggregateCsv(
  items: readonly ProfitabilityAggregateItem[],
  { dimension, scope, from = "", to = "" }: ProfitabilityAggregateCsvContext,
): { headers: string[]; rows: (string | number | null)[][] } {
  return {
    headers: [
      "dimension",
      "scope",
      "from",
      "to",
      "key",
      "label",
      "trip_count",
      "total_revenue",
      "total_actual",
      "blended_margin",
      "blended_margin_pct",
    ],
    rows: items.map((item) => [
      dimension,
      scope,
      from,
      to,
      item.key,
      item.label,
      item.tripCount,
      item.totalRevenue,
      item.totalActual,
      item.blendedMargin,
      item.blendedMarginPct,
    ]),
  };
}

export function exportProfitabilityAggregateCsv(
  items: readonly ProfitabilityAggregateItem[],
  context: ProfitabilityAggregateCsvContext,
): void {
  const slug = financeCopy.expenses.filters.exportFileSlug[context.dimension];
  const periodKey =
    context.from && context.to ? `${context.from}_${context.to}` : nowDateKey();
  const { headers, rows } = buildProfitabilityAggregateCsv(items, context);
  downloadCsv(
    `${financeCopy.exports.files.profitabilityGroupedPrefix}-${slug}-${periodKey}.csv`,
    headers,
    rows,
  );
}

export function exportProfitabilityTripsCsv(
  trips: readonly ProfitabilityTripItem[],
): void {
  const rows = trips.map((row) => [
    row.tripCode,
    row.clientName ?? "",
    row.revenue,
    row.actualTotal,
    row.tripCommissionTotal ?? "",
    row.operationalCost ?? "",
    row.grossMargin,
    row.operationalMargin ?? "",
    row.grossMarginPct,
    row.operationalMarginPct ?? "",
    row.profitabilityStatus,
    row.operationalProfitabilityStatus ?? "",
  ]);
  downloadCsv(
    `${financeCopy.exports.files.profitability}-${nowDateKey()}.csv`,
    [
      "trip_code",
      "client_name",
      "revenue",
      "actual_total",
      "trip_commission_total",
      "operational_cost",
      "gross_margin",
      "operational_margin",
      "gross_margin_pct",
      "operational_margin_pct",
      "profitability_status",
      "operational_profitability_status",
    ],
    rows,
  );
}

export function exportMonthlyPerformanceCsv(
  months: readonly AlignedPerformanceMonth[],
  options: { compare: boolean },
): void {
  const { headers, rows } = buildMonthlyPerformanceCsv(months, options);
  downloadCsv(
    `${financeCopy.exports.files.performance}-${nowDateKey()}.csv`,
    headers,
    rows,
  );
}

export function exportAgingByClientCsv(
  items: readonly AgingByClientItem[],
): void {
  const rows = items.map((row) => [
    row.clientRfc,
    row.clientName,
    row.totalBalance,
    row.invoiceCount,
    row.bucket030,
    row.bucket3160,
    row.bucket6190,
    row.bucket90Plus,
  ]);
  downloadCsv(
    `${financeCopy.exports.files.aging}-${nowDateKey()}.csv`,
    [
      "client_rfc",
      "client_name",
      "total_balance",
      "invoice_count",
      "bucket_0_30",
      "bucket_31_60",
      "bucket_61_90",
      "bucket_90_plus",
    ],
    rows,
  );
}

type ExpenseExportDimension = "vehicle" | "driver" | "client" | "route";

export function exportExpensesByDimensionCsv(
  items: readonly ExpensesByDimensionItem[],
  dimension: ExpenseExportDimension,
): void {
  const slug = financeCopy.expenses.filters.exportFileSlug[dimension];
  const rows = items.map((row) => [
    row.key,
    row.label,
    row.tripCount,
    row.totalExpenses,
    row.avgExpensePerTrip,
  ]);
  downloadCsv(
    `${financeCopy.exports.files.expensesPrefix}-${slug}-${nowDateKey()}.csv`,
    ["key", "label", "trip_count", "total_expenses", "avg_expense_per_trip"],
    rows,
  );
}
