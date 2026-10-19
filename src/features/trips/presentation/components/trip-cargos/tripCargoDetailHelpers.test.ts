import { describe, expect, it } from "vitest";

import type {
  CreateCargoInput,
  TripCargo,
  TripStop,
} from "@features/trips/domain";

import {
  attachStopIdsToCreateCargoMovements,
  canShowAddDeliveryInCargoEdit,
  countUnloadStops,
  formatCargoRouteLine,
  getCargoPlanningStops,
  isCargoPlanningGapMuted,
  isUnloadStopForCargo,
  listUnloadStops,
  resolveCargoMutationErrorMessage,
  resolveCargoRemoveErrorToast,
  resolveMissingDeliveryAlert,
} from "./tripCargoDetailHelpers";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.cargo;

function stop(
  id: string,
  sequenceOrder: number,
  locationName?: string,
  stopType: TripStop["stopType"] = ["pickup"],
): TripStop {
  return {
    id,
    stopType,
    address: "Calle",
    city: "Monterrey",
    locationName,
    sequenceOrder,
  } as TripStop;
}

function cargoWithMovements(
  movements: CreateCargoInput["movements"],
): CreateCargoInput {
  return {
    clientId: "client-1",
    description: "Harina",
    movements,
  };
}

describe("attachStopIdsToCreateCargoMovements", () => {
  it("attaches stopId from orderedStops by stopIndex", () => {
    const orderedStops = [stop("st-1", 0), stop("st-2", 1)];
    const result = attachStopIdsToCreateCargoMovements(
      cargoWithMovements([
        { stopIndex: 0, movementType: "pickup" },
        { stopIndex: 1, movementType: "delivery", weight: 10, units: 1 },
      ]),
      orderedStops,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cargo.movements).toEqual([
      { stopIndex: 0, movementType: "pickup", stopId: "st-1" },
      {
        stopIndex: 1,
        movementType: "delivery",
        weight: 10,
        units: 1,
        stopId: "st-2",
      },
    ]);
  });

  it("returns unresolved indexes when stopIndex is out of range", () => {
    const result = attachStopIdsToCreateCargoMovements(
      cargoWithMovements([{ stopIndex: 5, movementType: "pickup" }]),
      [stop("st-1", 0)],
    );

    expect(result).toEqual({
      ok: false,
      unresolvedStopIndexes: [5],
    });
  });

  it("passes through cargo without movements", () => {
    const cargo = cargoWithMovements(undefined);
    const result = attachStopIdsToCreateCargoMovements(cargo, [
      stop("st-1", 0),
    ]);

    expect(result).toEqual({ ok: true, cargo });
  });
});

describe("getCargoPlanningStops / formatCargoRouteLine", () => {
  it("builds pickup → delivery labels from movements", () => {
    const orderedStops = [
      stop("st-1", 0, "Bodega"),
      stop("st-2", 1, "Cliente"),
    ];
    const cargo = {
      id: "c1",
      description: "Harina",
      movements: [
        { stopIndex: 0, movementType: "pickup", stopId: "st-1" },
        { stopIndex: 1, movementType: "delivery", stopId: "st-2" },
      ],
    } as TripCargo;

    const planning = getCargoPlanningStops(cargo, orderedStops);
    expect(planning.pickupLabel).toContain("Bodega");
    expect(planning.deliveryLabels[0]).toContain("Cliente");
    expect(formatCargoRouteLine(cargo, orderedStops)).toContain("→");
  });

  it("uses missing labels when movements are absent", () => {
    const cargo = {
      id: "c1",
      description: "Harina",
      movements: [],
    } as unknown as TripCargo;

    expect(formatCargoRouteLine(cargo, [])).toBe(
      copy.format.routeSummary(
        copy.state.missingPickup,
        copy.state.missingDelivery,
      ),
    );
  });
});

describe("isCargoPlanningGapMuted", () => {
  it("mutes planning gaps for terminal cargo statuses", () => {
    expect(isCargoPlanningGapMuted("delivered")).toBe(true);
    expect(isCargoPlanningGapMuted("returned")).toBe(true);
    expect(isCargoPlanningGapMuted("cancelled")).toBe(true);
    expect(isCargoPlanningGapMuted("pending")).toBe(false);
    expect(isCargoPlanningGapMuted("in_transit")).toBe(false);
  });
});

