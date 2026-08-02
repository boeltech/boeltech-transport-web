import type {
  AgingByClientItem,
  ExpensesByDimensionItem,
  ProfitabilityTripItem,
} from "@features/finance/domain";
import { downloadCsv } from "@shared/utils/exportCsv";
import { financeCopy } from "../copy";

function nowDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportProfitabilityTripsCsv(
  trips: readonly ProfitabilityTripItem[],
): void {
  const rows = trips.map((row) => [
    row.tripCode,
    row.clientName ?? "",
    row.revenue,
    row.actualTotal,
    row.grossMargin,
    row.grossMarginPct,
    row.profitabilityStatus,
  ]);
  downloadCsv(
    `${financeCopy.exports.files.profitability}-${nowDateKey()}.csv`,
    [
      "trip_code",
      "client_name",
      "revenue",
      "actual_total",
      "gross_margin",
      "gross_margin_pct",
      "profitability_status",
    ],
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

export function exportExpensesByDimensionCsv(
  items: readonly ExpensesByDimensionItem[],
): void {
  const rows = items.map((row) => [
    row.key,
    row.label,
    row.tripCount,
    row.totalExpenses,
    row.avgExpensePerTrip,
  ]);
  downloadCsv(
    `${financeCopy.exports.files.expensesByClient}-${nowDateKey()}.csv`,
    ["key", "label", "trip_count", "total_expenses", "avg_expense_per_trip"],
    rows,
  );
}
