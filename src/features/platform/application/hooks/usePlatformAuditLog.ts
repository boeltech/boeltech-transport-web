import { useQuery } from "@tanstack/react-query";
import {
  platformQueryKeys,
  type PlatformAuditLogQueryParams,
} from "../../domain/entities";
import { platformApi } from "../../infrastructure/platformApi";

export function usePlatformAuditLog(params?: PlatformAuditLogQueryParams) {
  return useQuery({
    queryKey: platformQueryKeys.auditLogList(params),
    queryFn: () => platformApi.listAuditLog(params),
  });
}
