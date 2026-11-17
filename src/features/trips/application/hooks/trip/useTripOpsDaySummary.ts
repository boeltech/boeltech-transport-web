import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@shared/permissions";
import { tripQueryKeys } from "@features/trips/domain";
import { tripRepository } from "@features/trips/infrastructure";

const STALE_TIME = 30_000;

export function useTripOpsDaySummary(options?: { enabled?: boolean }) {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("trips", "read");

  return useQuery({
    queryKey: tripQueryKeys.opsDaySummary(),
    queryFn: () => tripRepository.getOpsDaySummary(),
    enabled: canRead && (options?.enabled ?? true),
    staleTime: STALE_TIME,
  });
}
