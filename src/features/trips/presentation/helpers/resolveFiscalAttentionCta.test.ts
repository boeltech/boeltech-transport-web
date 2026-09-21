import { describe, expect, it } from "vitest";

import {
  collectInvoicedSplitLegs,
  resolveFiscalAttentionCta,
  type FiscalAttentionSplitLegInput,
} from "./resolveFiscalAttentionCta";

function leg(
  overrides: Partial<FiscalAttentionSplitLegInput> & {
    clientId: string;
    sortOrder: number;
  },
): FiscalAttentionSplitLegInput {
  return {
    invoiceId: null,
    clientLegalName: null,
    ...overrides,
  };
}

describe("collectInvoicedSplitLegs", () => {
  it("ordena por sortOrder y omite piernas sin invoiceId", () => {
    expect(
      collectInvoicedSplitLegs([
        leg({
          clientId: "c-b",
          sortOrder: 2,
          invoiceId: "inv-b",
          clientLegalName: "Beta SA",
        }),
        leg({ clientId: "c-skip", sortOrder: 0 }),
        leg({
          clientId: "c-a",
          sortOrder: 1,
          invoiceId: "inv-a",
          clientLegalName: "Alpha SA",
        }),
      ]),
    ).toEqual([
      { invoiceId: "inv-a", label: "Alpha SA" },
      { invoiceId: "inv-b", label: "Beta SA" },
    ]);
  });

  it("usa prefijo de clientId si no hay razón social", () => {
    expect(
      collectInvoicedSplitLegs([
        leg({
          clientId: "abcdef12-xxxx",
          sortOrder: 0,
          invoiceId: "inv-1",
        }),
      ]),
    ).toEqual([{ invoiceId: "inv-1", label: "abcdef12" }]);
  });
});

describe("resolveFiscalAttentionCta", () => {
  it("oculta CTA si no hay requiresFiscalAttention", () => {
    expect(
      resolveFiscalAttentionCta({
        requiresFiscalAttention: false,
        hasActiveSplit: true,
        principalInvoiceId: null,
        splitLegsReady: true,
        splitLegs: [
          leg({ clientId: "c1", sortOrder: 0, invoiceId: "inv-1" }),
        ],
      }),
    ).toEqual({ kind: "none" });
  });

  it("primary + invoiceId → Sustituir (regresión T4-041)", () => {
    expect(
      resolveFiscalAttentionCta({
        requiresFiscalAttention: true,
        hasActiveSplit: false,
        principalInvoiceId: "inv-prin",
        splitLegsReady: false,
        splitLegs: [],
      }),
    ).toEqual({
      kind: "primary",
      bodyKey: "withInvoice",
      invoiceId: "inv-prin",
    });
  });

  it("primary sin invoiceId → copy revisar Facturación", () => {
    expect(
      resolveFiscalAttentionCta({
        requiresFiscalAttention: true,
        hasActiveSplit: false,
        principalInvoiceId: null,
        splitLegsReady: false,
        splitLegs: [],
      }),
    ).toEqual({
      kind: "primary",
      bodyKey: "noInvoice",
      invoiceId: null,
    });
  });

  it("split + piernas facturadas no depende de principalInvoiceId", () => {
    expect(
      resolveFiscalAttentionCta({
        requiresFiscalAttention: true,
        hasActiveSplit: true,
        principalInvoiceId: null,
        splitLegsReady: true,
        splitLegs: [
          leg({
            clientId: "c2",
            sortOrder: 1,
            invoiceId: "inv-2",
            clientLegalName: "Segundo",
          }),
          leg({
            clientId: "c1",
            sortOrder: 0,
            invoiceId: "inv-1",
            clientLegalName: "Primero",
          }),
        ],
      }),
    ).toEqual({
      kind: "split",
      bodyKey: "withInvoices",
      invoicedLegs: [
        { invoiceId: "inv-1", label: "Primero" },
        { invoiceId: "inv-2", label: "Segundo" },
      ],
    });
  });

  it("split ignora principalInvoiceId aunque venga poblado (no fingir prin)", () => {
    expect(
      resolveFiscalAttentionCta({
        requiresFiscalAttention: true,
        hasActiveSplit: true,
        principalInvoiceId: "stale-prin",
        splitLegsReady: true,
        splitLegs: [
          leg({ clientId: "c1", sortOrder: 0, invoiceId: "inv-leg" }),
        ],
      }).kind,
    ).toBe("split");
  });

  it("split sin piernas facturadas → noInvoicesYet (sin CTA roto)", () => {
    expect(
      resolveFiscalAttentionCta({
        requiresFiscalAttention: true,
        hasActiveSplit: true,
        principalInvoiceId: null,
        splitLegsReady: true,
        splitLegs: [
          leg({ clientId: "c1", sortOrder: 0 }),
          leg({ clientId: "c2", sortOrder: 1 }),
        ],
      }),
    ).toEqual({
      kind: "split",
      bodyKey: "noInvoicesYet",
      invoicedLegs: [],
    });
  });

  it("split mientras legs no ready → pending (sin CTA)", () => {
    expect(
      resolveFiscalAttentionCta({
        requiresFiscalAttention: true,
        hasActiveSplit: true,
        principalInvoiceId: null,
        splitLegsReady: false,
        splitLegs: [],
      }),
    ).toEqual({
      kind: "split",
      bodyKey: "pending",
      invoicedLegs: [],
    });
  });
});
