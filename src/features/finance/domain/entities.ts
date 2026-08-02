import type { FinancialBucket, TripFinancialScope } from "@boeltech/cfdi-domain";

export type ProfitabilityStatus =
  | "high"
  | "medium"
  | "low"
  | "breakeven"
  | "loss";

export type {
  TripFinancialScope as ProfitabilityScope,
  FinancialBucket,
} from "@boeltech/cfdi-domain";

export type ProfitabilityDimension =
  | "client"
  | "vehicle"
  | "driver"
  | "route"
  | "month";

export interface FinanceSummary {
  totalReceivable: number;
  collectedThisMonth: number;
  totalOverdue: number;
  expensesThisMonth: number;
  invoicesByStatus: {
    draft: number;
    stamped: number;
    cancellationPending: number;
    cancelled: number;
  };
}

export interface AccountStatementItem {
  clientRfc: string;
  clientName: string;
  totalInvoiced: number;
  totalPaid: number;
  balanceDue: number;
  invoiceCount: number;
  overdueAmount: number;
}

export type ProfitabilityRevenueSource = "trip_base_rate" | "invoice_subtotal";

export interface ProfitabilityTripItem {
  tripId: string;
  tripCode: string;
  clientName: string | null;
  vehicleId: string;
  driverId: string;
  originCity: string;
  destinationCity: string;
  scheduledDeparture: string;
  revenue: number;
  actualTotal: number;
  grossMargin: number | null;
  grossMarginPct: number | null;
  profitabilityStatus: ProfitabilityStatus | null;
  hasPendingExpenses: boolean;
  tripStatus?: string;
  financialBucket?: FinancialBucket;
  projectedRevenue?: number;
  recognizedRevenue?: number;
  revenueSource?: ProfitabilityRevenueSource | null;
  cancelledInvoiceRevenue?: number;
}

export interface ProfitabilityTripsResponse {
  data: ProfitabilityTripItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  aggregates: {
    totalRevenue: number;
    totalActual: number;
    blendedMargin: number;
    blendedMarginPct: number | null;
    totalProjectedRevenue: number;
    totalCancellationLoss: number;
    totalCancelledInvoiceRevenue: number;
    byProfitabilityStatus: Record<ProfitabilityStatus, number>;
  };
}

export interface ProfitabilityAggregateItem {
  key: string;
  label: string;
  tripCount: number;
  totalRevenue: number;
  totalActual: number;
  blendedMargin: number;
  blendedMarginPct: number | null;
}

export type AgingBucket = "0-30" | "31-60" | "61-90" | "90+";

export interface AgingSummary {
  totalReceivable: number;
  dso30d: number;
  buckets: Record<AgingBucket, { invoiceCount: number; totalBalance: number }>;
}

export interface AgingByClientItem {
  clientRfc: string;
  clientName: string;
  totalBalance: number;
  invoiceCount: number;
  bucket030: number;
  bucket3160: number;
  bucket6190: number;
  bucket90Plus: number;
}

export interface AgingClientInvoiceItem {
  invoiceId: string;
  receiverRfc: string;
  receiverName: string;
  total: number;
  balanceDue: number;
  issuedDate: string;
  dueDate: string;
  agingBucket: AgingBucket;
}

export interface ExpensesByCategory {
  periods: string[];
  series: Record<string, number[]>;
  total: number[];
}

export interface ExpensesByDimensionItem {
  key: string;
  label: string;
  tripCount: number;
  totalExpenses: number;
  avgExpensePerTrip: number;
}

export interface ProfitabilityTripsFilters {
  from?: string;
  to?: string;
  clientId?: string;
  vehicleId?: string;
  driverId?: string;
  origin?: string;
  destination?: string;
  profitabilityStatus?: ProfitabilityStatus[];
  sortBy?: "scheduledDeparture" | "revenue" | "actualTotal" | "grossMarginPct";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  scope?: TripFinancialScope;
}

export interface ProfitabilityAggregateFilters {
  dimension: ProfitabilityDimension;
  from?: string;
  to?: string;
  sortBy?:
    | "tripCount"
    | "totalRevenue"
    | "totalActual"
    | "blendedMargin"
    | "blendedMarginPct";
  sortOrder?: "asc" | "desc";
  scope?: TripFinancialScope;
}

export interface ExpensesByCategoryFilters {
  from?: string;
  to?: string;
  granularity?: "day" | "week" | "month";
  vehicleId?: string;
  driverId?: string;
}

export interface ExpensesByDimensionFilters {
  dimension: "vehicle" | "driver" | "client" | "route";
  from?: string;
  to?: string;
  category?: string;
  vehicleId?: string;
  sortBy?: "total" | "tripCount" | "avgExpensePerTrip";
  sortOrder?: "asc" | "desc";
}

export type FinanceInvoiceStatus =
  | "draft"
  | "stamped"
  | "cancellation_pending"
  | "cancelled";

export interface FinanceInvoiceListItem {
  readonly id: string;
  readonly serie: string;
  readonly folio: number;
  readonly receiverRfc: string;
  readonly receiverName: string;
  readonly issuedAt: string;
  readonly paymentMethod: string;
  readonly total: number;
  readonly balanceDue: number;
  readonly tripCodes: string[];
  readonly status: FinanceInvoiceStatus;
}

export interface FinanceInvoicePagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface PaginatedFinanceInvoices {
  readonly data: FinanceInvoiceListItem[];
  readonly pagination: FinanceInvoicePagination;
}

export interface FinancePayment {
  readonly id: string;
  readonly invoiceId: string;
  readonly amount: number;
  readonly currency: string;
  readonly exchangeRate: number;
  readonly amountMxn: number;
  readonly paymentDate: string;
  readonly paymentTime: string;
  readonly paymentForm: string;
  readonly paymentFormName: string | null;
  readonly reference: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly createdByName: string | null;
  readonly repCfdiUuid: string | null;
  readonly repStampedAt: string | null;
  readonly repStatus: string;
  readonly repAttempts: number;
  readonly repLastError: string | null;
  readonly hasRepXml: boolean;
  readonly repNumParcialidad: number | null;
  readonly repImpSaldoAnt: number | null;
  readonly repImpSaldoInsoluto: number | null;
  readonly repImpPagado: number | null;
}

export interface FinanceInvoiceListFilters {
  status?: FinanceInvoiceStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IncomeByMonth {
  periods: string[];
  collected: number[];
}

export interface InvoicesByStatusMonth {
  periods: string[];
  series: {
    draft: number[];
    stamped: number[];
    cancellationPending: number[];
    cancelled: number[];
  };
}

export interface IncomeByMonthFilters {
  months?: number;
}

export interface InvoicesByStatusMonthFilters {
  months?: number;
}
