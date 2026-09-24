import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import type { Trip } from "@features/trips/domain";
import { cfdiEmissionIntentCopy } from "../copy/cfdiEmissionIntentCopy";
import { TripLiquidacionChip } from "./TripLiquidacionChip";

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

function renderChip(trip: Trip, canEdit = true) {
  return render(
    <MemoryRouter>
      <TripLiquidacionChip trip={trip} canEdit={canEdit} />
    </MemoryRouter>,
  );
}

describe("TripLiquidacionChip — header meta (ADR-0096)", () => {
  it("editable sin_cfdi: un solo control Select, sin chip duplicado", () => {
    renderChip(makeTrip({ cfdiEmissionIntent: "sin_cfdi_efectivo" }), true);

    expect(
      screen.getByRole("combobox", {
        name: cfdiEmissionIntentCopy.field.label,
      }),
    ).toBeInTheDocument();
    // SelectValue muestra el option; no debe haber un Badge hermano con el mismo copy.
    expect(
      screen.getAllByText(cfdiEmissionIntentCopy.options.sin_cfdi_efectivo),
    ).toHaveLength(1);
  });

  it("editable emitir_cfdi: Select visible para descubrimiento", () => {
    renderChip(makeTrip({ cfdiEmissionIntent: "emitir_cfdi" }), true);

    expect(
      screen.getByRole("combobox", {
        name: cfdiEmissionIntentCopy.field.label,
      }),
    ).toBeInTheDocument();
  });

  it("solo lectura sin_cfdi: badge, sin Select", () => {
    renderChip(makeTrip({ cfdiEmissionIntent: "sin_cfdi_efectivo" }), false);

    expect(
      screen.getByText(cfdiEmissionIntentCopy.chip.sinCfdi),
    ).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("solo lectura emitir_cfdi: no renderiza nada", () => {
    const { container } = renderChip(
      makeTrip({ cfdiEmissionIntent: "emitir_cfdi" }),
      false,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("completed + facturado: canEdit false → sin Select (CEO)", () => {
    renderChip(
      makeTrip({
        status: "completed" as never,
        cfdiEmissionIntent: "emitir_cfdi",
      }),
      false,
    );
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
