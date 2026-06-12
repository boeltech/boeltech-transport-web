import {
  useListingFilters,
  type UseListingFiltersOptions,
  type UseListingFiltersResult,
} from "@shared/hooks";
import { FINANCE_PRESERVED_URL_PARAMS } from "../financeListingFilters";

export function useFinanceListingFilters<TFilterKeys extends string = string>(
  options: Omit<UseListingFiltersOptions<TFilterKeys>, "preserveParamsOnClear">,
): UseListingFiltersResult<TFilterKeys> {
  return useListingFilters<TFilterKeys>({
    ...options,
    preserveParamsOnClear: [...FINANCE_PRESERVED_URL_PARAMS],
  });
}
