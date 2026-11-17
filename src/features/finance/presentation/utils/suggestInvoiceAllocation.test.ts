import { describe, expect, it } from "vitest";
import { suggestInvoiceAllocation } from "./suggestInvoiceAllocation";

describe("suggestInvoiceAllocation", () => {
  it("allocates oldest invoices first", () => {
    const result = suggestInvoiceAllocation(10000, [
      { id: "b", issuedAt: "2026-02-01", balanceDue: 8000 },
      { id: "a", issuedAt: "2026-01-01", balanceDue: 5000 },
    ]);
    expect(result.a).toBe(5000);
    expect(result.b).toBe(5000);
  });

  it("returns zeros when amount is empty", () => {
    const result = suggestInvoiceAllocation(0, [
      { id: "a", issuedAt: "2026-01-01", balanceDue: 100 },
    ]);
    expect(result).toEqual({ a: 0 });
  });
});
