import type { QueryClient } from "@tanstack/react-query";

import {
  invalidateFinanceAnalysisQueries,
  scheduleFinanceAnalysisRefresh,
} from "@features/finance/application/invalidateFinanceAnalysisQueries";
import { clientQueryKeys } from "@features/clients/domain";
import { invalidateDashboardLiveQueries } from "@features/dashboard/application/invalidateDashboardLiveQueries";
import { driverQueryKeys } from "@features/drivers/domain";
import {
  TripStatus,
  tripQueryKeys,
  type Trip,
  type TripStatusType,
} from "@features/trips/domain";

function statusNeedsTrackingTimeline(
  status: TripStatusType | undefined,
): boolean {
  return (
    status === TripStatus.IN_PROGRESS || status === TripStatus.COMPLETED
  );
}

function collectKnownIds(
  ...values: Array<string | null | undefined>
): string[] {
  const unique = new Set<string>();
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) {
      unique.add(value);
    }
  }
  return [...unique];
}

function invalidateDriverTripSurfaces(
  queryClient: QueryClient,
  driverIds: string[],
): void {
  for (const driverId of driverIds) {
    void queryClient.invalidateQueries({
      queryKey: driverQueryKeys.trips(driverId),
    });
    void queryClient.invalidateQueries({
      queryKey: driverQueryKeys.stats(driverId),
    });
  }
}

function invalidateClientDetailSurfaces(
  queryClient: QueryClient,
  clientIds: string[],
): void {
  for (const clientId of clientIds) {
    void queryClient.invalidateQueries({
      queryKey: clientQueryKeys.detail(clientId),
      refetchType: "active",
    });
  }
}

export type InvalidateTripDetailSurfaceOpts = {
  status?: TripStatusType;
  /** Operador actual / entrante cuando el caller lo conoce. */
  driverId?: string | null;
  /** Operador saliente (reasignación / cambio en PUT). */
  previousDriverId?: string | null;
  /** Cliente actual del viaje. */
  clientId?: string | null;
  /** Cliente anterior si cambió en la mutación. */
  previousClientId?: string | null;
};

/**
 * Invalidación del surface del detalle de viaje tras mutaciones de lifecycle.
 * Purga timeline cacheado cuando el status ya no necesita contexto de tracking
 * (evita que data disabled envenene chrome/ruta).
 * También refresca `/dashboard` (Viajes de hoy, viajes en ruta, alertas),
 * viajes/stats del operador (H-U03-Q03) y ficha cliente (H-U04-Q02).
 */
export async function invalidateTripDetailSurface(
  queryClient: QueryClient,
  tripId: string,
  opts?: InvalidateTripDetailSurfaceOpts,
): Promise<void> {
  const cached = queryClient.getQueryData<Trip>(tripQueryKeys.detail(tripId));

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

  invalidateDriverTripSurfaces(
    queryClient,
    collectKnownIds(
      opts?.driverId,
      opts?.previousDriverId,
      cached?.driverId,
      cached?.driver?.id,
    ),
  );

  invalidateClientDetailSurfaces(
    queryClient,
    collectKnownIds(
      opts?.clientId,
      opts?.previousClientId,
      cached?.clientId,
      cached?.client?.id,
    ),
  );

  // Q03: cierre / cancelación → Análisis inmediato + reinvalidación MV ~70 s.
  if (
    opts?.status === TripStatus.COMPLETED ||
    opts?.status === TripStatus.CANCELLED
  ) {
    invalidateFinanceAnalysisQueries(queryClient);
    scheduleFinanceAnalysisRefresh(queryClient);
  }
}
