import type {
  ExpensesByCategoryFilters,
  ExpensesByDimensionFilters,
  FinanceInvoiceListFilters,
  IncomeByMonthFilters,
  InvoicesByStatusMonthFilters,
  ProfitabilityAggregateFilters,
  ProfitabilityTripsFilters,
} from "@features/finance/domain";

/**
 * Query keys de finance — contrato de invalidación (approvals hub + invoicing).
 */
export const financeQueryKeys = {
  all: ["finance"] as const,
  summary: () => [...financeQueryKeys.all, "summary"] as const,
  statement: () => [...financeQueryKeys.all, "statement"] as const,
  agingSummary: () => [...financeQueryKeys.all, "aging-summary"] as const,
  agingByClient: (clientRfc?: string) =>
    [...financeQueryKeys.all, "aging-by-client", clientRfc ?? "all"] as const,
  agingClientInvoices: (clientRfc: string) =>
    [...financeQueryKeys.all, "aging-client-invoices", clientRfc] as const,
  profitabilityTrips: (filters: ProfitabilityTripsFilters) =>
    [...financeQueryKeys.all, "profitability-trips", filters] as const,
  profitabilityAggregate: (filters: ProfitabilityAggregateFilters) =>
    [...financeQueryKeys.all, "profitability-aggregate", filters] as const,
  expensesByCategory: (filters: ExpensesByCategoryFilters) =>
    [...financeQueryKeys.all, "expenses-by-category", filters] as const,
  expensesByDimension: (filters: ExpensesByDimensionFilters) =>
    [...financeQueryKeys.all, "expenses-by-dimension", filters] as const,
  invoicesList: (filters?: FinanceInvoiceListFilters) =>
    [...financeQueryKeys.all, "invoices-list", filters] as const,
  incomeByMonth: (filters: IncomeByMonthFilters) =>
    [...financeQueryKeys.all, "income-by-month", filters] as const,
  invoicesByStatusMonth: (filters: InvoicesByStatusMonthFilters) =>
    [...financeQueryKeys.all, "invoices-by-status-month", filters] as const,
  monthlyPerformance: (months: number) =>
    [...financeQueryKeys.all, "monthly-performance", months] as const,
  /** Prefijo de invalidación del tab Excepciones REP (poll live). */
  repExceptionsRoot: () =>
    [...financeQueryKeys.all, "rep-exceptions"] as const,
  repExceptions: (
    receiverRfc: string | null,
    page: number,
    limit: number,
  ) =>
    [...financeQueryKeys.repExceptionsRoot(), receiverRfc, page, limit] as const,
  repStatusByIds: (idsKey: string) =>
    [...financeQueryKeys.all, "rep-status", idsKey] as const,
  openPpdInvoices: (filters: {
    receiverRfc: string | null;
    search: string | null;
    cobrosBucket: string | null;
    page: number;
    limit: number;
  }) => [...financeQueryKeys.all, "open-ppd", filters] as const,
  /** Prefijo de invalidación del KPI open-ppd-summary (poll live). */
  openPpdSummaryRoot: () =>
    [...financeQueryKeys.all, "open-ppd-summary"] as const,
  openPpdSummary: (receiverRfc: string | null, search: string | null) =>
    [...financeQueryKeys.openPpdSummaryRoot(), receiverRfc, search] as const,
};
