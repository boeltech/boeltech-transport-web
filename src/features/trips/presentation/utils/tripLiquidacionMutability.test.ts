import { describe, expect, it } from "vitest";

import { TripStatus } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import {
  canEditTripLiquidacionIntent,
  isPrincipalInvoiceLocking,
  tripLiquidacionInvoiceOrCashLockMessage,
} from "./tripLiquidacionMutability";

describe("isPrincipalInvoiceLocking", () => {
  it("draft does not lock (F0 allow)", () => {
    expect(
      isPrincipalInvoiceLocking({
        hasActivePrincipalInvoice: true,
        invoiceStatus: "draft",
      }),
    ).toBe(false);
  });

  it("stamped / cancellation_pending lock", () => {
    expect(
      isPrincipalInvoiceLocking({
        hasActivePrincipalInvoice: true,
        invoiceStatus: "stamped",
      }),
    ).toBe(true);
    expect(
      isPrincipalInvoiceLocking({
        hasActivePrincipalInvoice: true,
        invoiceStatus: "cancellation_pending",
      }),
    ).toBe(true);
  });

  it("no principal does not lock", () => {
    expect(
      isPrincipalInvoiceLocking({
        hasActivePrincipalInvoice: false,
        invoiceStatus: null,
      }),
    ).toBe(false);
  });
});

describe("canEditTripLiquidacionIntent", () => {
  const base = {
    status: TripStatus.SCHEDULED,
    cfdiEmissionIntent: "emitir_cfdi" as const,
    operationalCashCollectedAt: null as Date | null,
    operationalOutcome: "standard" as const,
    invoicing: tripInvoicingFixture({
      hasActivePrincipalInvoice: false,
      invoiceStatus: null,
    }),
  };

  it("allows scheduled without invoice/cash when can update", () => {
    expect(
      canEditTripLiquidacionIntent(base, {
        canUpdateTrip: true,
        isLeanTripPortal: false,
      }),
    ).toBe(true);
  });

  it("denies completed even with trips.update (screenshot CEO)", () => {
    expect(
      canEditTripLiquidacionIntent(
        { ...base, status: TripStatus.COMPLETED },
        { canUpdateTrip: true },
      ),
    ).toBe(false);
  });

  it("denies cancelled", () => {
    expect(
      canEditTripLiquidacionIntent(
        { ...base, status: TripStatus.CANCELLED },
        { canUpdateTrip: true },
      ),
    ).toBe(false);
  });

  it("allows with draft invoice", () => {
    expect(
      canEditTripLiquidacionIntent(
        {
          ...base,
          invoicing: tripInvoicingFixture({
            hasActivePrincipalInvoice: true,
            invoiceStatus: "draft",
          }),
        },
        { canUpdateTrip: true },
      ),
    ).toBe(true);
  });

  it("denies stamped invoice", () => {
    expect(
      canEditTripLiquidacionIntent(
        {
          ...base,
          invoicing: tripInvoicingFixture({
            hasActivePrincipalInvoice: true,
            invoiceStatus: "stamped",
          }),
        },
        { canUpdateTrip: true },
      ),
    ).toBe(false);
  });

  it("denies after operational cash", () => {
    expect(
      canEditTripLiquidacionIntent(
        {
          ...base,
          cfdiEmissionIntent: "sin_cfdi_efectivo",
          operationalCashCollectedAt: new Date("2026-09-21T12:00:00.000Z"),
        },
        { canUpdateTrip: true },
      ),
    ).toBe(false);
  });

  it("denies after partial ledger summary without collectedAt projection race", () => {
    expect(
      canEditTripLiquidacionIntent(
        {
          ...base,
          cfdiEmissionIntent: "sin_cfdi_efectivo",
          operationalCashCollectedAt: null,
          operationalCash: {
            status: "partial",
            collectedTotal: 10000,
            pendingAmount: 14500,
            baseRate: 24500,
            receiptCount: 1,
          },
        },
        { canUpdateTrip: true },
      ),
    ).toBe(false);
  });

  it("denies without trips.update", () => {
    expect(
      canEditTripLiquidacionIntent(base, { canUpdateTrip: false }),
    ).toBe(false);
  });
});

describe("tripLiquidacionInvoiceOrCashLockMessage", () => {
  const base = {
    status: TripStatus.SCHEDULED,
    cfdiEmissionIntent: "emitir_cfdi" as const,
    operationalCashCollectedAt: null as Date | null,
    operationalOutcome: "standard" as const,
    invoicing: tripInvoicingFixture({
      hasActivePrincipalInvoice: false,
      invoiceStatus: null,
    }),
  };

  it("omits a reason when only the status blocks", () => {
    expect(
      tripLiquidacionInvoiceOrCashLockMessage({
        ...base,
        status: TripStatus.IN_PROGRESS,
      }),
    ).toBeNull();
  });

  it("names the invoice lock", () => {
    expect(
      tripLiquidacionInvoiceOrCashLockMessage({
        ...base,
        invoicing: tripInvoicingFixture({
          hasActivePrincipalInvoice: true,
          invoiceStatus: "stamped",
        }),
      }),
    ).toBe(
      "No se puede cambiar la Factura del viaje: el viaje ya tiene una factura vigente.",
    );
  });

  it("names the cash lock even when the trip is already in progress", () => {
    expect(
      tripLiquidacionInvoiceOrCashLockMessage({
        ...base,
        status: TripStatus.IN_PROGRESS,
        cfdiEmissionIntent: "sin_cfdi_efectivo",
        operationalCashCollectedAt: new Date("2026-09-21T12:00:00.000Z"),
      }),
    ).toBe(
      "No se puede cambiar la Factura del viaje: ya hay un cobro en efectivo registrado.",
    );
  });
});
