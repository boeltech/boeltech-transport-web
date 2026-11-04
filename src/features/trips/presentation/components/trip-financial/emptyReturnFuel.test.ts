import { describe, expect, it } from "vitest";

import { expenseCopy } from "../../copy/wizard/expenseCopy";
import { costsCopy } from "../../copy/tripDetail/costsCopy";
import {
  emptyReturnSaveShape,
  hasUnmarkedRouteFuel,
  quoteEmptyReturnFuel,
  sumRoundedAmounts,
} from "./emptyReturnFuel";

describe("quoteEmptyReturnFuel", () => {
  it("quotes each portion in cents and sums those cents", () => {
    const quoted = quoteEmptyReturnFuel({
      scope: "both",
      routeKm: 100,
      returnKm: 1,
      kmPerLiter: 3,
      pricePerLiter: 24.5,
    });

    expect(quoted.route?.amount).toBe(816.67);
    expect(quoted.emptyReturn?.amount).toBe(8.17);
    expect(quoted.total).toBe(824.84);
    expect(quoted.total).toBe(
      sumRoundedAmounts([
        quoted.route?.amount ?? 0,
        quoted.emptyReturn?.amount ?? 0,
      ]),
    );
  });

  it("route scope ignores return kilometers", () => {
    const quoted = quoteEmptyReturnFuel({
      scope: "route",
      routeKm: 100,
      returnKm: 50,
      kmPerLiter: 10,
      pricePerLiter: 24,
    });
    expect(quoted.route?.amount).toBe(240);
    expect(quoted.emptyReturn).toBeNull();
    expect(quoted.total).toBe(240);
  });

  it("return scope does not quote the route", () => {
    const quoted = quoteEmptyReturnFuel({
      scope: "return",
      routeKm: 100,
      returnKm: 40,
      kmPerLiter: 10,
      pricePerLiter: 24,
    });
    expect(quoted.route).toBeNull();
    expect(quoted.emptyReturn?.amount).toBe(96);
    expect(quoted.total).toBe(96);
  });
});

describe("emptyReturnSaveShape", () => {
  it("adds only the return row when route fuel already exists", () => {
    expect(
      emptyReturnSaveShape({ scope: "both", hasUnmarkedRouteFuel: true }),
    ).toBe("return");
    expect(
      emptyReturnSaveShape({ scope: "both", hasUnmarkedRouteFuel: false }),
    ).toBe("pair");
    expect(
      emptyReturnSaveShape({ scope: "return", hasUnmarkedRouteFuel: false }),
    ).toBe("return");
    expect(
      emptyReturnSaveShape({ scope: "route", hasUnmarkedRouteFuel: true }),
    ).toBe("route");
  });
});

describe("hasUnmarkedRouteFuel", () => {
  it("ignores a fuel row that is already the empty return", () => {
    expect(
      hasUnmarkedRouteFuel([
        { category: "fuel", isEmptyReturn: true },
        { category: "tolls" },
      ]),
    ).toBe(false);
    expect(
      hasUnmarkedRouteFuel([{ category: "fuel", isEmptyReturn: false }]),
    ).toBe(true);
  });
});

describe("empty-return copy", () => {
  it("does not say patio", () => {
    const samples = [
      ...Object.values(expenseCopy.emptyReturn),
      expenseCopy.action.addTwoConcepts,
      expenseCopy.format.dieselEmptyReturnDescription,
      expenseCopy.toast.addedPairBody("Ruta", "Regreso"),
      costsCopy.emptyReturn.badge,
      costsCopy.emptyReturn.deleteHint,
      costsCopy.toast.createdPair("Ruta", "Regreso"),
      costsCopy.toast.createdRoutePendingReturn,
    ];
    for (const text of samples) {
      expect(text.toLowerCase()).not.toContain("patio");
    }
  });
});
