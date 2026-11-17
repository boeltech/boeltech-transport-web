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
  CollectionsWeek,
  CollectionsWeekDay,
} from "./domain";

export {
  financeQueryKeys,
  useFinanceSummary,
  useCollectionsWeek,
  useAccountStatement,
  useAgingSummary,
  useAgingByClient,
  useAgingClientInvoices,
  useDownloadAccountStatementPdf,
  useProfitabilityTrips,
  useProfitabilityAggregate,
  useExpensesByCategory,
  useExpensesByDimension,
  useIncomeByMonth,
  useInvoicesByStatusMonth,
  getCurrentMonthExpenseRange,
  buildFinanceCobrosPath,
  buildFinanceCobrosDayPath,
  FINANCE_COBROS_DATE_PARAM,
  buildFinanceAnalysisSearchParams,
  resolveLegacyFinanceLocation,
  FINANCE_DISPATCH_PATH,
  FINANCE_DISPATCH_PENDING_HREF,
  FINANCE_DISPATCH_HISTORY_HREF,
  FINANCE_DISPATCH_PERIOD_PATH,
  FINANCE_DISPATCH_DETAIL_PATH,
} from "./application";

export {
  financeApi,
  buildAccountStatementPdfFileName,
} from "./infrastructure";

export {
  FinanceSummaryPage,
  FinanceInvoicesPage,
  FinanceInvoiceablePage,
  FinanceCobrosPage,
  FinanceEfectivoPorCobrarPage,
  OperationalReceiptBatchCreatePage,
  RegisterCollectionPage,
  FinanceApprovalsPage,
  FinanceDispatchPage,
  FinanceDispatchPeriodPage,
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

export {
  FinanceCobrosLegacyRedirect,
  FinanceEfectivoPorCobrarLegacyRedirect,
} from "./presentation/routes/FinancePathLegacyRedirects";

export { CollectionRegisterPermissionRoute } from "./presentation/routes/CollectionRegisterPermissionRoute";

export { FinanceIndexRoute } from "./presentation/routes/FinanceIndexRoute";
export { StaffFinanceRoute } from "./presentation/routes/StaffFinanceRoute";
