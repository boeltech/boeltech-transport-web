import {
  useListingFilters,
  type UseListingFiltersOptions,
  type UseListingFiltersResult,
} from "@shared/hooks";
import { FINANCE_PRESERVED_URL_PARAMS } from "../financeListingFilters";

/** `preserveParamsOnClear` se suma a los params de Finanzas que siempre se conservan. */
export function useFinanceListingFilters<TFilterKeys extends string = string>(
  options: UseListingFiltersOptions<TFilterKeys>,
): UseListingFiltersResult<TFilterKeys> {
  return useListingFilters<TFilterKeys>({
    ...options,
    preserveParamsOnClear: [
      ...FINANCE_PRESERVED_URL_PARAMS,
      ...(options.preserveParamsOnClear ?? []),
    ],
  });
}
