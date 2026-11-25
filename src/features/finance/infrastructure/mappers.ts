import type {
  AccountStatementItem,
  AgingBucket,
  AgingBucketTotals,
  CollectionChannel,
  PendingRelationCount,
  AgingByClientItem,
  AgingClientInvoiceItem,
  AgingSummary,
  ChannelMoneySnapshot,
  DsoByChannel,
  ExpensesByCategory,
  ExpensesByDimensionItem,
  FinanceSummary,
  IncomeByMonth,
  InvoicesByStatusMonth,
  MonthlyPerformance,
  OperationalAgingBucket,
  PeriodFinancials,
  ProfitabilityAggregateItem,
  ProfitabilityStatus,
  ProfitabilityTripItem,
  ProfitabilityTripsResponse,
  CollectionsWeek,
  CollectionsWeekDay,
} from "@features/finance/domain";
import { parseMarginBasis } from "@features/finance/domain";

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

function mapChannelMoneySnapshot(
  raw: Record<string, unknown> | undefined,
): ChannelMoneySnapshot {
  const src = raw ?? {};
  return {
    receivable: asNumber(src.receivable),
    collectedThisMonth: asNumber(src.collected_this_month),
    overdue: asNumber(src.overdue),
  };
}

function mapCollectionChannel(value: unknown): CollectionChannel | null {
  if (value === "with_invoice" || value === "without_invoice") return value;
  return null;
}

function mapAgingBucketTotals(raw: unknown): AgingBucketTotals {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    invoiceCount: asNumber(item.invoice_count),
    totalBalance: asNumber(item.total_balance),
  };
}

function mapAgingBucketsRecord(
  raw: unknown,
): Record<AgingBucket, AgingBucketTotals> {
  const bucketsRaw = (raw ?? {}) as Record<string, unknown>;
  return {
    "0-30": mapAgingBucketTotals(bucketsRaw["0-30"]),
    "31-60": mapAgingBucketTotals(bucketsRaw["31-60"]),
    "61-90": mapAgingBucketTotals(bucketsRaw["61-90"]),
    "90+": mapAgingBucketTotals(bucketsRaw["90+"]),
  };
}

function mapOperationalAgingBuckets(
  raw: unknown,
): Record<OperationalAgingBucket, AgingBucketTotals> {
  const bucketsRaw = (raw ?? {}) as Record<string, unknown>;
  return {
    ...mapAgingBucketsRecord(bucketsRaw),
    upcoming: mapAgingBucketTotals(bucketsRaw.upcoming),
  };
}

/** Normaliza `dso_30d` número legacy u objeto F0b. */
export function mapDso30d(raw: unknown): DsoByChannel {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return { invoiced: raw, operational: null, blended: raw };
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const pick = (key: string): number | null => {
      const v = obj[key];
      if (v == null) return null;
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string") {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    };
    return {
      invoiced: pick("invoiced"),
      operational: pick("operational"),
      blended: pick("blended"),
    };
  }
  return { invoiced: null, operational: null, blended: null };
}

export function mapFinanceSummary(raw: Record<string, unknown>): FinanceSummary {
  const status = (raw.invoices_by_status ?? {}) as Record<string, unknown>;
  const byChannelRaw = raw.by_channel as Record<string, unknown> | undefined;
  const byChannel =
    byChannelRaw && typeof byChannelRaw === "object"
      ? {
          withInvoice: mapChannelMoneySnapshot(
            byChannelRaw.with_invoice as Record<string, unknown> | undefined,
          ),
          withoutInvoice: mapChannelMoneySnapshot(
            byChannelRaw.without_invoice as Record<string, unknown> | undefined,
          ),
        }
      : undefined;
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
    byChannel,
  };
}

export function mapAccountStatementItem(
  raw: Record<string, unknown>,
): AccountStatementItem {
  const clientIdRaw = raw.client_id;
  return {
    clientId:
      typeof clientIdRaw === "string" && clientIdRaw.trim()
        ? clientIdRaw
        : null,
    clientRfc: asString(raw.client_rfc),
    clientName: asString(raw.client_name),
    totalInvoiced: asNumber(raw.total_invoiced),
    totalPaid: asNumber(raw.total_paid),
    balanceDue: asNumber(raw.balance_due),
    operationalBalance: asNumber(raw.operational_balance),
    invoiceCount: asNumber(raw.invoice_count),
    openInvoiceCount: asNumber(raw.open_invoice_count),
    // API anterior a la Enmienda EC: solo manda el conteo PPD.
    invoicesWithBalanceCount: asNumber(
      raw.invoices_with_balance_count ?? raw.open_invoice_count,
    ),
    operationalTripCount: asNumber(raw.operational_trip_count),
    overdueAmount: asNumber(raw.overdue_amount),
    lastCollectionAt: asNullableString(raw.last_collection_at),
    lastCollectionChannel: mapCollectionChannel(raw.last_collection_channel),
  };
}

