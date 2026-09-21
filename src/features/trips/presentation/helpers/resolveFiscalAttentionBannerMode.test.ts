import { describe, expect, it } from "vitest";

import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { resolveFiscalAttentionBannerMode } from "./resolveFiscalAttentionBannerMode";

const activePrincipal = tripInvoicingFixture({
  hasActivePrincipalInvoice: true,
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
        invoicing: activePrincipal,
      }),
    ).toBe("falseTrip");
  });

  it("false_trip sin principal activa → none (no cae a mid-trip ni post-cancel)", () => {
    expect(
      resolveFiscalAttentionBannerMode({
        operationalOutcome: "false_trip",
        requiresFiscalAttention: true,
        status: "cancelled",
        invoicing: tripInvoicingFixture({
          hasActivePrincipalInvoice: false,
          invoiceId: "inv-1",
          invoiceStatus: "cancelled",
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
        invoicing: activePrincipal,
      }),
    ).toBe("postCancel");
  });

  it("requiresFiscalAttention + no cancelled → midTrip", () => {
    expect(
      resolveFiscalAttentionBannerMode({
        operationalOutcome: "standard",
        requiresFiscalAttention: true,
        status: "in_progress",
        invoicing: activePrincipal,
      }),
    ).toBe("midTrip");
  });

  it("sin bandera → none", () => {
    expect(
      resolveFiscalAttentionBannerMode({
        operationalOutcome: "standard",
        requiresFiscalAttention: false,
        status: "cancelled",
        invoicing: activePrincipal,
      }),
    ).toBe("none");
  });
});
