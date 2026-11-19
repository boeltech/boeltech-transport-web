import { describe, expect, it } from "vitest";

import { mapTripLinkedInvoice } from "./tripLinkedInvoicesApi";

describe("mapTripLinkedInvoice", () => {
  it("mapea snake_case API → camelCase dominio", () => {
    const mapped = mapTripLinkedInvoice({
      id: "inv-1",
      serie: "A",
      folio: 12,
      status: "stamped",
      billing_scope: "split_share",
      split_leg_id: "leg-1",
      attach_carta_porte: true,
      share_percent: 40.5,
      total: 1160,
      total_paid: 200,
      balance_due: 960,
      stamped_at: "2026-11-12T14:00:00.000Z",
      parent_invoice_id: "inv-0",
      created_at: "2026-11-12T13:00:00.000Z",
    });

    expect(mapped).toEqual({
      id: "inv-1",
      serie: "A",
      folio: 12,
      status: "stamped",
      billingScope: "split_share",
      splitLegId: "leg-1",
      attachCartaPorte: true,
      sharePercent: 40.5,
      total: 1160,
      totalPaid: 200,
      balanceDue: 960,
      stampedAt: "2026-11-12T14:00:00.000Z",
      parentInvoiceId: "inv-0",
      createdAt: "2026-11-12T13:00:00.000Z",
    });
  });

  it("tolera scope/status desconocidos con defaults seguros", () => {
    const mapped = mapTripLinkedInvoice({
      id: "inv-2",
      billing_scope: "unknown",
      status: "weird",
      folio: "3",
    });
    expect(mapped.billingScope).toBe("primary_transport");
    expect(mapped.status).toBe("draft");
    expect(mapped.folio).toBe(3);
    expect(mapped.splitLegId).toBeNull();
    expect(mapped.parentInvoiceId).toBeNull();
  });
});