const GENERATED_ON_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function mapPendingRelationCount(
  raw: Record<string, unknown>,
): PendingRelationCount {
  const generatedOn = asString(raw.generated_on);
  return {
    invoiceCount: asNumber(raw.invoice_count),
    generatedOn: GENERATED_ON_DATE.test(generatedOn) ? generatedOn : "",
  };
}

function mapNullableProfitabilityStatus(
  value: unknown,
): ProfitabilityStatus | null {
  if (value == null || value === "") return null;
  return asString(value) as ProfitabilityStatus;
}

function mapProfitabilityTripItem(
  raw: Record<string, unknown>,
): ProfitabilityTripItem {
  const grossMarginPct = raw.gross_margin_pct;
  const grossMargin = raw.gross_margin;
  const operationalMargin = raw.operational_margin;
  const operationalMarginPct = raw.operational_margin_pct;
  const hasOperational =
    raw.operational_cost != null || raw.trip_commission_total != null;
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
    profitabilityStatus: mapNullableProfitabilityStatus(
      raw.profitability_status,
    ),
    tripCommissionTotal:
      raw.trip_commission_total == null
        ? undefined
        : asNumber(raw.trip_commission_total),
    operationalCost: hasOperational
      ? asNumber(raw.operational_cost)
      : undefined,
    operationalMargin:
      operationalMargin == null && !hasOperational
        ? undefined
        : operationalMargin == null
          ? null
          : asNumber(operationalMargin),
    operationalMarginPct:
      operationalMarginPct == null && !hasOperational
        ? undefined
        : operationalMarginPct == null
          ? null
          : asNumber(operationalMarginPct),
    operationalProfitabilityStatus: hasOperational
      ? mapNullableProfitabilityStatus(raw.operational_profitability_status)
      : undefined,
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
    snapshotRefreshedAt:
      asNullableString(raw.snapshot_refreshed_at) ?? undefined,
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
  const meta = (raw.meta ?? {}) as Record<string, unknown>;
  const marginBasis = parseMarginBasis(meta.margin_basis);
  const hasOperationalAgg = aggregates.total_operational_cost != null;

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
      totalTripCommission:
        aggregates.total_trip_commission == null
          ? undefined
          : asNumber(aggregates.total_trip_commission),
      totalOperationalCost: hasOperationalAgg
        ? asNumber(aggregates.total_operational_cost)
        : undefined,
      blendedOperationalMargin:
        aggregates.blended_operational_margin == null && !hasOperationalAgg
          ? undefined
          : asNumber(aggregates.blended_operational_margin),
      blendedOperationalMarginPct:
        aggregates.blended_operational_margin_pct == null && !hasOperationalAgg
          ? undefined
          : aggregates.blended_operational_margin_pct == null
            ? null
            : asNumber(aggregates.blended_operational_margin_pct),
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
    marginBasis,
  };
}

export function mapProfitabilityAggregateItem(
  raw: Record<string, unknown>,
): ProfitabilityAggregateItem {
  const blendedMarginPct = raw.blended_margin_pct;
  const hasOperational = raw.total_operational_cost != null;
  return {
    key: asString(raw.key),
    label: asString(raw.label),
    tripCount: asNumber(raw.trip_count),
    totalRevenue: asNumber(raw.total_revenue),
    totalActual: asNumber(raw.total_actual),
    blendedMargin: asNumber(raw.blended_margin),
    blendedMarginPct:
      blendedMarginPct == null ? null : asNumber(blendedMarginPct),
    totalTripCommission:
      raw.total_trip_commission == null
        ? undefined
        : asNumber(raw.total_trip_commission),
    totalOperationalCost: hasOperational
      ? asNumber(raw.total_operational_cost)
      : undefined,
    blendedOperationalMargin:
      raw.blended_operational_margin == null && !hasOperational
        ? undefined
        : asNumber(raw.blended_operational_margin),
    blendedOperationalMarginPct:
      raw.blended_operational_margin_pct == null && !hasOperational
        ? undefined
        : raw.blended_operational_margin_pct == null
          ? null
          : asNumber(raw.blended_operational_margin_pct),
  };
}

