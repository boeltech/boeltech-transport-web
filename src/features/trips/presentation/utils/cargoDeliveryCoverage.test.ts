import { describe, expect, it } from "vitest";

import {
  computeCargoDeliveryCoverage,
  formatDeliveryRemainderLine,
  formatDeliveryRemainderParts,
} from "./cargoDeliveryCoverage";

describe("computeCargoDeliveryCoverage (F7)", () => {
  it("CA1: partial delivery → under with remainder weight and units", () => {
    const result = computeCargoDeliveryCoverage({
      cargoWeightKg: 21_000,
      cargoUnits: 21,
      deliveries: [{ weight: 10_000, units: 10 }],
    });

    expect(result).toEqual({
      status: "under",
      pendingWeight: 11_000,
      pendingUnits: 11,
      allocatedWeight: 10_000,
      allocatedUnits: 10,
      cargoWeight: 21_000,
      cargoUnits: 21,
    });
  });

  it("CA2: second delivery that completes → ok", () => {
    const result = computeCargoDeliveryCoverage({
      cargoWeightKg: 21_000,
      cargoUnits: 21,
      deliveries: [
        { weight: 10_000, units: 10 },
        { weight: 11_000, units: 11 },
      ],
    });

    expect(result.status).toBe("ok");
  });

  it("CA3: excess weight or units → over", () => {
    expect(
      computeCargoDeliveryCoverage({
        cargoWeightKg: 1000,
        cargoUnits: 10,
        deliveries: [{ weight: 1500, units: 10 }],
      }).status,
    ).toBe("over");

    expect(
      computeCargoDeliveryCoverage({
        cargoWeightKg: 1000,
        cargoUnits: 10,
        deliveries: [{ weight: 1000, units: 12 }],
      }),
    ).toMatchObject({
      status: "over",
      excessUnits: 2,
      excessWeight: null,
    });
  });

  it("CA4 / D-F7-8: 0 deliveries → n/a (no false under-allocation)", () => {
    expect(
      computeCargoDeliveryCoverage({
        cargoWeightKg: 21_000,
        cargoUnits: 21,
        deliveries: [],
      }),
    ).toEqual({ status: "n/a" });
  });

  it("ignores dimensions with total ≤ 0", () => {
    expect(
      computeCargoDeliveryCoverage({
        cargoWeightKg: 0,
        cargoUnits: null,
        deliveries: [{ weight: 10, units: 1 }],
      }).status,
    ).toBe("ok");
  });

  it("treats missing delivery qty as 0 when totals apply", () => {
    expect(
      computeCargoDeliveryCoverage({
        cargoWeightKg: 100,
        cargoUnits: 5,
        deliveries: [{ weight: null, units: undefined }],
      }),
    ).toMatchObject({
      status: "under",
      pendingWeight: 100,
      pendingUnits: 5,
      allocatedWeight: 0,
      allocatedUnits: 0,
    });
  });
});

describe("formatDeliveryRemainderLine", () => {
  it("joins kg and uds with slash", () => {
    expect(formatDeliveryRemainderParts(11_000, 11)).toEqual([
      "11,000 kg",
      "11 uds",
    ]);
    expect(formatDeliveryRemainderLine(11_000, 11)).toBe("11,000 kg / 11 uds");
  });

  it("omits null dimensions", () => {
    expect(formatDeliveryRemainderLine(500, null)).toBe("500 kg");
    expect(formatDeliveryRemainderLine(null, 3)).toBe("3 uds");
    expect(formatDeliveryRemainderLine(null, null)).toBe("");
  });
});
