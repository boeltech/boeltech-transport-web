import { describe, expect, it } from "vitest";
import { getAccountStatementDisplayPaid } from "./accountStatementDisplayPaid";

describe("getAccountStatementDisplayPaid", () => {
  it("shows PUE settlement when total_paid is raw 0 and balance is 0", () => {
    expect(
      getAccountStatementDisplayPaid({
        totalInvoiced: 31920,
        balanceDue: 0,
      }),
    ).toBe(31920);
  });

  it("equals registered payments for partial PPD", () => {
    expect(
      getAccountStatementDisplayPaid({
        totalInvoiced: 5000,
        balanceDue: 3000,
      }),
    ).toBe(2000);
  });

  it("sums PUE settlement plus PPD payments for mixed clients", () => {
    expect(
      getAccountStatementDisplayPaid({
        totalInvoiced: 15000,
        balanceDue: 3000,
      }),
    ).toBe(12000);
  });

  it("clamps to 0 when balance exceeds invoiced", () => {
    expect(
      getAccountStatementDisplayPaid({
        totalInvoiced: 100,
        balanceDue: 150,
      }),
    ).toBe(0);
  });

  it("does not use a caja totalPaid field even when callers have one", () => {
    const displayPaid = getAccountStatementDisplayPaid({
      totalInvoiced: 31920,
      balanceDue: 0,
    });
    const cajaTotalPaid = 0;
    expect(displayPaid).toBe(31920);
    expect(displayPaid).not.toBe(cajaTotalPaid);
  });
});