export function mapAgingSummary(raw: Record<string, unknown>): AgingSummary {
  const byChannelRaw = raw.by_channel as Record<string, unknown> | undefined;
  let byChannel: AgingSummary["byChannel"];
  if (byChannelRaw && typeof byChannelRaw === "object") {
    const withInvoice = (byChannelRaw.with_invoice ?? {}) as Record<
      string,
      unknown
    >;
    const withoutInvoice = (byChannelRaw.without_invoice ?? {}) as Record<
      string,
      unknown
    >;
    byChannel = {
      withInvoice: {
        totalReceivable: asNumber(withInvoice.total_receivable),
        buckets: mapAgingBucketsRecord(withInvoice.buckets),
      },
      withoutInvoice: {
        totalReceivable: asNumber(withoutInvoice.total_receivable),
        buckets: mapOperationalAgingBuckets(withoutInvoice.buckets),
      },
    };
  }

  return {
    totalReceivable: asNumber(raw.total_receivable),
    dso30d: mapDso30d(raw.dso_30d),
    buckets: mapAgingBucketsRecord(raw.buckets),
    byChannel,
  };
}

export function mapAgingByClientItem(
  raw: Record<string, unknown>,
): AgingByClientItem {
  const upcoming = raw.bucket_upcoming;
  return {
    clientRfc: asString(raw.client_rfc),
    clientName: asString(raw.client_name),
    totalBalance: asNumber(raw.total_balance),
    invoiceCount: asNumber(raw.invoice_count),
    operationalTripCount:
      raw.operational_trip_count == null
        ? undefined
        : asNumber(raw.operational_trip_count),
    bucket030: asNumber(raw.bucket_0_30),
    bucket3160: asNumber(raw.bucket_31_60),
    bucket6190: asNumber(raw.bucket_61_90),
    bucket90Plus: asNumber(raw.bucket_90_plus),
    bucketUpcoming: upcoming == null ? undefined : asNumber(upcoming),
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

export function mapPeriodFinancials(raw: Record<string, unknown>): PeriodFinancials {
  const hasOperational = raw.operational_cost != null;
  return {
    period: asString(raw.period),
    actualRevenue: asNumber(raw.actual_revenue),
    actualCost: asNumber(raw.actual_cost),
    actualMargin: asNumber(raw.actual_margin),
    operationalCost: hasOperational ? asNumber(raw.operational_cost) : undefined,
    operationalMargin:
      raw.operational_margin == null && !hasOperational
        ? undefined
        : asNumber(raw.operational_margin),
    tripExpensesCost:
      raw.trip_expenses_cost == null ? undefined : asNumber(raw.trip_expenses_cost),
    tripCommissionCost:
      raw.trip_commission_cost == null
        ? undefined
        : asNumber(raw.trip_commission_cost),
    periodPersonnelCost:
      raw.period_personnel_cost == null
        ? undefined
        : asNumber(raw.period_personnel_cost),
    tripCount: asNumber(raw.trip_count),
    incompleteTripCount: asNumber(raw.incomplete_trip_count),
    tripsWithPendingExpenses: asNumber(raw.trips_with_pending_expenses),
    provisional: asBoolean(raw.provisional),
  };
}

function mapPeriodFinancialsList(raw: unknown): PeriodFinancials[] {
  return Array.isArray(raw)
    ? raw.map((item) => mapPeriodFinancials((item ?? {}) as Record<string, unknown>))
    : [];
}

export function mapMonthlyPerformance(
  raw: Record<string, unknown>,
): MonthlyPerformance {
  const meta = (raw.meta ?? {}) as Record<string, unknown>;
  return {
    periods: Array.isArray(raw.periods) ? raw.periods.map(asString) : [],
    current: mapPeriodFinancialsList(raw.current),
    previous: mapPeriodFinancialsList(raw.previous),
    marginBasis: parseMarginBasis(meta.margin_basis),
  };
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

function mapCollectionsWeekDay(
  raw: Record<string, unknown>,
): CollectionsWeekDay {
  return {
    date: asString(raw.date).slice(0, 10),
    withInvoice: asNumber(raw.with_invoice),
    withoutInvoice: asNumber(raw.without_invoice),
    total: asNumber(raw.total),
  };
}

/** GET /finance/collections-week → camelCase. */
export function mapCollectionsWeek(
  raw: Record<string, unknown>,
): CollectionsWeek {
  const daysRaw = Array.isArray(raw.days) ? raw.days : [];
  return {
    weekStart: asString(raw.week_start).slice(0, 10),
    weekEnd: asString(raw.week_end).slice(0, 10),
    days: daysRaw.map((item) =>
      mapCollectionsWeekDay((item ?? {}) as Record<string, unknown>),
    ),
  };
}
