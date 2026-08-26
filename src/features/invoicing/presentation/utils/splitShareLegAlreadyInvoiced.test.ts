import { describe, expect, it } from "vitest";
import { findSplitShareLegAlreadyInvoiced } from "./splitShareLegAlreadyInvoiced";

describe("findSplitShareLegAlreadyInvoiced", () => {
  const legs = [
    { id: "leg-a", invoiceId: null },
    { id: "leg-b", invoiceId: "inv-1" },
  ];

  it("null si la porción no tiene factura", () => {
    expect(findSplitShareLegAlreadyInvoiced(legs, "leg-a")).toBeNull();
  });

  it("devuelve la porción si ya tiene factura", () => {
    expect(findSplitShareLegAlreadyInvoiced(legs, "leg-b")).toEqual({
      id: "leg-b",
      invoiceId: "inv-1",
    });
  });

  it("null sin leg_id o sin legs", () => {
    expect(findSplitShareLegAlreadyInvoiced(legs, null)).toBeNull();
    expect(findSplitShareLegAlreadyInvoiced(undefined, "leg-b")).toBeNull();
  });
});
