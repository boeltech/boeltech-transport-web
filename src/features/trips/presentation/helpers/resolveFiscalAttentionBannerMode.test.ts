import { describe, expect, it } from "vitest";

import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { resolveFiscalAttentionBannerMode } from "./resolveFiscalAttentionBannerMode";

const activeFreight = tripInvoicingFixture({
  hasActivePrimaryInvoice: true,
  hasActivePrincipalInvoice: true,
  primaryTransportInvoiceId: "inv-1",
  invoiceId: "inv-1",
  invoiceStatus: "stamped",
});

describe("resolveFiscalAttentionBannerMode", () => {
  it("prioriza false_trip aunque el viaje esté cancelled", () => {
    expect(
      resolveFiscalAttentionBannerMode({
        operationalOutcome: "false_trip",
        requiresFiscalAttention: true,
        status: "cancelled",
        invoicing: activeFreight,
      }),
    ).toBe("falseTrip");
  });

  it("false_trip sin flete primary_transport → none (no cae a mid-trip ni post-cancel)", () => {
    expect(
      resolveFiscalAttentionBannerMode({
        operationalOutcome: "false_trip",
        requiresFiscalAttention: true,
        status: "cancelled",
        invoicing: tripInvoicingFixture({
          hasActivePrimaryInvoice: false,
          hasActivePrincipalInvoice: true,
          invoiceId: "inv-false",
          invoiceStatus: "stamped",
        }),
      }),
    ).toBe("none");
  });

  it("requiresFiscalAttention + cancelled → postCancel", () => {
    expect(
      resolveFiscalAttentionBannerMode({
        operationalOutcome: "standard",
        requiresFiscalAttention: true,
        status: "cancelled",
        invoicing: activeFreight,
      }),
    ).toBe("postCancel");
  });

  it("requiresFiscalAttention + no cancelled → midTrip", () => {
    expect(
      resolveFiscalAttentionBannerMode({
        operationalOutcome: "standard",
        requiresFiscalAttention: true,
        status: "in_progress",
        invoicing: activeFreight,
      }),
    ).toBe("midTrip");
  });

  it("sin bandera → none", () => {
    expect(
      resolveFiscalAttentionBannerMode({
        operationalOutcome: "standard",
        requiresFiscalAttention: false,
        status: "cancelled",
        invoicing: activeFreight,
      }),
    ).toBe("none");
  });
});
