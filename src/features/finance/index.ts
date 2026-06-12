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
} from "./application";

export { financeApi } from "./infrastructure";

export {
  FinancePage,
  FinanceSummaryTab,
  FinanceInvoicesTab,
  ProfitabilityTab,
  ExpenseAnalysisTab,
  ReportsTab,
} from "./presentation/pages";
