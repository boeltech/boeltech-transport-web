import { describe, expect, it } from "vitest";

import { TripStatus } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import type { TripNextStepPlan } from "../helpers/resolveTripNextStepActions";

import {
  nextStepPlanOwnsInvoicing,
  shouldCollapseTripInvoicingConsoleByDefault,
  shouldMountTripInvoicingConsole,
} from "./shouldShowTripInvoicingConsole";

function makeGateTrip(
  invoicingOverrides: Parameters<typeof tripInvoicingFixture>[0] = {},
) {
  return {
    cfdiEmissionIntent: "emitir_cfdi" as const,
    invoicing: tripInvoicingFixture({
      invoiceId: "inv-draft-1",
      invoiceStatus: "draft",
      invoiceFolio: "A-1",
      ...invoicingOverrides,
    }),
  };
}

const planWithOpenDraft: TripNextStepPlan = {
  phase: "scheduled",
  primary: { id: "go_to_tracking", tab: "tracking" },
  secondaries: [{ id: "open_draft", invoiceId: "inv-draft-1" }],
};

const planWithViewInvoices: TripNextStepPlan = {
  phase: "scheduled",
  primary: { id: "go_to_tracking", tab: "tracking" },
  secondaries: [{ id: "view_invoices" }],
};

const planInvoiceOnly: TripNextStepPlan = {
  phase: "scheduled",
  primary: { id: "invoice" },
  secondaries: [{ id: "go_to_tracking", tab: "tracking" }],
};

const planTrackingOnly: TripNextStepPlan = {
  phase: "scheduled",
  primary: { id: "go_to_tracking", tab: "tracking" },
  secondaries: [],
};

describe("shouldCollapseTripInvoicingConsoleByDefault (F4)", () => {
  it("colapsa en in_progress sin ATF", () => {
    expect(
      shouldCollapseTripInvoicingConsoleByDefault({
        status: TripStatus.IN_PROGRESS,
        requiresFiscalAttention: false,
      }),
    ).toBe(true);
  });

  it("no colapsa en in_progress con ATF", () => {
    expect(
      shouldCollapseTripInvoicingConsoleByDefault({
        status: TripStatus.IN_PROGRESS,
        requiresFiscalAttention: true,
      }),
    ).toBe(false);
  });

  it("no colapsa en scheduled / completed / draft", () => {
    for (const status of [
      TripStatus.DRAFT,
      TripStatus.SCHEDULED,
      TripStatus.COMPLETED,
      TripStatus.CANCELLED,
    ] as const) {
      expect(
        shouldCollapseTripInvoicingConsoleByDefault({
          status,
          requiresFiscalAttention: false,
        }),
      ).toBe(false);
    }
  });
});

describe("nextStepPlanOwnsInvoicing (D21 + D25)", () => {
  it("false si no hay plan (p. ej. D19 Seguimiento)", () => {
    expect(nextStepPlanOwnsInvoicing(null)).toBe(false);
    expect(nextStepPlanOwnsInvoicing(undefined)).toBe(false);
  });

  it("true con secundaria open_draft o view_invoices", () => {
    expect(nextStepPlanOwnsInvoicing(planWithOpenDraft)).toBe(true);
    expect(nextStepPlanOwnsInvoicing(planWithViewInvoices)).toBe(true);
  });

  it("true con primary invoice (D25)", () => {
    expect(nextStepPlanOwnsInvoicing(planInvoiceOnly)).toBe(true);
  });

  it("false con solo tracking (sin guía de facturación)", () => {
    expect(nextStepPlanOwnsInvoicing(planTrackingOnly)).toBe(false);
  });
});

describe("shouldMountTripInvoicingConsole (D21 + D25)", () => {
  it("Ruta + next-step tipa drafts → no monta consola", () => {
    expect(
      shouldMountTripInvoicingConsole({
        trip: makeGateTrip(),
        hasPostCancelFiscal: false,
        requiresFiscalAttention: false,
        nextStepPlan: planWithOpenDraft,
      }),
    ).toBe(false);
    expect(
      shouldMountTripInvoicingConsole({
        trip: makeGateTrip(),
        hasPostCancelFiscal: false,
        requiresFiscalAttention: false,
        nextStepPlan: planWithViewInvoices,
      }),
    ).toBe(false);
  });

  it("scheduled + primary invoice → no monta consola (D25)", () => {
    expect(
      shouldMountTripInvoicingConsole({
        trip: makeGateTrip(),
        hasPostCancelFiscal: false,
        requiresFiscalAttention: false,
        nextStepPlan: planInvoiceOnly,
      }),
    ).toBe(false);
  });

  it("Seguimiento sin next-step (D19) + drafts → consola ok si hay contenido", () => {
    expect(
      shouldMountTripInvoicingConsole({
        trip: makeGateTrip(),
        hasPostCancelFiscal: false,
        requiresFiscalAttention: false,
        nextStepPlan: null,
      }),
    ).toBe(true);
  });

  it("excepción ATF: monta aunque next-step tipa drafts", () => {
    expect(
      shouldMountTripInvoicingConsole({
        trip: makeGateTrip(),
        hasPostCancelFiscal: false,
        requiresFiscalAttention: true,
        nextStepPlan: planWithViewInvoices,
      }),
    ).toBe(true);
  });

  it("excepción ATF: monta aunque primary=invoice (D25)", () => {
    expect(
      shouldMountTripInvoicingConsole({
        trip: makeGateTrip(),
        hasPostCancelFiscal: false,
        requiresFiscalAttention: true,
        nextStepPlan: planInvoiceOnly,
      }),
    ).toBe(true);
  });

  it("excepción post-cancel: monta aunque next-step tipa drafts", () => {
    expect(
      shouldMountTripInvoicingConsole({
        trip: makeGateTrip({
          invoiceId: undefined,
          invoiceStatus: null,
          invoiceFolio: undefined,
        }),
        hasPostCancelFiscal: true,
        requiresFiscalAttention: false,
        nextStepPlan: planWithOpenDraft,
      }),
    ).toBe(true);
  });

  it("excepción post-cancel: monta aunque primary=invoice (D25)", () => {
    expect(
      shouldMountTripInvoicingConsole({
        trip: makeGateTrip({
          invoiceId: undefined,
          invoiceStatus: null,
          invoiceFolio: undefined,
        }),
        hasPostCancelFiscal: true,
        requiresFiscalAttention: false,
        nextStepPlan: planInvoiceOnly,
      }),
    ).toBe(true);
  });

  it("sin guía de facturación: PD2 intacto (monta con contenido)", () => {
    expect(
      shouldMountTripInvoicingConsole({
        trip: makeGateTrip(),
        hasPostCancelFiscal: false,
        requiresFiscalAttention: false,
        nextStepPlan: planTrackingOnly,
      }),
    ).toBe(true);
  });

  it("sin contenido de banda: no monta aunque no tipa drafts", () => {
    expect(
      shouldMountTripInvoicingConsole({
        trip: makeGateTrip({
          invoiceId: undefined,
          invoiceStatus: null,
          invoiceFolio: undefined,
        }),
        hasPostCancelFiscal: false,
        requiresFiscalAttention: false,
        nextStepPlan: null,
      }),
    ).toBe(false);
  });
});
