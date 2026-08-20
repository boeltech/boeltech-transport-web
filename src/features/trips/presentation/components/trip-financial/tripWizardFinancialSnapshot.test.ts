import { describe, expect, it } from "vitest";
import { buildTripWizardFinancialSnapshot } from "./tripWizardFinancialSnapshot";

describe("buildTripWizardFinancialSnapshot", () => {
  it("includes all lines when costBasis is all (wizard / pre-close)", () => {
    const snapshot = buildTripWizardFinancialSnapshot(10_000, [
      {
        category: "fuel",
        description: "Diesel",
        amount: 1_000,
        status: "pending",
      },
      {
        category: "tolls",
        description: "Caseta",
        amount: 500,
        status: "approved",
      },
    ]);

    expect(snapshot.costBasis).toBe("all");
    expect(snapshot.totalExpenses).toBe(1_500);
    expect(snapshot.financial.margin).toBe(8_500);
    expect(snapshot.queuedCostsTotal).toBe(1_000);
  });

  it("uses only approved costs for primary margin (PD-D)", () => {
    const snapshot = buildTripWizardFinancialSnapshot(
      10_000,
      [
        {
          category: "fuel",
          description: "Diesel",
          amount: 2_000,
          status: "pending",
        },
        {
          category: "tolls",
          description: "Caseta",
          amount: 1_000,
          status: "approved",
        },
        {
          category: "lodging",
          description: "Hotel",
          amount: 800,
          status: "documented",
        },
      ],
      { costBasis: "approved" },
    );

    expect(snapshot.costBasis).toBe("approved");
    expect(snapshot.totalExpenses).toBe(1_000);
    expect(snapshot.financial.margin).toBe(9_000);
    expect(snapshot.queuedCostsTotal).toBe(2_800);
    expect(snapshot.operationalCosts).toHaveLength(1);
    expect(snapshot.indirectExpenses).toHaveLength(0);
  });
});
