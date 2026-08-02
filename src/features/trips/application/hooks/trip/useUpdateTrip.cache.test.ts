import { describe, expect, it, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import { tripQueryKeys, type Trip } from "@features/trips/domain";
import { mergeTripDetailAfterUpdate } from "./useUpdateTrip";

/**
 * Regresión: tras update estructural (wizard), el PUT plano no trae stops/cargos.
 * No conservar previous.stops vacíos/stale; invalidar detail marca cargos stale.
 */
describe("trip detail cache after update", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("does not keep previous stops/cargos when structural replace", () => {
    const previous = {
      id: "trip-1",
      tripCode: "T-001",
      stops: [],
      cargos: [],
      expenses: [],
    } as unknown as Trip;

    const updated = {
      id: "trip-1",
      tripCode: "T-001",
      notes: "actualizado",
    } as unknown as Trip;

    const merged = mergeTripDetailAfterUpdate(previous, updated, {
      structuralReplace: true,
    });

    expect(merged.notes).toBe("actualizado");
    expect(merged.stops).toBeUndefined();
    expect(merged.cargos).toBeUndefined();
    expect(merged.expenses).toBeUndefined();
  });

  it("keeps previous nested relations when update is non-structural", () => {
    const previous = {
      id: "trip-1",
      stops: [{ id: "s1", sequenceOrder: 0 }],
      cargos: [{ id: "c1" }],
    } as unknown as Trip;

    const updated = {
      id: "trip-1",
      notes: "solo notas",
    } as unknown as Trip;

    const merged = mergeTripDetailAfterUpdate(previous, updated, {
      structuralReplace: false,
    });

    expect(merged.stops).toEqual([{ id: "s1", sequenceOrder: 0 }]);
    expect(merged.cargos).toEqual([{ id: "c1" }]);
  });

  it("invalidateQueries on detail marks cargos key stale (prefix match)", async () => {
    const tripId = "trip-2";
    const detailKey = tripQueryKeys.detail(tripId);
    const cargosKey = tripQueryKeys.cargos(tripId);

    queryClient.setQueryData(detailKey, {
      id: tripId,
      stops: [],
    });
    queryClient.setQueryData(cargosKey, []);

    await queryClient.invalidateQueries({ queryKey: detailKey });

    expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(cargosKey)?.isInvalidated).toBe(true);
  });
});
