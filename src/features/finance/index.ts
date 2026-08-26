export type {
  ProfitabilityStatus,
  ProfitabilityDimension,
  FinanceSummary,
  AccountStatementItem,
  ProfitabilityTripItem,
  ProfitabilityTripsResponse,
  ProfitabilityAggregateItem,
  AgingBucket,
  AgingSummary,
  AgingByClientItem,
  AgingClientInvoiceItem,
  ExpensesByCategory,
  ExpensesByDimensionItem,
  ProfitabilityTripsFilters,
  ProfitabilityAggregateFilters,
  ExpensesByCategoryFilters,
  ExpensesByDimensionFilters,
  FinanceRepExceptionItem,
  PaginatedFinanceRepExceptions,
} from "./domain";

export {
  financeQueryKeys,
  useFinanceSummary,
  useAccountStatement,
  useAgingSummary,
  useAgingByClient,
  useAgingClientInvoices,
  useProfitabilityTrips,
  useProfitabilityAggregate,
  useExpensesByCategory,
  useExpensesByDimension,
  useIncomeByMonth,
  useInvoicesByStatusMonth,
  getCurrentMonthExpenseRange,
  buildFinanceCobrosPath,
  buildFinanceAnalysisSearchParams,
  resolveLegacyFinanceLocation,
} from "./application";

export { financeApi } from "./infrastructure";

export {
  FinanceSummaryPage,
  FinanceInvoicesPage,
  FinanceInvoiceablePage,
  FinanceCobrosPage,
  FinanceApprovalsPage,
  FinanceDispatchRunsPage,
  FinanceAnalysisPage,
  ProfitabilityTab,
  ExpenseAnalysisTab,
  DispatchRunDetailPage,
} from "./presentation/pages";

export { FinanceIndexRoute } from "./presentation/routes/FinanceIndexRoute";
export { StaffFinanceRoute } from "./presentation/routes/StaffFinanceRoute";
