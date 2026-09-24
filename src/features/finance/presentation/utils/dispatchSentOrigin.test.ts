import { describe, expect, it } from "vitest";
import type { InvoiceListItem } from "@features/invoicing/domain";
import { resolveDispatchSentOrigin } from "./dispatchSentOrigin";

function buildInvoice(
  overrides: Partial<InvoiceListItem> = {},
): InvoiceListItem {
  return {
    id: "inv-1",
    tenantId: "t-1",
    serie: "A",
    folio: 10,
    cfdiUuid: null,
    receiverRfc: "XAXX010101000",
    receiverName: "Receptor Demo",
    clientId: "client-a",
    clientName: "Cliente A",
    issuedAt: "2026-08-01T12:00:00.000Z",
    paymentForm: "99",
    paymentMethod: "PPD",
    currency: "MXN",
    subtotal: 1000,
    totalTax: 160,
    total: 1160,
    status: "stamped",
    satCancellationStatus: "none",
    satCancellationMessage: null,
    stampedAt: "2026-08-01T12:00:00.000Z",
    dispatchSentAt: "2026-08-02T09:00:00.000Z",
    tripCount: 1,
    tripCodes: ["TRP-001"],
    totalPaid: 0,
    balanceDue: 1160,
    createdAt: "2026-08-01T10:00:00.000Z",
    createdByName: null,
    ...overrides,
  };
}

describe("resolveDispatchSentOrigin", () => {
  it("returns scheduled when lastScheduledRunId is present", () => {
    expect(
      resolveDispatchSentOrigin(
        buildInvoice({
          autoDispatch: {
            enabledForClient: true,
            lastScheduledRunId: "run-1",
            lastItemStatus: "sent",
            lastError: null,
          },
        }),
      ),
    ).toBe("scheduled");
  });

  it("returns manual when lastScheduledRunId is null or missing", () => {
    expect(resolveDispatchSentOrigin(buildInvoice())).toBe("manual");
    expect(
      resolveDispatchSentOrigin(
        buildInvoice({
          autoDispatch: {
            enabledForClient: true,
            lastScheduledRunId: null,
            lastItemStatus: null,
            lastError: null,
          },
        }),
      ),
    ).toBe("manual");
  });
});
