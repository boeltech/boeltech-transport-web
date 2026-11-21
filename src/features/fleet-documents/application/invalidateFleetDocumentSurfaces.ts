import type { QueryClient } from "@tanstack/react-query";

import { invalidateDashboardLiveQueries } from "@features/dashboard/application/invalidateDashboardLiveQueries";
import { fleetDocumentsQueryKeys } from "@features/fleet-documents/domain";

/**
 * Documentos por vencer + Inicio tras mutaciones de flota (vigencias, estado, baja/reactivación).
 * H-U03-Q01 / ola 5 C1.
 */
export function invalidateFleetDocumentSurfaces(
  queryClient: QueryClient,
): void {
  void queryClient.invalidateQueries({
    queryKey: fleetDocumentsQueryKeys.all,
  });
  invalidateDashboardLiveQueries(queryClient);
}
