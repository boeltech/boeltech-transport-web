import type { QueryClient } from "@tanstack/react-query";

import {
  TripStatus,
  tripQueryKeys,
  type TripStatusType,
} from "@features/trips/domain";

function statusNeedsTrackingTimeline(
  status: TripStatusType | undefined,
): boolean {
  return (
    status === TripStatus.IN_PROGRESS || status === TripStatus.COMPLETED
  );
}

/**
 * Invalidación del surface del detalle de viaje tras mutaciones de lifecycle.
 * Purga timeline cacheado cuando el status ya no necesita contexto de tracking
 * (evita que data disabled envenene chrome/ruta).
 */
export async function invalidateTripDetailSurface(
  queryClient: QueryClient,
  tripId: string,
  opts?: { status?: TripStatusType },
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: tripQueryKeys.detail(tripId),
  });

  if (statusNeedsTrackingTimeline(opts?.status)) {
    await queryClient.invalidateQueries({
      queryKey: tripQueryKeys.timeline(tripId),
    });
  } else {
    await queryClient.removeQueries({
      queryKey: tripQueryKeys.timeline(tripId),
    });
  }

  await queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
}
