import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@features/finance/infrastructure";
import type {
  ExpensesByCategoryFilters,
  ExpensesByDimensionFilters,
  FinanceInvoiceListFilters,
  IncomeByMonthFilters,
  InvoicesByStatusMonthFilters,
  ProfitabilityAggregateFilters,
  ProfitabilityTripsFilters,
} from "@features/finance/domain";

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
  repExceptions: (
    receiverRfc: string | null,
    page: number,
    limit: number,
  ) =>
    [...financeQueryKeys.all, "rep-exceptions", receiverRfc, page, limit] as const,
};

export const useFinanceSummary = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: financeQueryKeys.summary(),
    queryFn: () => financeApi.getFinanceSummary(),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });

export const useAccountStatement = (options?: {
  enabled?: boolean;
  clientRfc?: string;
}) =>
  useQuery({
    queryKey: financeQueryKeys.statement(),
    queryFn: async () => {
      const rows = await financeApi.getAccountStatement();
      if (!options?.clientRfc) return rows;
      return rows.filter((row) => row.clientRfc === options.clientRfc);
    },
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });

export const useAgingSummary = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: financeQueryKeys.agingSummary(),
    queryFn: () => financeApi.getAgingSummary(),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });

export const useAgingByClient = (options?: {
  enabled?: boolean;
  clientRfc?: string;
}) =>
  useQuery({
    queryKey: financeQueryKeys.agingByClient(options?.clientRfc),
    queryFn: () => financeApi.getAgingByClient(options?.clientRfc),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });

export const useAgingClientInvoices = (
  clientRfc: string,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: financeQueryKeys.agingClientInvoices(clientRfc),
    queryFn: () => financeApi.getAgingClientInvoices(clientRfc),
    enabled: (options?.enabled ?? true) && Boolean(clientRfc),
    staleTime: 60_000,
  });

export const useProfitabilityTrips = (
  filters: ProfitabilityTripsFilters,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: financeQueryKeys.profitabilityTrips(filters),
    queryFn: () => financeApi.getProfitabilityTrips(filters),
    enabled: options?.enabled ?? true,
    staleTime: 15_000,
  });

export const useProfitabilityAggregate = (
  filters: ProfitabilityAggregateFilters,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: financeQueryKeys.profitabilityAggregate(filters),
    queryFn: () => financeApi.getProfitabilityAggregate(filters),
    enabled: options?.enabled ?? true,
    staleTime: 15_000,
  });

export const useExpensesByCategory = (
  filters: ExpensesByCategoryFilters,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: financeQueryKeys.expensesByCategory(filters),
    queryFn: () => financeApi.getExpensesByCategory(filters),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });

export const useExpensesByDimension = (
  filters: ExpensesByDimensionFilters,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: financeQueryKeys.expensesByDimension(filters),
    queryFn: () => financeApi.getExpensesByDimension(filters),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });

export const useIncomeByMonth = (
  filters: IncomeByMonthFilters = { months: 12 },
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: financeQueryKeys.incomeByMonth(filters),
    queryFn: () => financeApi.getIncomeByMonth(filters),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });

export const useInvoicesByStatusMonth = (
  filters: InvoicesByStatusMonthFilters = { months: 12 },
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: financeQueryKeys.invoicesByStatusMonth(filters),
    queryFn: () => financeApi.getInvoicesByStatusMonth(filters),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
