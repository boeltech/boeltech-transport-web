import { describe, expect, it } from "vitest";
import { isBillableMotrizNow, isBillableMotrizType } from "./isBillableMotriz";

describe("isBillableMotrizType", () => {
  it("acepta tracto, tórton y rabón", () => {
    expect(isBillableMotrizType("truck")).toBe(true);
    expect(isBillableMotrizType("torton")).toBe(true);
    expect(isBillableMotrizType("rabon")).toBe(true);
  });

  it("rechaza pickup, utility y vacíos", () => {
    expect(isBillableMotrizType("pickup")).toBe(false);
    expect(isBillableMotrizType("utility")).toBe(false);
    expect(isBillableMotrizType(undefined)).toBe(false);
    expect(isBillableMotrizType(null)).toBe(false);
  });
});

describe("isBillableMotrizNow", () => {
  it("truck + available + active → true", () => {
    expect(
      isBillableMotrizNow({
        type: "truck",
        status: "available",
        isActive: true,
      }),
    ).toBe(true);
  });

  it("pickup → false", () => {
    expect(
      isBillableMotrizNow({
        type: "pickup",
        status: "available",
        isActive: true,
      }),
    ).toBe(false);
  });

  it("truck + out_of_service → false", () => {
    expect(
      isBillableMotrizNow({
        type: "truck",
        status: "out_of_service",
        isActive: true,
      }),
    ).toBe(false);
  });

  it("truck + in_maintenance → true", () => {
    expect(
      isBillableMotrizNow({
        type: "truck",
        status: "in_maintenance",
        isActive: true,
      }),
    ).toBe(true);
  });

  it("truck activo sin status (alta) → true", () => {
    expect(isBillableMotrizNow({ type: "truck" })).toBe(true);
  });

  it("truck inactivo → false", () => {
    expect(
      isBillableMotrizNow({
        type: "truck",
        status: "available",
        isActive: false,
      }),
    ).toBe(false);
  });
});
