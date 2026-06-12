import { useQuery } from "@tanstack/react-query";
import { financeInvoicesListApi } from "@features/finance/infrastructure/invoicesListApi";
import type { FinanceInvoiceListFilters } from "@features/finance/domain";
import { financeQueryKeys } from "./useFinance";

export const useFinanceInvoicesList = (filters?: FinanceInvoiceListFilters) =>
  useQuery({
    queryKey: financeQueryKeys.invoicesList(filters),
    queryFn: () => financeInvoicesListApi.getAll(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
