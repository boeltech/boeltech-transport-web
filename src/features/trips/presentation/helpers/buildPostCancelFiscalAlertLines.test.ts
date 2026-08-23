import { describe, expect, it } from "vitest";

import { buildPostCancelFiscalAlertLines } from "../helpers/buildPostCancelFiscalAlertLines";

describe("buildPostCancelFiscalAlertLines", () => {
  it("localizes invoice status and includes reference", () => {
    const lines = buildPostCancelFiscalAlertLines({
      invoiceId: "inv-1",
      invoiceStatus: "stamped",
      cfdiUuid: "uuid-123",
      suggestedActions: ["Cancelar la factura timbrada"],
    });

    expect(lines).toContain("Cancelar la factura timbrada");
    expect(lines.some((line) => line.includes("Facturado"))).toBe(true);
    expect(lines.some((line) => line.includes("uuid-123"))).toBe(true);
    expect(lines.some((line) => line.includes("stamped"))).toBe(false);
  });
});
