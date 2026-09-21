import { describe, expect, it } from "vitest";

import { shellCopy } from "../copy/tripDetail/shellCopy";
import { buildPostCancelFiscalAlertLines } from "../helpers/buildPostCancelFiscalAlertLines";

describe("buildPostCancelFiscalAlertLines", () => {
  it("uses human copy and localizes invoice status with reference", () => {
    const lines = buildPostCancelFiscalAlertLines({
      invoiceId: "inv-1",
      invoiceStatus: "stamped",
      cfdiUuid: "uuid-123",
      suggestedActions: ["request_cancellation"],
    });

    expect(lines[0]).toBe(shellCopy.alert.postCancelFiscalActionLine);
    expect(lines.some((line) => line.includes("Facturado"))).toBe(true);
    expect(lines.some((line) => line.includes("uuid-123"))).toBe(true);
    expect(lines.some((line) => line.includes("stamped"))).toBe(false);
  });

  it("never dumps API action codes (request_cancellation / keep_cfdi)", () => {
    const lines = buildPostCancelFiscalAlertLines({
      invoiceId: "inv-2",
      invoiceStatus: "cancellation_pending",
      cfdiUuid: null,
      suggestedActions: ["request_cancellation", "keep_cfdi"],
    });

    const joined = lines.join("\n");
    expect(joined).not.toMatch(/request_cancellation/);
    expect(joined).not.toMatch(/keep_cfdi/);
    expect(joined).toContain(shellCopy.alert.postCancelFiscalActionLine);
    expect(joined).toContain("inv-2");
  });
});
