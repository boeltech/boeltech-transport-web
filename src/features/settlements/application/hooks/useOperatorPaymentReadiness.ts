import { useQuery } from "@tanstack/react-query";
import {
  settlementsApi,
  type ListOperatorsParams,
} from "../../infrastructure/settlementsApi";
import { settlementsQueryKeys } from "../settlementsQueryKeys";

export function useOperatorPaymentReadiness(
  params: ListOperatorsParams & { enabled?: boolean } = {},
) {
  const { enabled = true, ...queryParams } = params;
  return useQuery({
    queryKey: settlementsQueryKeys.operatorsList(queryParams),
    queryFn: () => settlementsApi.listOperators(queryParams),
    enabled,
  });
}
