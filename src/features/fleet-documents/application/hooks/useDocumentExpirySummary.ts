import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@shared/permissions";
import { fleetDocumentsApi } from "../../infrastructure";
import { fleetDocumentsQueryKeys } from "../../domain";

export function useDocumentExpirySummary(options?: { enabled?: boolean }) {
  const { hasPermission } = usePermissions();
  const canRead =
    hasPermission("vehicles", "read") || hasPermission("drivers", "read");

  return useQuery({
    queryKey: fleetDocumentsQueryKeys.summary(),
    queryFn: () => fleetDocumentsApi.getSummary(),
    enabled: canRead && (options?.enabled ?? true),
    staleTime: 60_000,
  });
}
