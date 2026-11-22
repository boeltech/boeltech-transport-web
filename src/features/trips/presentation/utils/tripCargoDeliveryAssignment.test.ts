import { describe, expect, it } from "vitest";

import { CARGO_DELIVERY_STOP_REQUIRED_CODE } from "@boeltech/cfdi-domain";
import { ApiError } from "@shared/api/interceptors/error-handler";

import type { TripStop } from "@features/trips/domain";

import {
  cargoRequiresExplicitDeliveryAssignment,
  countTripUnloadStops,
  type DeliveryAssignmentCargoLike,
  MULTI_UNLOAD_DELIVERY_GATE_MESSAGE,
  multiUnloadDeliveryBlockReason,
  resolveCargoDeliveryStopApiErrorMessage,
  tripHasMultiUnloadDeliveryGap,
} from "./tripCargoDeliveryAssignment";

function stop(types: string[]): Pick<TripStop, "stopType"> {
  return { stopType: types as TripStop["stopType"] };
}

function cargo(partial: DeliveryAssignmentCargoLike): DeliveryAssignmentCargoLike {
  return partial;
}

describe("tripCargoDeliveryAssignment", () => {
  const oneUnload = [stop(["origin", "pickup"]), stop(["destination", "delivery"])];
  const twoUnload = [
    stop(["origin", "pickup"]),
    stop(["delivery"]),
    stop(["destination", "delivery"]),
  ];

  it("counts unload stops via package (delivery|destination)", () => {
    expect(countTripUnloadStops(oneUnload)).toBe(1);
    expect(countTripUnloadStops(twoUnload)).toBe(2);
  });

  it("does not require delivery with 1 unload (F5a)", () => {
    expect(
      cargoRequiresExplicitDeliveryAssignment({
        unloadCount: 1,
        cargo: cargo({
          status: "pending",
          movements: [{ stopIndex: 0, movementType: "pickup" }],
        }),
      }),
    ).toBe(false);
    expect(
      tripHasMultiUnloadDeliveryGap(oneUnload, [
        cargo({
          status: "pending",
          movements: [{ stopIndex: 0, movementType: "pickup" }],
        }),
      ]),
    ).toBe(false);
  });

  it("requires delivery with ≥2 unloads and no delivery movement", () => {
    const gapCargo = cargo({
      status: "pending",
      movements: [{ stopIndex: 0, movementType: "pickup" }],
    });
    expect(
      cargoRequiresExplicitDeliveryAssignment({
        unloadCount: 2,
        cargo: gapCargo,
      }),
    ).toBe(true);
    expect(tripHasMultiUnloadDeliveryGap(twoUnload, [gapCargo])).toBe(true);
    expect(multiUnloadDeliveryBlockReason(twoUnload, [gapCargo])).toBe(
      MULTI_UNLOAD_DELIVERY_GATE_MESSAGE,
    );
  });

  it("clears gap when delivery is planned or cargo is terminal", () => {
    expect(
      tripHasMultiUnloadDeliveryGap(twoUnload, [
        cargo({
          status: "pending",
          movements: [
            { stopIndex: 0, movementType: "pickup" },
            { stopIndex: 1, movementType: "delivery" },
          ],
        }),
      ]),
    ).toBe(false);
    expect(
      tripHasMultiUnloadDeliveryGap(twoUnload, [
        cargo({
          status: "returned",
          movements: [{ stopIndex: 0, movementType: "pickup" }],
        }),
      ]),
    ).toBe(false);
  });

  it("maps API CARGO_DELIVERY_STOP_REQUIRED to gate copy", () => {
    expect(
      resolveCargoDeliveryStopApiErrorMessage(
        new ApiError("server", 409, CARGO_DELIVERY_STOP_REQUIRED_CODE),
      ),
    ).toBe(MULTI_UNLOAD_DELIVERY_GATE_MESSAGE);
    expect(resolveCargoDeliveryStopApiErrorMessage(new Error("x"))).toBeNull();
  });
});
