import { describe, expect, it } from "vitest";
import {
  parseMarginBasis,
  resolveMarginBasis,
  resolveMonthlyMarginBasis,
  shouldShowMissingCommissionChip,
} from "./marginBasis";

describe("marginBasis", () => {
  it("parseMarginBasis solo acepta valores del contrato", () => {
    expect(parseMarginBasis("operational")).toBe("operational");
    expect(parseMarginBasis("trip_expenses")).toBe("trip_expenses");
    expect(parseMarginBasis("other")).toBeUndefined();
  });

  it("resolveMarginBasis: meta gana; si no, operational cuando hay métricas", () => {
    expect(
      resolveMarginBasis({
        metaBasis: "trip_expenses",
        hasOperationalMetrics: true,
      }),
    ).toBe("trip_expenses");
    expect(
      resolveMarginBasis({
        metaBasis: undefined,
        hasOperationalMetrics: true,
      }),
    ).toBe("operational");
    expect(
      resolveMarginBasis({
        metaBasis: undefined,
        hasOperationalMetrics: false,
      }),
    ).toBe("trip_expenses");
  });

  it("resolveMonthlyMarginBasis detecta flag off cuando primary ≠ operational", () => {
    expect(
      resolveMonthlyMarginBasis([
        { actualCost: 100, operationalCost: 150 },
        { actualCost: 200, operationalCost: 200 },
      ]),
    ).toBe("trip_expenses");
    expect(
      resolveMonthlyMarginBasis([
        { actualCost: 150, operationalCost: 150 },
        { actualCost: 200, operationalCost: 200 },
      ]),
    ).toBe("operational");
  });

  it("shouldShowMissingCommissionChip: completed + gastos + sin comisión", () => {
    expect(
      shouldShowMissingCommissionChip({
        tripStatus: "completed",
        actualTotal: 500,
        tripCommissionTotal: 0,
      }),
    ).toBe(true);
    expect(
      shouldShowMissingCommissionChip({
        financialBucket: "realized",
        actualTotal: 500,
        tripCommissionTotal: undefined,
      }),
    ).toBe(true);
    expect(
      shouldShowMissingCommissionChip({
        tripStatus: "completed",
        actualTotal: 500,
        tripCommissionTotal: 200,
      }),
    ).toBe(false);
    expect(
      shouldShowMissingCommissionChip({
        tripStatus: "completed",
        actualTotal: 0,
        tripCommissionTotal: 0,
      }),
    ).toBe(false);
    expect(
      shouldShowMissingCommissionChip({
        tripStatus: "in_progress",
        actualTotal: 500,
        tripCommissionTotal: 0,
      }),
    ).toBe(false);
  });
});
