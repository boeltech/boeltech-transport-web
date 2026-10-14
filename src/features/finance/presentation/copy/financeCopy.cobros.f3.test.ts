import { describe, expect, it } from "vitest";
import { financeCopy } from "./financeCopy";

const copy = financeCopy.cobros;

describe("financeCopy.cobros F3 (D13)", () => {
  it("states lote = current page and filter RFC to gather several", () => {
    expect(copy.selectedHint).toMatch(/lote.*esta página/i);
    expect(copy.sameRfcOnlyHint).toMatch(/Filtra por RFC/i);
    expect(copy.sameRfcOnlyHint).toMatch(/esta página/i);
    expect(copy.sheetDescription).toMatch(/esta página/i);
    expect(copy.workbench.description).toMatch(/página actual/i);
    expect(copy.selectAllAria).toMatch(/esta página/i);
  });

  it("does not keep deprecated followThrough tray copy", () => {
    expect(
      "followThrough" in copy,
    ).toBe(false);
  });
});
