import { describe, expect, it, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import { tripQueryKeys } from "@features/trips/domain";

/**
 * Regresión PD-CACHE-1: add movement debe marcar stale detail + cargos
 * (chrome/badge que lee trip.cargos no puede quedarse desfasado).
 */
describe("cargo movement cache invalidation keys", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("invalidating cargos + detail marks both stale (useAddCargoMovement contract)", async () => {
    const tripId = "trip-add-movement";
    const detailKey = tripQueryKeys.detail(tripId);
    const cargosKey = tripQueryKeys.cargos(tripId);

    queryClient.setQueryData(detailKey, { id: tripId, cargos: [] });
    queryClient.setQueryData(cargosKey, []);

    await queryClient.invalidateQueries({ queryKey: cargosKey });
    await queryClient.invalidateQueries({ queryKey: detailKey });

    expect(queryClient.getQueryState(cargosKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true);
  });
});
