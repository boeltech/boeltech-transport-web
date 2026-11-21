import type { QueryClient } from "@tanstack/react-query";

import {
  invalidateFinanceAnalysisQueries,
  scheduleFinanceAnalysisRefresh,
} from "@features/approvals/application/invalidateApprovalsQueries";
import { invalidateDashboardLiveQueries } from "@features/dashboard/application/invalidateDashboardLiveQueries";
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
 * También refresca `/dashboard` (Viajes de hoy, viajes en ruta, alertas).
 */
export async function invalidateTripDetailSurface(
  queryClient: QueryClient,
  tripId: string,
  opts?: { status?: TripStatusType },
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: tripQueryKeys.detail(tripId),
  });

  // C7: split puede auto-cancelarse en la misma tx (cancel viaje) o quedar
  // active con RFA; la query anidada debe refrescarse de forma explícita.
  await queryClient.invalidateQueries({
    queryKey: tripQueryKeys.revenueSplit(tripId),
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

  // Inicio (Viajes de hoy) + Por facturar — resúmenes hermanos del detalle.
  await queryClient.invalidateQueries({
    queryKey: tripQueryKeys.opsDaySummary(),
    refetchType: "active",
  });
  await queryClient.invalidateQueries({
    queryKey: [...tripQueryKeys.all, "invoiceable-summary"],
    refetchType: "active",
  });

  invalidateDashboardLiveQueries(queryClient);

  // Q03: cierre / cancelación → Análisis inmediato + reinvalidación MV ~70 s.
  if (
    opts?.status === TripStatus.COMPLETED ||
    opts?.status === TripStatus.CANCELLED
  ) {
    invalidateFinanceAnalysisQueries(queryClient);
    scheduleFinanceAnalysisRefresh(queryClient);
  }
}
