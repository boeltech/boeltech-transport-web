import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import type { Trip, TripSettlementException } from "@features/trips/domain";
import { cfdiEmissionIntentCopy } from "../copy/cfdiEmissionIntentCopy";
import {
  TripLiquidacionChip,
  type TripLiquidacionGovernance,
} from "./TripLiquidacionChip";

function makeOpenRequest(
  overrides: Partial<TripSettlementException> = {},
): TripSettlementException {
  return {
    id: "ex-1",
    tripId: "trip-1",
    status: "in_progress",
    reason: "Motivo de solicitud largo",
    requestedBy: "user-1",
    approvalInstanceId: null,
    createdAt: new Date("2026-11-01T12:00:00.000Z"),
    updatedAt: new Date("2026-11-01T12:00:00.000Z"),
    closedAt: null,
    approval: null,
    ...overrides,
  };
}

vi.mock("@features/trips/application", () => ({
  useUpdateTrip: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    tripCode: "TRP-1",
    cfdiEmissionIntent: "sin_cfdi_efectivo",
    client: { cfdiReceptorProfile: "receptor_cfdi" },
    ...overrides,
  } as Trip;
}

function renderChip(
  trip: Trip,
  governance: TripLiquidacionGovernance | null = null,
) {
  return render(
    <MemoryRouter>
      <TripLiquidacionChip trip={trip} governance={governance} />
    </MemoryRouter>,
  );
}

describe("TripLiquidacionChip — header meta (ADR-0096)", () => {
  it("sin gobierno: badge, sin Select", () => {
    renderChip(makeTrip({ cfdiEmissionIntent: "sin_cfdi_efectivo" }));

    expect(
      screen.getByText(cfdiEmissionIntentCopy.chip.sinCfdi),
    ).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("solo lectura sin_cfdi: badge, sin Select", () => {
    renderChip(makeTrip({ cfdiEmissionIntent: "sin_cfdi_efectivo" }));

    expect(
      screen.getByText(cfdiEmissionIntentCopy.chip.sinCfdi),
    ).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("solo lectura emitir_cfdi: badge Con factura, sin Select", () => {
    renderChip(makeTrip({ cfdiEmissionIntent: "emitir_cfdi" }));

    expect(
      screen.getByText(cfdiEmissionIntentCopy.chip.conCfdi),
    ).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("completed + facturado: sin gobierno → sin Select", () => {
    renderChip(
      makeTrip({
        status: "completed" as never,
        cfdiEmissionIntent: "emitir_cfdi",
      }),
    );
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("con paso abre el diálogo Solicitar Sin factura", async () => {
    const user = userEvent.setup();
    renderChip(makeTrip({ cfdiEmissionIntent: "emitir_cfdi" }), {
      canOpenSinCfdi: true,
      changeKind: "request",
      canRegularize: false,
      regularizeCashLocked: false,
      openRequest: null,
      canApprove: false,
      canCancel: false,
      approvalsHref: null,
    });
    await user.click(
      screen.getByRole("button", {
        name: cfdiEmissionIntentCopy.governance.changeCta,
      }),
    );
    expect(
      screen.getByRole("button", {
        name: cfdiEmissionIntentCopy.governance.requestSinCfdi,
      }),
    ).toBeInTheDocument();
  });

  it("sin paso abre el diálogo Usar Sin factura", async () => {
    const user = userEvent.setup();
    renderChip(makeTrip({ cfdiEmissionIntent: "emitir_cfdi" }), {
      canOpenSinCfdi: true,
      changeKind: "apply",
      canRegularize: false,
      regularizeCashLocked: false,
      openRequest: null,
      canApprove: false,
      canCancel: false,
      approvalsHref: null,
    });
    await user.click(
      screen.getByRole("button", {
        name: cfdiEmissionIntentCopy.governance.changeCta,
      }),
    );
    expect(
      screen.getByRole("button", {
        name: cfdiEmissionIntentCopy.governance.useSinCfdi,
      }),
    ).toBeInTheDocument();
  });

  it("con regularizeCashLocked no muestra cashFreeze inline (freeze va a alerts)", () => {
    renderChip(makeTrip({ cfdiEmissionIntent: "sin_cfdi_efectivo" }), {
      canOpenSinCfdi: false,
      changeKind: "apply",
      canRegularize: false,
      regularizeCashLocked: true,
      openRequest: null,
      canApprove: false,
      canCancel: false,
      approvalsHref: null,
    });
    expect(
      screen.queryByText(cfdiEmissionIntentCopy.governance.cashFreeze),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/congelado/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: cfdiEmissionIntentCopy.governance.history,
      }),
    ).toBeInTheDocument();
  });

  it("regularize: description Con factura; no reusa body Sin", async () => {
    const user = userEvent.setup();
    const g = cfdiEmissionIntentCopy.governance;
    renderChip(makeTrip({ cfdiEmissionIntent: "sin_cfdi_efectivo" }), {
      canOpenSinCfdi: false,
      changeKind: "apply",
      canRegularize: true,
      regularizeCashLocked: false,
      openRequest: null,
      canApprove: false,
      canCancel: false,
      approvalsHref: null,
    });
    await user.click(
      screen.getByRole("button", { name: g.regularizeCta }),
    );
    expect(screen.getByRole("heading", { name: g.dialogTitleRegularize })).toBeInTheDocument();
    expect(screen.getByText(g.dialogBodyRegularize)).toBeInTheDocument();
    expect(screen.queryByText(g.dialogBodySin)).not.toBeInTheDocument();
    expect(screen.queryByText(/no aparecerá en Por facturar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no llevará Carta Porte/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(cfdiEmissionIntentCopy.complianceNotice),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(g.reasonLabel)).toBeInTheDocument();
  });

  it("sin apply: body Sin + complianceNotice + título Pasar", async () => {
    const user = userEvent.setup();
    const g = cfdiEmissionIntentCopy.governance;
    renderChip(makeTrip({ cfdiEmissionIntent: "emitir_cfdi" }), {
      canOpenSinCfdi: true,
      changeKind: "apply",
      canRegularize: false,
      regularizeCashLocked: false,
      openRequest: null,
      canApprove: false,
      canCancel: false,
      approvalsHref: null,
    });
    await user.click(
      screen.getByRole("button", { name: g.changeCta }),
    );
    expect(screen.getByRole("heading", { name: g.dialogTitleSin })).toBeInTheDocument();
    expect(screen.getByText(g.dialogBodySin)).toBeInTheDocument();
    expect(
      screen.getByText(cfdiEmissionIntentCopy.complianceNotice),
    ).toBeInTheDocument();
  });

  it("reject: body Con factura; sin complianceNotice", async () => {
    const user = userEvent.setup();
    const g = cfdiEmissionIntentCopy.governance;
    renderChip(makeTrip({ cfdiEmissionIntent: "emitir_cfdi" }), {
      canOpenSinCfdi: false,
      changeKind: "request",
      canRegularize: false,
      regularizeCashLocked: false,
      openRequest: makeOpenRequest(),
      canApprove: true,
      canCancel: false,
      approvalsHref: null,
    });
    await user.click(screen.getByRole("button", { name: g.reject }));
    expect(screen.getByRole("heading", { name: g.dialogTitleReject })).toBeInTheDocument();
    expect(screen.getByText(g.dialogBodyReject)).toBeInTheDocument();
    expect(screen.queryByText(g.dialogBodySin)).not.toBeInTheDocument();
    expect(
      screen.queryByText(cfdiEmissionIntentCopy.complianceNotice),
    ).not.toBeInTheDocument();
  });
});
