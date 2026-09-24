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
  FINANCE_DISPATCH_PATH,
  FINANCE_DISPATCH_PENDING_HREF,
  FINANCE_DISPATCH_HISTORY_HREF,
  FINANCE_DISPATCH_DETAIL_PATH,
} from "./application";

export { financeApi } from "./infrastructure";

export {
  FinanceSummaryPage,
  FinanceInvoicesPage,
  FinanceInvoiceablePage,
  FinanceCobrosPage,
  FinanceApprovalsPage,
  FinanceDispatchPage,
  FinanceDispatchRunsPage,
  FinanceAnalysisPage,
  ProfitabilityTab,
  ExpenseAnalysisTab,
  DispatchRunDetailPage,
} from "./presentation/pages";

export {
  FinanceSendInvoicesLegacyRedirect,
  FinanceDispatchRunsLegacyRedirect,
  FinanceDispatchRunDetailLegacyRedirect,
} from "./presentation/routes/FinanceDispatchLegacyRedirects";

export { FinanceIndexRoute } from "./presentation/routes/FinanceIndexRoute";
export { StaffFinanceRoute } from "./presentation/routes/StaffFinanceRoute";
