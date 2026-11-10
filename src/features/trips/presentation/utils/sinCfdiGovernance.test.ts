import { describe, expect, it } from "vitest";
import type { SinCfdiMode } from "@boeltech/cfdi-domain";
import type { Trip } from "@features/trips/domain";
import {
  buildTripLiquidacionGovernance,
  resolveSinCfdiChangeKind,
  tierRequiresApproval,
} from "./sinCfdiGovernance";

function trip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    status: "scheduled",
    cfdiEmissionIntent: "emitir_cfdi",
    operationalOutcome: "standard",
    operationalCashCollectedAt: null,
    operationalCashAmount: null,
    operationalCash: null,
    invoicing: {
      hasActivePrincipalInvoice: false,
      invoiceStatus: null,
    },
    client: { cfdiReceptorProfile: "receptor_cfdi" },
    costs: { baseRate: 1000 },
    ...overrides,
  } as Trip;
}

describe("resolveSinCfdiChangeKind", () => {
  it("cliente Sin factura aplica directo", () => {
    expect(
      resolveSinCfdiChangeKind({
        mode: "comercial_only_clients",
        clientProfile: "comercial_only",
        requiresApproval: true,
      }),
    ).toBe("apply");
  });

  it("con paso y cliente Con factura pide autorización", () => {
    expect(
      resolveSinCfdiChangeKind({
        mode: "comercial_only_clients",
        clientProfile: "receptor_cfdi",
        requiresApproval: null,
      }),
    ).toBe("request");
  });

  it("permitido con motivo y sin paso aplica", () => {
    expect(
      resolveSinCfdiChangeKind({
        mode: "allowed_with_override",
        clientProfile: "receptor_cfdi",
        requiresApproval: false,
      }),
    ).toBe("apply");
  });

  it("no permitido bloquea", () => {
    expect(
      resolveSinCfdiChangeKind({
        mode: "disabled",
        clientProfile: "receptor_cfdi",
        requiresApproval: false,
      }),
    ).toBe("blocked");
  });
});

describe("tierRequiresApproval", () => {
  it("elige el tramo de mayor mínimo que cubre el monto", () => {
    expect(
      tierRequiresApproval(
        [
          { minAmount: 0, requiresApproval: false },
          { minAmount: 5000, requiresApproval: true },
        ],
        8000,
      ),
    ).toBe(true);
  });
});

describe("buildTripLiquidacionGovernance", () => {
  const base = {
    trip: trip(),
    canApprove: false,
    canCancel: false,
    canReadApprovals: false,
    mode: "allowed_with_override" as SinCfdiMode,
    requiresApproval: false,
  };

  it("regularizar visible con trips_settlement.update", () => {
    const governance = buildTripLiquidacionGovernance({
      ...base,
      trip: trip({
        status: "in_progress",
        cfdiEmissionIntent: "sin_cfdi_efectivo",
      }),
      canRequest: false,
      canRegularize: true,
    });
    expect(governance?.canRegularize).toBe(true);
  });

  it("despachador no regulariza", () => {
    const governance = buildTripLiquidacionGovernance({
      ...base,
      trip: trip({
        status: "in_progress",
        cfdiEmissionIntent: "sin_cfdi_efectivo",
      }),
      canRequest: true,
      canRegularize: false,
    });
    expect(governance?.canRegularize).toBe(false);
  });
});