describe("unload stop helpers (F3 CTA gate)", () => {
  it("treats delivery and destination as unload", () => {
    expect(isUnloadStopForCargo({ stopType: ["delivery"] })).toBe(true);
    expect(isUnloadStopForCargo({ stopType: ["destination"] })).toBe(true);
    expect(
      isUnloadStopForCargo({ stopType: ["waypoint", "delivery"] }),
    ).toBe(true);
    expect(isUnloadStopForCargo({ stopType: ["pickup"] })).toBe(false);
    expect(isUnloadStopForCargo({ stopType: ["origin"] })).toBe(false);
  });

  it("counts unload stops and gates add-delivery CTA at ≥2", () => {
    const oneUnload = [
      stop("o", 0, "Origen", ["origin", "pickup"]),
      stop("d", 1, "Destino", ["destination"]),
    ];
    expect(countUnloadStops(oneUnload)).toBe(1);
    expect(listUnloadStops(oneUnload)).toHaveLength(1);
    expect(canShowAddDeliveryInCargoEdit(oneUnload)).toBe(false);

    const twoUnload = [
      ...oneUnload,
      stop("w", 2, "Escala entrega", ["waypoint", "delivery"]),
    ];
    // destination + delivery waypoint
    expect(countUnloadStops(twoUnload)).toBe(2);
    expect(canShowAddDeliveryInCargoEdit(twoUnload)).toBe(true);
  });
});

describe("resolveCargoRemoveErrorToast (F4)", () => {
  it("uses forbidden copy without description for 403", () => {
    expect(
      resolveCargoRemoveErrorToast({
        code: "FORBIDDEN",
        message: "Forbidden",
      }),
    ).toEqual({ title: copy.toast.cargoRemoveForbidden });
  });

  it("uses network copy for connection errors", () => {
    expect(
      resolveCargoRemoveErrorToast({ code: "NETWORK_ERROR" }),
    ).toEqual({ title: copy.toast.cargoRemoveNetworkError });
    expect(resolveCargoRemoveErrorToast({ code: "TIMEOUT" }).title).toBe(
      copy.toast.cargoRemoveNetworkError,
    );
  });

  it("falls back to generic title with message", () => {
    expect(
      resolveCargoRemoveErrorToast({
        code: "INTERNAL_ERROR",
        message: "detalle",
      }),
    ).toEqual({
      title: copy.toast.cargoRemoveError,
      description: "detalle",
    });
  });
});

describe("resolveCargoMutationErrorMessage (F4)", () => {
  it("maps CARGO_STOP_NOT_OPERABLE to usable Spanish copy", () => {
    expect(
      resolveCargoMutationErrorMessage(
        { code: "CARGO_STOP_NOT_OPERABLE", message: "tech" },
        "fallback",
      ),
    ).toBe(copy.toast.cargoStopNotOperable);
  });

  it("keeps Error.message for other failures", () => {
    expect(
      resolveCargoMutationErrorMessage(new Error("otra cosa"), "fallback"),
    ).toBe("otra cosa");
    expect(resolveCargoMutationErrorMessage(null, "fallback")).toBe(
      "fallback",
    );
  });
});

describe("resolveMissingDeliveryAlert (F4/F5)", () => {
  it("offers edit when ≥2 unload (CTA Agregar entrega applies)", () => {
    expect(
      resolveMissingDeliveryAlert({
        count: 1,
        canAddDeliveryInEdit: true,
        canEditStructural: true,
        canAppendCargo: true,
        hasGoToRoute: true,
      }),
    ).toEqual({
      body: copy.alert.noDeliveryBody(1),
      showEditAction: true,
      showAddCargoAction: false,
      showGoToRouteAction: false,
    });
  });

  it("does not sell edit with 1 unload residual; offers add cargo / route", () => {
    expect(
      resolveMissingDeliveryAlert({
        count: 2,
        canAddDeliveryInEdit: false,
        canEditStructural: true,
        canAppendCargo: true,
        hasGoToRoute: true,
      }),
    ).toEqual({
      body: copy.alert.noDeliveryBodySingleUnload(2),
      showEditAction: false,
      showAddCargoAction: true,
      showGoToRouteAction: true,
    });
    expect(copy.alert.noDeliveryBodySingleUnload(1)).toMatch(/sistema/i);
    expect(copy.alert.noDeliveryBodySingleUnload(1)).not.toMatch(/asígn/i);
  });
});
