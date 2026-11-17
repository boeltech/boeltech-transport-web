import { describe, expect, it } from "vitest";
import { financeCopy } from "./financeCopy";

const copy = financeCopy.cobros;

describe("financeCopy.cobros F2 (updated copy)", () => {
  it("selectedHint describes next-step adjustments", () => {
    expect(copy.selectedHint).toMatch(/monto.*reparto|siguiente paso/i);
  });

  it("sameRfcOnlyHint mentions RFC filter", () => {
    expect(copy.sameRfcOnlyHint).toMatch(/Filtra por RFC/i);
  });

  it("workbench description mentions PPD with saldo and REP", () => {
    expect(copy.workbench.description).toMatch(/PPD/i);
    expect(copy.workbench.description).toMatch(/REP/i);
  });

  it("does not keep deprecated followThrough tray copy", () => {
    expect(
      "followThrough" in copy,
    ).toBe(false);
  });
});
