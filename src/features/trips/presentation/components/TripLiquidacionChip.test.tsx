import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import type { Trip } from "@features/trips/domain";
import { cfdiEmissionIntentCopy } from "../copy/cfdiEmissionIntentCopy";
import {
  TripLiquidacionChip,
  type TripLiquidacionGovernance,
} from "./TripLiquidacionChip";

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
});
