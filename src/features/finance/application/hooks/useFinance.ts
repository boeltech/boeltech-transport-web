import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { financeApi } from "@features/finance/infrastructure";
import type {
  ExpensesByCategoryFilters,
  ExpensesByDimensionFilters,
  IncomeByMonthFilters,
  InvoicesByStatusMonthFilters,
  ProfitabilityAggregateFilters,
  ProfitabilityTripsFilters,
} from "@features/finance/domain";
import { financeQueryKeys } from "../financeQueryKeys";

export { financeQueryKeys };

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

export const useMonthlyPerformance = (
  months: number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: financeQueryKeys.monthlyPerformance(months),
    queryFn: () => financeApi.getMonthlyPerformance(months),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
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
