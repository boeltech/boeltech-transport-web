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

  it("preserves empty internalStaff when update clears the list", () => {
    const previous = {
      id: "trip-1",
      internalStaff: [
        {
          id: "s1",
          employeeId: "emp-1",
          employeeFullName: "Ayudante",
          internalRole: "helper",
          isPaymentResponsible: false,
        },
      ],
    } as unknown as Trip;

    const updated = {
      id: "trip-1",
      internalStaff: [],
    } as unknown as Trip;

    const merged = mergeTripDetailAfterUpdate(previous, updated);
    expect(merged.internalStaff).toEqual([]);
  });

  it("keeps previous trailers when PUT omits trailers", () => {
    const previous = {
      id: "trip-1",
      trailers: [
        {
          trailerId: "tr-1",
          position: 1,
          licensePlate: "REM-1",
          satSubTipoRemCode: "CTR001",
          snapshotAt: "2026-08-01T12:00:00.000Z",
        },
      ],
    } as unknown as Trip;

    const updated = {
      id: "trip-1",
      notes: "sin trailers en respuesta",
    } as unknown as Trip;

    const merged = mergeTripDetailAfterUpdate(previous, updated);
    expect(merged.trailers).toEqual(previous.trailers);
  });

  it("preserves empty trailers when update clears the list", () => {
    const previous = {
      id: "trip-1",
      trailers: [
        {
          trailerId: "tr-1",
          position: 1,
          licensePlate: "REM-1",
          satSubTipoRemCode: "CTR001",
          snapshotAt: "2026-08-01T12:00:00.000Z",
        },
      ],
    } as unknown as Trip;

    const updated = {
      id: "trip-1",
      trailers: [],
    } as unknown as Trip;

    const merged = mergeTripDetailAfterUpdate(previous, updated);
    expect(merged.trailers).toEqual([]);
  });

  it("drops previous vehicle when vehicleId changes without nested vehicle", () => {
    const previous = {
      id: "trip-1",
      vehicleId: "veh-old",
      vehicle: {
        id: "veh-old",
        unitNumber: "U-OLD",
        licensePlate: "OLD-111",
      },
    } as unknown as Trip;

    const updated = {
      id: "trip-1",
      vehicleId: "veh-new",
    } as unknown as Trip;

    const merged = mergeTripDetailAfterUpdate(previous, updated);
    expect(merged.vehicleId).toBe("veh-new");
    expect(merged.vehicle).toBeUndefined();
  });

  it("keeps previous vehicle when vehicleId unchanged and nested omitted", () => {
    const previous = {
      id: "trip-1",
      vehicleId: "veh-1",
      vehicle: {
        id: "veh-1",
        unitNumber: "U-1",
        licensePlate: "AAA-111",
      },
    } as unknown as Trip;

    const updated = {
      id: "trip-1",
      vehicleId: "veh-1",
      notes: "solo notas",
    } as unknown as Trip;

    const merged = mergeTripDetailAfterUpdate(previous, updated);
    expect(merged.vehicle).toEqual(previous.vehicle);
  });

  it("drops previous driver when driverId changes without nested driver", () => {
    const previous = {
      id: "trip-1",
      driverId: "drv-old",
      driver: { id: "drv-old", fullName: "Viejo" },
    } as unknown as Trip;

    const updated = {
      id: "trip-1",
      driverId: "drv-new",
    } as unknown as Trip;

    const merged = mergeTripDetailAfterUpdate(previous, updated);
    expect(merged.driverId).toBe("drv-new");
    expect(merged.driver).toBeUndefined();
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
