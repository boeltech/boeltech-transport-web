import { describe, expect, it } from "vitest";
import type { DriverSettlement } from "../../domain/entities";
import { assessCorrectionCapacity } from "./settlementEditing";

const settlement = {
  id: "set-1",
  status: "draft",
  totalTripsCommission: 2000,
  totalBaseSalary: 0,
  totalFixedAllowances: 0,
  totalReimbursableExpenses: 0,
  totalBonuses: 0,
  totalAdvancesDeducted: 0,
  totalOtherDeductions: 300,
  grossAmount: 2000,
  netAmount: 1700,
  items: [],
} as unknown as DriverSettlement;

describe("assessCorrectionCapacity (paridad con el PATCH)", () => {
  it("bruto 2,000 − fondo 300: caben 1,700 en anticipos; 2,000 exceden por 300", () => {
    expect(
      assessCorrectionCapacity(
        settlement,
        { customItems: [], advancesToApply: [{ amountToDeduct: 2000 }] },
        { advancesEditable: true },
      ),
    ).toEqual({ maxAdvanceDeductible: 1700, excessAmount: 300, excessSource: "advances" });
  });

  it("anticipos no editables: usa los guardados", () => {
    expect(
      assessCorrectionCapacity(
        { ...settlement, totalAdvancesDeducted: 1000 },
        { customItems: [], advancesToApply: [{ amountToDeduct: 9999 }] },
        { advancesEditable: false },
      )?.excessSource,
    ).toBeNull();
  });

  it("legada con anticipos descontados al crear: exenta (el API no la valida)", () => {
    expect(
      assessCorrectionCapacity(
        { ...settlement, advancesDeductedAtCreate: true },
        { customItems: [], advancesToApply: [] },
        { advancesEditable: false },
      ),
    ).toBeNull();
  });
});
