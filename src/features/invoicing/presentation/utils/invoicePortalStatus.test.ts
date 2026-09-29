import { describe, expect, it } from "vitest";

import { InvoiceStatusLabels } from "../../domain";
import { invoicingCopy } from "../copy/invoicingCopy";
import { resolveInvoicePortalStatusLabel } from "./invoicePortalStatus";

describe("resolveInvoicePortalStatusLabel", () => {
  it("usa Borrador / En proceso / Facturado y no Timbrada", () => {
    expect(resolveInvoicePortalStatusLabel("draft")).toBe("Borrador");
    expect(resolveInvoicePortalStatusLabel("stamping")).toBe("En proceso");
    expect(resolveInvoicePortalStatusLabel("stamped")).toBe("Facturado");
    expect(resolveInvoicePortalStatusLabel("stamped")).not.toBe(
      InvoiceStatusLabels.stamped,
    );
    expect(invoicingCopy.detail.statusLabelsClient.stamped).toBe("Facturado");
    expect(invoicingCopy.detail.statusLabelsClient.stamping).toBe("En proceso");
    expect(JSON.stringify(invoicingCopy.detail.statusLabelsClient)).not.toMatch(
      /Timbrada/,
    );
  });
});
