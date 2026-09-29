import { describe, expect, it } from "vitest";
import {
  isTripAssignableVehicleType,
  TRIP_ASSIGNABLE_VEHICLE_TYPES,
} from "./isTripAssignableVehicleType";

describe("isTripAssignableVehicleType", () => {
  it("permite tracto, tórton, rabón y camioneta", () => {
    expect(TRIP_ASSIGNABLE_VEHICLE_TYPES).toEqual([
      "truck",
      "torton",
      "rabon",
      "pickup",
    ]);
    expect(isTripAssignableVehicleType("truck")).toBe(true);
    expect(isTripAssignableVehicleType("pickup")).toBe(true);
  });

  it("rechaza utilitario", () => {
    expect(isTripAssignableVehicleType("utility")).toBe(false);
    expect(isTripAssignableVehicleType(undefined)).toBe(false);
  });
});
