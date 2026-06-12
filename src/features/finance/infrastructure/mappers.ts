import type {
  AccountStatementItem,
  AgingByClientItem,
  AgingClientInvoiceItem,
  AgingSummary,
  ExpensesByCategory,
  ExpensesByDimensionItem,
  FinanceSummary,
  IncomeByMonth,
  InvoicesByStatusMonth,
  ProfitabilityAggregateItem,
  ProfitabilityStatus,
  ProfitabilityTripItem,
  ProfitabilityTripsResponse,
} from "@features/finance/domain";

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

export function mapFinanceSummary(raw: Record<string, unknown>): FinanceSummary {
  const status = (raw.invoices_by_status ?? {}) as Record<string, unknown>;
  return {
    totalReceivable: asNumber(raw.total_receivable),
    collectedThisMonth: asNumber(raw.collected_this_month),
    totalOverdue: asNumber(raw.total_overdue),
    expensesThisMonth: asNumber(raw.expenses_this_month),
    invoicesByStatus: {
      draft: asNumber(status.draft),
      stamped: asNumber(status.stamped),
      cancellationPending: asNumber(status.cancellation_pending),
      cancelled: asNumber(status.cancelled),
    },
  };
}

export function mapAccountStatementItem(
  raw: Record<string, unknown>,
): AccountStatementItem {
  return {
    clientRfc: asString(raw.client_rfc),
    clientName: asString(raw.client_name),
    totalInvoiced: asNumber(raw.total_invoiced),
    totalPaid: asNumber(raw.total_paid),
    balanceDue: asNumber(raw.balance_due),
    invoiceCount: asNumber(raw.invoice_count),
    overdueAmount: asNumber(raw.overdue_amount),
  };
}

function mapProfitabilityTripItem(
  raw: Record<string, unknown>,
): ProfitabilityTripItem {
  const grossMarginPct = raw.gross_margin_pct;
  const grossMargin = raw.gross_margin;
  const profitabilityStatus = raw.profitability_status;
  return {
    tripId: asString(raw.trip_id),
    tripCode: asString(raw.trip_code),
    clientName: asNullableString(raw.client_name),
    vehicleId: asString(raw.vehicle_id),
    driverId: asString(raw.driver_id),
    originCity: asString(raw.origin_city),
    destinationCity: asString(raw.destination_city),
    scheduledDeparture: asString(raw.scheduled_departure),
    revenue: asNumber(raw.revenue),
    actualTotal: asNumber(raw.actual_total),
    grossMargin: grossMargin == null ? null : asNumber(grossMargin),
    grossMarginPct:
      grossMarginPct == null ? null : asNumber(grossMarginPct),
    profitabilityStatus:
      profitabilityStatus == null || profitabilityStatus === ""
        ? null
        : (asString(profitabilityStatus) as ProfitabilityStatus),
    hasPendingExpenses: asBoolean(raw.has_pending_expenses),
    tripStatus: asNullableString(raw.trip_status) ?? undefined,
    financialBucket: asNullableString(raw.financial_bucket) as
      | ProfitabilityTripItem["financialBucket"]
      | undefined,
    projectedRevenue:
      raw.projected_revenue == null
        ? undefined
        : asNumber(raw.projected_revenue),
    recognizedRevenue:
      raw.recognized_revenue == null
        ? undefined
        : asNumber(raw.recognized_revenue),
    revenueSource:
      raw.revenue_source === "invoice_subtotal" ||
      raw.revenue_source === "trip_base_rate"
        ? raw.revenue_source
        : null,
    cancelledInvoiceRevenue:
      raw.cancelled_invoice_revenue == null
        ? undefined
        : asNumber(raw.cancelled_invoice_revenue),
  };
}

export function mapProfitabilityTripsResponse(
  raw: Record<string, unknown>,
): ProfitabilityTripsResponse {
  const rows = Array.isArray(raw.data) ? raw.data : [];
  const pagination = (raw.pagination ?? {}) as Record<string, unknown>;
  const aggregates = (raw.aggregates ?? {}) as Record<string, unknown>;
  const byStatus = (aggregates.by_profitability_status ?? {}) as Record<
    string,
    unknown
  >;

  return {
    data: rows.map((item) => mapProfitabilityTripItem(item as Record<string, unknown>)),
    pagination: {
      page: asNumber(pagination.page),
      limit: asNumber(pagination.limit),
      total: asNumber(pagination.total),
      totalPages: asNumber(pagination.total_pages),
    },
    aggregates: {
      totalRevenue: asNumber(aggregates.total_revenue),
      totalActual: asNumber(aggregates.total_actual),
      blendedMargin: asNumber(aggregates.blended_margin),
      blendedMarginPct:
        aggregates.blended_margin_pct == null
          ? null
          : asNumber(aggregates.blended_margin_pct),
      totalProjectedRevenue: asNumber(aggregates.total_projected_revenue),
      totalCancellationLoss: asNumber(aggregates.total_cancellation_loss),
      totalCancelledInvoiceRevenue: asNumber(
        aggregates.total_cancelled_invoice_revenue,
      ),
      byProfitabilityStatus: {
        high: asNumber(byStatus.high),
        medium: asNumber(byStatus.medium),
        low: asNumber(byStatus.low),
        breakeven: asNumber(byStatus.breakeven),
        loss: asNumber(byStatus.loss),
      },
    },
  };
}

