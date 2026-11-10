import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@shared/permissions";
import { settlementsApi } from "../../infrastructure/settlementsApi";
import { settlementsQueryKeys } from "../settlementsQueryKeys";

/** GET /settlements/nav-badges — badges sidebar Pagos / Anticipos (F4). */
export function useSettlementsNavBadges() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("settlements", "read");

  return useQuery({
    queryKey: settlementsQueryKeys.navBadges(),
    queryFn: () => settlementsApi.getNavBadges(),
    enabled: canRead,
    staleTime: 30_000,
  });
}
