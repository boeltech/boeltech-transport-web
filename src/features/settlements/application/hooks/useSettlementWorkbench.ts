import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@shared/permissions";
import {
  settlementsApi,
  type ListWorkbenchParams,
} from "../../infrastructure/settlementsApi";
import { settlementsQueryKeys } from "../settlementsQueryKeys";

export function useSettlementWorkbench(params: ListWorkbenchParams = {}) {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("settlements", "read");

  return useQuery({
    queryKey: settlementsQueryKeys.workbenchList(params),
    queryFn: () => settlementsApi.getWorkbench(params),
    enabled: canRead,
    staleTime: 60_000,
    retry: false,
  });
}