export function mapProfitabilityAggregateItem(
  raw: Record<string, unknown>,
): ProfitabilityAggregateItem {
  const blendedMarginPct = raw.blended_margin_pct;
  return {
    key: asString(raw.key),
    label: asString(raw.label),
    tripCount: asNumber(raw.trip_count),
    totalRevenue: asNumber(raw.total_revenue),
    totalActual: asNumber(raw.total_actual),
    blendedMargin: asNumber(raw.blended_margin),
    blendedMarginPct:
      blendedMarginPct == null ? null : asNumber(blendedMarginPct),
  };
}

export function mapAgingSummary(raw: Record<string, unknown>): AgingSummary {
  const bucketsRaw = (raw.buckets ?? {}) as Record<string, unknown>;

  const pickBucket = (key: string) => {
    const item = (bucketsRaw[key] ?? {}) as Record<string, unknown>;
    return {
      invoiceCount: asNumber(item.invoice_count),
      totalBalance: asNumber(item.total_balance),
    };
  };

  return {
    totalReceivable: asNumber(raw.total_receivable),
    dso30d: asNumber(raw.dso_30d),
    buckets: {
      "0-30": pickBucket("0-30"),
      "31-60": pickBucket("31-60"),
      "61-90": pickBucket("61-90"),
      "90+": pickBucket("90+"),
    },
  };
}

export function mapAgingByClientItem(
  raw: Record<string, unknown>,
): AgingByClientItem {
  return {
    clientRfc: asString(raw.client_rfc),
    clientName: asString(raw.client_name),
    totalBalance: asNumber(raw.total_balance),
    invoiceCount: asNumber(raw.invoice_count),
    bucket030: asNumber(raw.bucket_0_30),
    bucket3160: asNumber(raw.bucket_31_60),
    bucket6190: asNumber(raw.bucket_61_90),
    bucket90Plus: asNumber(raw.bucket_90_plus),
  };
}

export function mapAgingClientInvoiceItem(
  raw: Record<string, unknown>,
): AgingClientInvoiceItem {
  return {
    invoiceId: asString(raw.invoice_id),
    receiverRfc: asString(raw.receiver_rfc),
    receiverName: asString(raw.receiver_name),
    total: asNumber(raw.total),
    balanceDue: asNumber(raw.balance_due),
    issuedDate: asString(raw.issued_date),
    dueDate: asString(raw.due_date),
    agingBucket: asString(raw.aging_bucket) as AgingClientInvoiceItem["agingBucket"],
  };
}

export function mapExpensesByCategory(
  raw: Record<string, unknown>,
): ExpensesByCategory {
  const seriesRaw = (raw.series ?? {}) as Record<string, unknown>;
  const series: Record<string, number[]> = {};
  for (const [key, value] of Object.entries(seriesRaw)) {
    const arr = Array.isArray(value) ? value : [];
    series[key] = arr.map((item) => asNumber(item));
  }
  const periods = Array.isArray(raw.periods) ? raw.periods.map(asString) : [];
  const total = Array.isArray(raw.total) ? raw.total.map(asNumber) : [];
  return { periods, series, total };
}

export function mapExpensesByDimensionItem(
  raw: Record<string, unknown>,
): ExpensesByDimensionItem {
  return {
    key: asString(raw.key),
    label: asString(raw.label),
    tripCount: asNumber(raw.trip_count),
    totalExpenses: asNumber(raw.total_expenses),
    avgExpensePerTrip: asNumber(raw.avg_expense_per_trip),
  };
}

export function mapIncomeByMonth(raw: Record<string, unknown>): IncomeByMonth {
  const periods = Array.isArray(raw.periods) ? raw.periods.map(asString) : [];
  const collected = Array.isArray(raw.collected)
    ? raw.collected.map(asNumber)
    : [];
  return { periods, collected };
}

export function mapInvoicesByStatusMonth(
  raw: Record<string, unknown>,
): InvoicesByStatusMonth {
  const periods = Array.isArray(raw.periods) ? raw.periods.map(asString) : [];
  const seriesRaw = (raw.series ?? {}) as Record<string, unknown>;
  const toNumberArray = (value: unknown) =>
    Array.isArray(value) ? value.map(asNumber) : [];

  return {
    periods,
    series: {
      draft: toNumberArray(seriesRaw.draft),
      stamped: toNumberArray(seriesRaw.stamped),
      cancellationPending: toNumberArray(seriesRaw.cancellation_pending),
      cancelled: toNumberArray(seriesRaw.cancelled),
    },
  };
}
